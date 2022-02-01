const { resetModule } = require('../../../tests/utils');

// Mocked dependencies.
const getRequestMatcherId = td.func();
const getInterceptedResponseId = td.func();

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
  before(() => {
    // Tests for PlaybackResponse may have already run and replaced a dependency
    // we are mocking below. Resetting the module will ensure it gets our mock.
    resetModule(/entities\/PlaybackResponse.js$/);

    td.replace('../../functions/getRequestMatcherId', { getRequestMatcherId });
    td.replace('../../functions/getInterceptedResponseId', { getInterceptedResponseId });

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
      // Act
      const matcher = new PlaybackRequestMatcher(serialized);

      // Assert
      expect(matcher.id).to.equal('mock-id');
      expect(matcher.toBeCalledAtLeast).to.equal(2);
      expect(matcher.method).to.equal(serialized.method);
      expect(matcher.matcher).to.equal(serialized.matcher);
      expect(matcher.stale).to.be.true;
      for (let i = 1; i <= 3; i++) {
        expect(matcher.getResponse(`mock-intercepted-response-id-${i}`)).property('hits').to.equal(1);
      }
      // Assert that it restored exactly the number of responses it should have.
      expect(matcher.getResponse('mock-intercepted-response-id-4')).to.be.undefined;
    });
  });

  describe('serialization', () => {
    it('works', () => {
      // Arrange
      const args = createConstructorArgs('GET', 'http://example.com/', { toBeCalledAtLeast: 5 });
      td.when(getRequestMatcherId(...args))
        .thenReturn('mock-request-id');
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id');

      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

      // Act
      const serialized = matcher.serialize();

      // Assert
      expect(serialized).to.deep.equal({
        id: 'mock-request-id',
        ignores: [],
        method: 'GET',
        matcher: 'http://example.com/',
        atLeast: 5,
        anyOnce: false,
        responses: [{
          id: 'mock-intercepted-response-id',
          statusCode: 200,
          statusMessage: 'OK',
          body: 'body-string',
          bodyType: 'string',
          headers: { 'mock-header': 'yes' },
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

      // Act
      const matcher = new PlaybackRequestMatcher(serialized);
      const allResponses = matcher.getAllResponses();

      // Asesrt
      expect(allResponses).to.have.length(1);

      // Act
      const response = matcher.getResponse('junk');

      // Assert
      expect(allResponses[0]).to.equal(response);
    });

    it('throws an error if more than one response is recorded when "matching.anyOnce" is set.', () => {
      // Arrange
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id-1');
      const args = createConstructorArgs('GET', 'http://example.com/', { toBeCalledAtLeast: 1, matching: { anyOnce: true } });

      // Act
      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

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

      // Act
      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

      // Assert - We set toBeCalledAtLeast to 2, so the "add" above caused the response
      // to have a "hit"
      expect(matcher.isPending()).to.be.true;

      // Act
      matcher.getResponse('mock-intercepted-response-id');

      // Assert - We pulled out the response, so its hit count went up by one.
      // Since the hit count now matches the toBeCalledAtLeast count, the matcher is no
      // longer pending.
      expect(matcher.isPending()).to.be.false;
    });

    it('returns the expected "isPending" value for deserialized requests.', () => {
      td.reset();
      // Arrange - Allow us to add a response with the same id as one that was
      // deserialized.
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id-1');

      // Act - Create a matcher that expects to be called 3 times and has 2 mock
      // responses.
      const matcher = new PlaybackRequestMatcher(createSerializedRequestMatcher('mock-id', 3, 2));

      // Assert
      expect(matcher.isPending()).to.be.false;

      // Act
      // Calling notify started 3 times, as that is how many requests we will
      // mock resolve below.
      matcher.notifyRequestStarted();
      matcher.notifyRequestStarted();
      matcher.notifyRequestStarted();
      // Mock resolve one of the requests.
      matcher.notifyRequestCompleted();
      matcher.getResponse('mock-intercepted-response-id-1');

      // Assert - Total hit count should be 1.
      expect(matcher.isPending()).to.be.true;

      // Act - Mock resolve another request.
      matcher.notifyRequestCompleted();
      matcher.getResponse('mock-intercepted-response-id-2');

      // Assert - Total hit count should be 2.
      expect(matcher.isPending()).to.be.true;

      // Act - Mock resolve the final request. The testdouble above will cause
      // this response to have the `mock-intercepted-response-id-1`, which is
      // the same id as an existing response.
      matcher.notifyRequestCompleted();
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

      // Assert - At this point, the total hit count across the two possible
      // responses for the request matchers is 3.
      expect(matcher.isPending()).to.be.false;
    });
  });
});
