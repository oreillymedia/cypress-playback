const { SERIALIZE_VERSION } = require('../../constants');
const { resetModule } = require('../../../tests/utils');

// Mocked dependencies.
const getRequestMatcherId = td.func();
const getInterceptedResponseId = td.func();

// Subject-under-test
let PlaybackRequestMap;

function createSerializedMap(matcherCount = 1, responseCount = 1) {
  const matchers = [];
  for (let i = 1; i <= matcherCount; i++) {
    const responses = [];
    for (let j = 1; j <= responseCount; j++) {
      responses.push({
        id: `mock-intercepted-response-id-${j}`,
        statusCode: 200,
        statusMessage: 'OK',
        body: 'body-string',
        bodyType: 'string',
        headers: { 'mock-header': 'yes' },
      });
    }
    matchers.push({
      id: `mock-request-id-${i}`,
      minTimes: responseCount,
      responses
    });
  }
  return { version: SERIALIZE_VERSION, matchers };
}

describe('PlaybackRequestMap', () => {
  before(() => {
    // Tests for PlaybackResponse may have already run and replaced a dependency
    // we are mocking below. Resetting the module will ensure it gets our mock.
    resetModule(/entities\/PlaybackResponse.js$/);

    td.replace('../../functions/getRequestMatcherId', { getRequestMatcherId });
    td.replace('../../functions/getInterceptedResponseId', { getInterceptedResponseId });

    ({ PlaybackRequestMap } = require('../PlaybackRequestMap'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('constructor', () => {
    it('should create a new instance', () => {
      // Act
      const playbackRequestMap = new PlaybackRequestMap('file-1', 'title-1');

      // Assert
      expect(playbackRequestMap.file).to.equal('file-1');
      expect(playbackRequestMap.title).to.equal('title-1');
      expect(playbackRequestMap.getAll()).to.deep.equal([]);
      expect(playbackRequestMap.hasPendingRequests()).to.be.false;
      expect(playbackRequestMap.getPendingRequests()).to.have.length(0);
    });

    it('throws when not given the right arguments', () => {
      expect(() => new PlaybackRequestMap('file-1')).to.throw()
        .property('message').to.match(/file and title are required/i);

      expect(() => new PlaybackRequestMap(null, 'title-1')).to.throw()
        .property('message').to.match(/file and title are required/i);
    });
  });

  describe('deserialization', () => {
    it('works', () => {
      // Arrange
      const serializedMap = createSerializedMap(1, 2);

      // Setup mocks to return ids from the mock responses.
      td.when(getInterceptedResponseId({ stuff: 1 }, td.matchers.anything()))
        .thenReturn(serializedMap.matchers[0].responses[0].id);
      td.when(getInterceptedResponseId({ stuff: 2 }, td.matchers.anything()))
        .thenReturn(serializedMap.matchers[0].responses[1].id);

      // Act
      const map = new PlaybackRequestMap('file-1', 'title-1', serializedMap);
      const responseId = serializedMap.matchers[0].id;

      // Assert
      expect(map.file).to.equal('file-1');
      expect(map.title).to.equal('title-1');
      expect(map.getAll()).to.have.lengthOf(1);

      // We added a single request above with two responses, but since it was
      // deserialized, it was considered "stale". That means we don't consider
      // it pending.
      expect(map.hasPendingRequests()).to.be.false;
      expect(map.getPendingRequests()).to.have.length(0);

      // Act
      // Simulate two requests "inflight" for this matcher.
      map.notifyRequestStarted(serializedMap.matchers[0].id);
      map.notifyRequestStarted(serializedMap.matchers[0].id);

      // Resolve the 1st request.
      map.notifyRequestCompleted(serializedMap.matchers[0].id);
      expect(map.getResponse(responseId, { stuff: 1 })).to.be.ok;

      // Since we retrieved a response from the single request, it is no longer
      // considered stale, and we are now waiting for the 2nd response to be
      // retrieived.
      expect(map.hasPendingRequests()).to.be.true;
      expect(map.getPendingRequests()).to.have.length(1);

      // Resolve the 2nd response.
      map.notifyRequestCompleted(serializedMap.matchers[0].id);
      expect(map.getResponse(responseId, { stuff: 2 })).to.be.ok;

      // Now both responses on the request were retrieved, so the request is no
      // longer considered pending.
      expect(map.hasPendingRequests()).to.be.false;
    });

    it('handles adding the same request twice.', () => {
      // Arrange
      const serializedMap = createSerializedMap(1, 2);
      const responseId = serializedMap.matchers[0].id;

      // This will cause the existing request id to be returned.
      td.when(getRequestMatcherId('GET', '/example', { minTimes: 2 }))
        .thenReturn(responseId);

      const map = new PlaybackRequestMap('file-1', 'title-1', serializedMap);

      // Assert
      expect(map.hasPendingRequests()).to.be.false;

      // Act
      map.add('GET', '/example', { minTimes: 2 });

      // Assert
      expect(map.hasPendingRequests()).to.be.true;
    });

    it('refuses to deserialize an incorrect version.', () => {
      td.replace(console, 'warn');

      new PlaybackRequestMap('file-1', 'title-1', { ...createSerializedMap(), version: -1 });

      td.verify(console.warn('CYPRESS PLAYBACK:', td.matchers.anything()));
    });
  });

  describe('adding responses and serialization', () => {
    it('works', () => {
      // Arrange
      td.when(getRequestMatcherId('GET', '/example', { minTimes: 2 }))
        .thenReturn('mock-request-matcher-id');

      // Setup mocks to return ids from the mock responses.
      td.when(getInterceptedResponseId({ stuff: 1 }, td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id-1');
      td.when(getInterceptedResponseId({ stuff: 2 }, td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id-2');

      const map = new PlaybackRequestMap('file-1', 'title-1');

      // Assert
      expect(map.hasPendingRequests()).to.be.false;

      // Act
      const id = map.add('GET', '/example', { minTimes: 2 });

      // Assert
      expect(map.hasPendingRequests()).to.be.true;

      // Act - Add the response twice, as we set minTimes to 2.
      const response = { statusCode: 200, statusMessage: 'OK', headers: { 'mock-header': 'yes' } };
      map.addResponse(id, { stuff: 1 }, { ...response, body: 'body-string-1' });
      map.addResponse(id, { stuff: 2 }, { ...response, body: 'body-string-2' });

      // Assert
      expect(map.hasPendingRequests()).to.be.false;

      expect(map.serialize()).to.deep.equal({
        version: SERIALIZE_VERSION,
        matchers: [{
          id: 'mock-request-matcher-id',
          ignoredAttributes: [],
          method: 'GET',
          matcher: '/example',
          minTimes: 2,
          responses: [
            {
              id: 'mock-intercepted-response-id-1',
              statusCode: 200,
              statusMessage: 'OK',
              body: 'body-string-1',
              bodyType: 'string',
              headers: { 'mock-header': 'yes' },
            },
            {
              id: 'mock-intercepted-response-id-2',
              statusCode: 200,
              statusMessage: 'OK',
              body: 'body-string-2',
              bodyType: 'string',
              headers: { 'mock-header': 'yes' },
            },
          ]
        }]
      });
    });

    it('throws if the request cannot be found', () => {
      const map = new PlaybackRequestMap('file-1', 'title-1');
      expect(() => map.addResponse('mock-id', {}, {})).to.throw()
        .property('message').to.match(/No request matcher found with id/);

      expect(() => map.notifyRequestStarted('mock-id')).to.throw()
        .property('message').to.match(/No request matcher found with id/);

      expect(() => map.notifyRequestCompleted('mock-id')).to.throw()
        .property('message').to.match(/No request matcher found with id/);
    });
  });

  describe('seal', () => {
    it('works', () => {
      // Arrange
      const serializedMap = createSerializedMap(2, 1);

      // Setup mocks to return ids from the mock responses.
      td.when(getInterceptedResponseId({ stuff: 1 }, td.matchers.anything()))
        .thenReturn(serializedMap.matchers[0].responses[0].id);

      const map = new PlaybackRequestMap('file-1', 'title-1', serializedMap);

      // Assert
      expect(map.getAll()).to.have.lengthOf(2);

      // Act

      // Creating a mock request flow here, by starting and completing a
      // request.
      map.notifyRequestStarted(serializedMap.matchers[0].id);
      map.notifyRequestCompleted(serializedMap.matchers[0].id);

      // Now seal it.
      map.seal();

      // Assert - We removed the stale request.
      expect(map.getAll()).to.have.lengthOf(1);

      // Check the expected errors are thrown.
      expect(() => map.getResponse(serializedMap.matchers[1].id, { stuff: 1 })).to.throw()
        .property('message').to.match(/No request matcher found/i);
      expect(() => map.add('GET', '/example')).to.throw()
        .property('message').to.match(/Cannot add request matcher to sealed request map/i);
      expect(() => map.addResponse(serializedMap.matchers[1].id, { stuff: 1 }, {})).to.throw()
        .property('message').to.match(/Cannot add response to sealed request map/i);
    });
  });
});