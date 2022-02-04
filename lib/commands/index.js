/// <reference types="../cypress" />

const { CONFIG_KEY } = require('./constants.js');
const { PlaybackRequestMap } = require('./entities/PlaybackRequestMap.js');
const { getPlaybackMode } = require('./functions/getPlaybackMode.js');
const { getTestMetadata } = require('./functions/getTestMetadata.js');
const { isPlaybackMode } = require('./functions/isPlaybackMode.js');

before(function playbackBefore() {
  Cypress.log({
    name: 'assert',
    displayName: 'Playback',
    message: `Mode: "${getPlaybackMode()}"`
  });
});

beforeEach(function playbackBeforeEach() {
  /**
   * @type {PlaybackRequestMap | null}
   */
  let map = null;
  return cy.wrap(isPlaybackMode('playback'), { log: false })
    .then((isPlayingBack) => {
      const { file, title } = getTestMetadata(this);
      if (isPlayingBack) {
        return cy.task('cypress-playback:load', { file, title })
          .then(data => {
            if (data) {
              map = new PlaybackRequestMap(file, title, data);
            } else {
              map = new PlaybackRequestMap(file, title);
            }
          });
      } else {
        map = new PlaybackRequestMap(file, title);
      }
    })
    .then(() => {
      Cypress.config(CONFIG_KEY, map);
    });
});

afterEach(function playbackAfterEach() {
  const { state } = getTestMetadata(this);
  if (state === 'failed' || !isPlaybackMode('record')) {
    return;
  }

  let hasPendingRequests = false;
  const map = Cypress.config(CONFIG_KEY);
  const log = Cypress.log({
    autoEnd: false,
    name: 'assert',
    displayName: 'Playback',
    message: 'Checking for pending requests...',
    consoleProps: () => ({
      'Pending Requests': [],
      'All Requests': [],
    })
  });

  const intervalMs = 500;
  const waitMaxMs = 10000;

  cy.window({ log: false })
    .then({ timeout: waitMaxMs }, () => {
      return new Cypress.Promise((resolve) => {
        const maxIter = waitMaxMs / intervalMs;
        let currentIter = 0;
        const handle = setInterval(() => {
          hasPendingRequests = map.hasPendingRequests();
          currentIter += 1;
          if (!hasPendingRequests || currentIter >= maxIter) {
            clearInterval(handle);
            resolve();
          }
        }, intervalMs);
      });
    })
    .then(() => {
      const allRequests = map.getAll().map(request => {
        return {
          matcher: `${request.method} ${request.matcher}`,
          responses: request.getAllResponses().map(response => response.serialize())
        };
      });

      if (map.hasPendingRequests()) {
        const pendingRequests = map.getPendingRequests().map(request => `${request.method} ${request.matcher}`);
        // Update the log for the error state.
        log.set('message', `${pendingRequests.length} pending requests.`)
          .set('consoleProps', () => ({
            'Pending Requests': pendingRequests,
            'All Requests': allRequests,
          }))
          .error()
          .end();
        this.currentTest.state = 'failed';
        return;
      }

      log.set('message', 'No pending requests.')
        .set('consoleProps', () => ({
          'Pending Requests': [],
          'All Requests': allRequests,
        }))
        .end();

      // Sealing the map will cause errors to be thrown if we try to add new
      // responses to the map.
      map.seal();
      return cy.task('cypress-playback:record', {
        file: map.file,
        title: map.title,
        data: map.serialize()
      }, { log: false });
    });
});

const playback = {
  name: 'playback',
  options: { prevSubject: false },
  command: function (method, routeMatcher, options) {
    /**
     * @type {PlaybackRequestMap}
     */
    const map = Cypress.config(CONFIG_KEY);
    const id = map.add(method, routeMatcher, options);

    return cy.intercept(method, routeMatcher, (req) => {
      if (isPlaybackMode('playback')) {
        const response = map.getResponse(id, req, options);
        if (response) {
          try {
            // We need to delete the 'content-encoding' header, as the recorded
            // response will not have the body in that format.
            // Notes on 'content-encoding':
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding
            delete response.headers['content-encoding'];
            req.reply(response.statusCode, response.body, response.headers);
          } catch (e) {
            console.error(response);
            throw e;
          }
          return;
        } else if (!isPlaybackMode('hybrid')) {
          // TODO: Improve error message.
          Cypress.log({
            name: 'assert',
            displayName: 'Playback',
            message: 'No response found for request.',
            consoleProps: () => ({
              'Request Url': `${req.method} ${req.url}`,
              'Expected Response Id': id,
            })
          }).error();
          const message = `CYPRESS PLAYBACK: No response found for request '${req.method} ${req.url}'`;
          req.reply({ statusCode: 404, body: { message } });
          throw new Error(message);
        }
      }

      if (isPlaybackMode('record')) {
        map.notifyRequestStarted(id);
        // Make sure we don't get a cached response.
        delete req.headers['if-none-match'];

        let originalRequestData = null;
        if (typeof options?.rewriteOrigin === 'string') {
          originalRequestData = {
            url: req.url,
            headers: { ...req.headers }
          };

          // Update the URL.
          const rewriteUrl = new URL(options.rewriteOrigin, req.url);
          const url = new URL(req.url);
          rewriteUrl.search = new URLSearchParams(req.query);
          rewriteUrl.pathname = url.pathname;

          // Update the headers.
          req.headers.host = rewriteUrl.host;
          req.headers.origin = rewriteUrl.origin;
          req.headers.referer = rewriteUrl.href;

          req.url = rewriteUrl.toString();
        }

        req.on('response', (res) => {
          map.notifyRequestCompleted(id);
          // Make sure the browser does not try to use a cached response.
          res.headers['cache-control'] = 'no-cache';
          if (res.headers['access-control-allow-origin']) {
            // Allow all origins, as this respones may be played back on a
            // different origin.
            res.headers['access-control-allow-origin'] = '*';
          }

          if (originalRequestData) {
            // Restore original request data, so that we generate a response id
            // with unmodified values.
            req.url = originalRequestData.url;
            req.headers = originalRequestData.headers;
          }

          if (
            (res.statusCode >= 200 && res.statusCode < 300)
            || options?.allowAllStatusCodes
          ) {
            map.addResponse(id, req, res);
          } else {
            Cypress.log({
              autoEnd: false,
              name: 'playback',
              displayName: 'Playback',
              message: `Response for request '${req.method}:${req.url}' returned status code ${res.statusCode}`,
              consoleProps: () => ({
                Message: 'Non-2xx response code.',
                Method: res.method,
                Url: res.url,
                Headers: res.headers,
                'Status Code': res.statusCode,
              })
            }).error().end();
          }
          res.send();
        });
      }
    });
  }
};

const isRecordingRequests = {
  name: 'isRecordingRequests',
  options: { prevSubject: false },
  command: function () {
    return cy.wrap(isPlaybackMode('record'), { log: false });
  }
};

const isPlayingBackRequests = {
  name: 'isPlayingBackRequests',
  options: { prevSubject: false },
  command: function () {
    return cy.wrap(isPlaybackMode('playback'), { log: false });
  }
};

module.exports = {
  commands: [
    isPlayingBackRequests,
    isRecordingRequests,
    playback,
  ]
};