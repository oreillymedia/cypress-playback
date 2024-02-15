const { resetModule } = require('../../../tests/utils');

// Mocked dependencies.
const getRequestMatcherId = td.func();
const getInterceptedResponseId = td.func();
let PlaybackResponseCollection;

// Subject-under-test
let PlaybackRequestMatcher;

function createConstructorArgs(method, matcher, options = {}) {
  return [method, matcher, options];
}

function createSerializedRequestMatcher(
  id,
  atLeast,
  responseCount,
  anyOnce = false,
  ignores = []
) {
  const responseCollections = [];
  for (let i = 0; i < responseCount; i++) {
    responseCollections.push({
      id: `mock-intercepted-response-id-${i + 1}`,
      method: 'GET',
      matcher: '/foo/bar',
      responses: [{
        statusCode: 200,
        statusMessage: 'OK',
        body: 'body-string',
        bodyType: 'string',
        headers: { 'mock-header': 'yes' },
      }]
    });
  }
  return { id, atLeast, anyOnce, ignores, responseCollections };
}

function createOldSerializedRequestMatcher(
  id,
  atLeast,
  responseCount,
  anyOnce = false,
  ignores = []
) {
  const responses = [];
  for (let i = 0; i < responseCount; i++) {
    responses.push({
      id: `mock-intercepted-response-id-${i + 1}`,
      method: 'GET',
      matcher: '/foo/bar',
      statusCode: 200,
      statusMessage: 'OK',
      body: 'body-string',
      bodyType: 'string',
      headers: { 'mock-header': 'yes' },
    });
  }
  return { id, atLeast, anyOnce, ignores, responses };
}

