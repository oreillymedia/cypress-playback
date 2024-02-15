const { SERIALIZE_VERSION } = require('../constants');
const { getInterceptedResponseId } = require('../functions/getInterceptedResponseId');
const { getMatcherAsString } = require('../functions/getMatcherAsString');
const { PlaybackRequestMatcher } = require('./PlaybackRequestMatcher');

class PlaybackRequestMap {
  /**
   * @type {string}
   */
  #file = null;
  get file() { return this.#file; }

  /**
   * @type {string}
   */
  #title = null;
  get title() { return this.#title; }

  /**
   * @type {Map<string, PlaybackRequestMatcher>}
   */
  #map = null;

  #sealed = false;

  constructor(file, title, data = null) {
    if (!file || !title) {
      throw new Error('PlaybackRequestMap: file and title are required.');
    }
    this.#file = file;
    this.#title = title;

    this.deserialize(data);
  }

  /**
   * @param {RequestMethod} method
   * @param {CypressRouteMatcher} routeMatcher
   * @param {RequestMatcherOptions} options
   * @returns
   */
  add(method, routeMatcher, options = {}) {
    if (this.#sealed) {
      throw new Error(`Cannot add request matcher to sealed request map. Matcher: ${getMatcherAsString(routeMatcher)}`);
    }

    const matcher = new PlaybackRequestMatcher(method, routeMatcher, options);
    if (!this.#map.has(matcher.id)) {
      this.#map.set(matcher.id, matcher);
    } else {
      const existingRequest = this.#map.get(matcher.id);
      existingRequest.stale = false;
    }
    return matcher.id;
  }

  /**
   * @param {string} matcherId
   * @param {CypressInterceptedRequest} interceptedRequest
   * @param {CypressInterceptedResponse} interceptedResponse
   */
  addResponse(matcherId, interceptedRequest, { statusCode, statusMessage, body, headers }) {
    if (this.#sealed) {
      throw new Error(`Cannot add response to sealed request map. Url: ${interceptedRequest.url}`);
    }

    const matcher = this.#map.get(matcherId);

    if (!matcher) {
      throw new Error(`No request matcher found with id: ${matcherId}`);
    }
    matcher.addResponse(
      statusCode,
      statusMessage,
      body,
      headers,
      interceptedRequest
    );
  }

  /**
   * @param {string} matcherId
   * @param {CypressInterceptedRequest} interceptedRequest}
   * @param {RequestMatcherOptions} [options]
   * @returns {PlaybackResponse}
   */
  getResponse(matcherId, interceptedRequest, options = {}) {
    const matcher = this.#map.get(matcherId);
    if (!matcher) {
      throw new Error(`No request matcher found with id: ${matcherId}`);
    }
    const responseCollection = matcher.getResponseCollection(getInterceptedResponseId(
      interceptedRequest,
      /* c8 ignore next*/
      options.matching?.ignores ?? []
    ), interceptedRequest.url);

    return responseCollection.getNextResponse();
  }

  notifyRequestStarted(matcherId) {
    const matcher = this.#map.get(matcherId);
    if (!matcher) {
      throw new Error(`No request matcher found with id: ${matcherId}`);
    }
    matcher.notifyRequestStarted();
  }

  notifyRequestCompleted(matcherId) {
    const matcher = this.#map.get(matcherId);
    if (!matcher) {
      throw new Error(`No request matcher found with id: ${matcherId}`);
    }
    matcher.notifyRequestCompleted();
  }

  hasPendingRequests() {
    for (const matcher of this.#map.values()) {
      if (matcher.isPending()) {
        return true;
      }
    }
    return false;
  }

  getPendingRequests() {
    return Array.from(this.#map.values())
      .filter(matcher => matcher.isPending());
  }

  getAll() {
    return Array.from(this.#map.values());
  }

  /**
   * Removes stale request matchers and prevents new matchers from being added
   * to the map.
   */
  seal() {
    this.#sealed = true;
    for (const matcher of this.#map.values()) {
      if (matcher.stale) {
        this.#map.delete(matcher.id);
      }
    }
  }

  /**
   * @returns {SerializedPlaybackData}
   */
  serialize() {
    return {
      version: SERIALIZE_VERSION,
      matchers: Array.from(this.#map.values())
        .map(matcher => matcher.serialize())
    };
  }

  /**
   * @param {SerializedPlaybackData} data
   */
  deserialize(data) {
    this.#map = new Map();
    if (!data) {
      return;
    }
    if (data?.version !== SERIALIZE_VERSION) {
      console.warn('CYPRESS PLAYBACK:', `Request data version is out-of-date. Data version "${data?.version}", current version is "${SERIALIZE_VERSION}".`);
      return;
    }
    if (data?.matchers?.length) {
      for (const entry of data.matchers) {
        const matcher = new PlaybackRequestMatcher(entry);
        this.#map.set(matcher.id, matcher);
      }
    }
  }
}

module.exports = {
  PlaybackRequestMap
};