describe('PlaybackRequestMatcher', () => {
  beforeEach(() => {
    // Tests for PlaybackResponse may have already run and replaced a dependency
    // we are mocking below. Resetting the module will ensure it gets our mock.
    resetModule(/entities\/PlaybackResponse.js$/);

    td.replace('../../functions/getRequestMatcherId', { getRequestMatcherId });
    td.replace('../../functions/getInterceptedResponseId', { getInterceptedResponseId });
    PlaybackResponseCollection = td.replace('../PlaybackResponseCollection').PlaybackResponseCollection;

    ({ PlaybackRequestMatcher } = require('../PlaybackRequestMatcher'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('constructor', () => {
    it('works', () => {
      // Arrange
      const args = createConstructorArgs('GET', 'http://example.com/');
      td.when(getRequestMatcherId(...args)).thenReturn('mock-request-id');

      // Act
      const matcher = new PlaybackRequestMatcher(...args);

      // Assert
      expect(matcher.id).to.equal('mock-request-id');
      expect(matcher.matcher).to.equal('http://example.com/');
      expect(matcher.toBeCalledAtLeast).to.equal(1);
      expect(matcher.anyOnce).to.equal(false);
      expect(matcher.ignores).to.have.length(0);
    });

    it('throws if an incorrect number of arguments are provided.', () => {
      expect(() => new PlaybackRequestMatcher()).to.throw()
        .property('message').to.match(/Unsupported number of arguments/i);
    });

    it('throws if the wrong type of arguments are passed in.', () => {
      expect(() => new PlaybackRequestMatcher(1, '/')).to.throw()
        .property('message').to.match(/Invalid arguments/i);

      expect(() => new PlaybackRequestMatcher('GET', null, { toBeCalledAtLeast: 5 })).to.throw()
        .property('message').to.match(/Invalid arguments/i);
    });

    it('throws if "toBeCalledAtLeast" conflicts with "matching.anyOnce".', () => {
      expect(() => new PlaybackRequestMatcher('GET', '/', { toBeCalledAtLeast: 5, matching: { anyOnce: true } }))
        .to.throw().property('message').to.match(/"toBeCalledAtLeast" must be 1/i);
    });

    it('warns when using "matching.ignores" with "matching.anyOnce".', () => {
      // Arrange
      const consoleWarn = td.replace(console, 'warn');

      // Act
      new PlaybackRequestMatcher('GET', '/', { matching: { ignores: ['port'], anyOnce: true } });

      // Assert
      td.verify(consoleWarn(td.matchers.contains('"matching.ignores" is unnecessary')));
    });
  });

  describe('deserialization', () => {
    it('works', () => {
      // Arrange
      const serialized = createSerializedRequestMatcher('mock-id', 2, 3);

      for (let i = 0; i < serialized.responseCollections.length; i++) {
        const collection = serialized.responseCollections[i];
        td.when(new PlaybackResponseCollection(collection)).thenReturn(collection);
      }

      // Act
      const matcher = new PlaybackRequestMatcher(serialized);

      // Assert
      expect(matcher.id).to.equal('mock-id');
      expect(matcher.toBeCalledAtLeast).to.equal(2);
      expect(matcher.method).to.equal(serialized.method);
      expect(matcher.matcher).to.equal(serialized.matcher);
      expect(matcher.stale).to.be.true;
      for (let i = 1; i <= 3; i++) {
        const responseCollection = matcher.getResponseCollection(`mock-intercepted-response-id-${i}`);
        expect(responseCollection).property('id').to.equal(`mock-intercepted-response-id-${i}`);
      }
      // Assert that it restored exactly the number of responses it should have.
      expect(() => matcher.getResponseCollection('mock-intercepted-response-id-4')).to.throw().property('message').to.match(/No response collection found with ID: mock-intercepted-response-id-4/i);
    });

    it('works with old responses', () => {
      // Arrange
      const serialized = createOldSerializedRequestMatcher('mock-id', 2, 3);

      for (let i = 0; i < serialized.responses.length; i++) {
        const response = serialized.responses[i];
        const {id, url, ...rest} = response;
        const collection = {
          id,
          url,
          responses: [rest]
        };
        td.when(new PlaybackResponseCollection(collection)).thenReturn(collection);
      }

      // Act
      const matcher = new PlaybackRequestMatcher(serialized);

      // Assert
      expect(matcher.id).to.equal('mock-id');
      expect(matcher.toBeCalledAtLeast).to.equal(2);
      expect(matcher.method).to.equal(serialized.method);
      expect(matcher.matcher).to.equal(serialized.matcher);
      expect(matcher.stale).to.be.true;
      for (let i = 1; i <= 3; i++) {
        const responseCollection = matcher.getResponseCollection(`mock-intercepted-response-id-${i}`);
        expect(responseCollection).property('id').to.equal(`mock-intercepted-response-id-${i}`);
      }
      // Assert that it restored exactly the number of responses it should have.
      expect(() => matcher.getResponseCollection('mock-intercepted-response-id-4')).to.throw().property('message').to.match(/No response collection found with ID: mock-intercepted-response-id-4/i);
    });
  });

  describe('serialization', () => {
    it('works', () => {
      // Arrange
      const interceptedUrl = 'http://example.com/';
      const mockInterceptedResponseId= 'mock-intercepted-response-id';
      const mockResponse = {
        statusCode: 200,
        statusMessage: 'OK',
        body: 'body-string',
        bodyType: 'string',
        headers: { 'mock-header': 'yes' },
      };
      const interceptedRequest = { stuff: 1, url: interceptedUrl };
      const args = createConstructorArgs('GET', interceptedUrl, { toBeCalledAtLeast: 5 });
      td.when(getRequestMatcherId(...args))
        .thenReturn('mock-request-id');

      // Fake ResponseCollection
      const addResponseFake = td.func();
      const serializeFake = td.func();
      td.when(serializeFake()).thenReturn({
        id: mockInterceptedResponseId,
        url:interceptedUrl,
        responses: [mockResponse]
      });
      td.when(new PlaybackResponseCollection(interceptedRequest, [])).thenReturn(
        {
          id: mockInterceptedResponseId,
          hits: 1,
          serialize: serializeFake,
          addResponse: addResponseFake,
        });


      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, interceptedRequest);
      td.verify(addResponseFake(200, 'OK', 'body-string', {'mock-header': 'yes'}));

      // Act
      const serialized = matcher.serialize();

      // Assert
      expect(serialized).to.deep.equal({
        id: 'mock-request-id',
        ignores: [],
        method: 'GET',
        matcher: interceptedUrl,
        atLeast: 5,
        anyOnce: false,
        responseCollections: [{
          id: mockInterceptedResponseId,
          url: interceptedUrl,
          responses: [mockResponse]
        }]
      });
    });
  });

  describe('responses', () => {
    it('throws if notified of a response completing when none were started.', () => {
      // Arrange
      const args = createConstructorArgs('GET', 'http://example.com/', { toBeCalledAtLeast: 2 });

      // Act
      const matcher = new PlaybackRequestMatcher(...args);

      expect(() => matcher.notifyRequestCompleted()).to.throw()
        .property('message').to.match(/No requests inflight/i);
    });

    it('returns a single response if "matching.anyOnce" set.', () => {
      // Arrange
      const serialized = createSerializedRequestMatcher('mock-id', 1, 1, true);
      for (let i = 0; i < serialized.responseCollections.length; i++) {
        const collection = serialized.responseCollections[i];
        td.when(new PlaybackResponseCollection(collection)).thenReturn(collection);
      }
      // Act
      const matcher = new PlaybackRequestMatcher(serialized);
      const allResponseCollections = matcher.getAllResponseCollections();

      // Assert
      expect(allResponseCollections).to.have.length(1);

      // Act
      const responseCollection = matcher.getResponseCollection('mock-intercepted-response-id-1');

      // Assert
      expect(allResponseCollections[0]).to.equal(responseCollection);
    });

    it('throws an error if more than one response is recorded when "matching.anyOnce" is set.', () => {
      // Arrange
      const mockInterceptedResponseId = 'mock-intercepted-response-id-1';
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn(mockInterceptedResponseId);
      const args = createConstructorArgs('GET', 'http://example.com/', { toBeCalledAtLeast: 1, matching: { anyOnce: true } });

      // Fake ResponseCollection
      td.when(new PlaybackResponseCollection({ stuff: true }, [])).thenReturn(
        {
          id: mockInterceptedResponseId,
          hits: 2,
          addResponse: td.func(),
        });


      // Act
      const matcher = new PlaybackRequestMatcher(...args);

      // Assert
      expect(
        () => matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true })
      ).to.throw().property('message').to.match(/recorded more than one response/i);
    });

    it('returns the expected "isPending" value for new requests.', () => {
      // Arrange
      const args = createConstructorArgs('GET', 'http://example.com/', { toBeCalledAtLeast: 2 });
      td.when(getRequestMatcherId(...args))
        .thenReturn('mock-request-id');
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id');

      // Fake ResponseCollection
      const playbackResponseCollectionFake =  {
        id: 'mock-intercepted-response-id',
        hits: 1,
        addResponse: td.func(),
      };
      td.when(new PlaybackResponseCollection({ stuff: true }, [])).thenReturn(playbackResponseCollectionFake);

      // Act
      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

      // Assert - We set toBeCalledAtLeast to 2, so the "add" above caused the response
      // to have a "hit"
      expect(matcher.isPending()).to.be.true;

      // Act
      // add a second request
      playbackResponseCollectionFake.hits = 2;

      // Since the hit count now matches the toBeCalledAtLeast count, the matcher is no
      // longer pending.
      expect(matcher.isPending()).to.be.false;
    });
  });
});
