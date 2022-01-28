const { resetModule } = require('../../../tests/utils');

// Mocked dependencies.
const getRequestMatcherId = td.func();
const getInterceptedResponseId = td.func();

// Subject-under-test
let PlaybackRequestMatcher;

function createConstructorArgs(method, matcher, options = {}) {
  return [method, matcher, options];
}

function createSerializedRequestMatcher(id, minTimes, responseCount, ignoredAttributes = []) {
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
  return { id, minTimes, ignoredAttributes, responses };
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
      expect(matcher.minTimes).to.equal(1);
      expect(matcher.ignoredAttributes).to.have.length(0);
    });

    it('throws if an incorrect number of arguments are provided.', () => {
      expect(() => new PlaybackRequestMatcher()).to.throw()
        .property('message').to.match(/Unsupported number of arguments/i);
    });

    it('throws if the wrong type of arguments are passed in.', () => {
      expect(() => new PlaybackRequestMatcher(1, '/')).to.throw()
        .property('message').to.match(/Invalid arguments/i);

      expect(() => new PlaybackRequestMatcher('GET', null, { minTimes: 5 })).to.throw()
        .property('message').to.match(/Invalid arguments/i);
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
      expect(matcher.minTimes).to.equal(2);
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
      const args = createConstructorArgs('GET', 'http://example.com/', { minTimes: 5 });
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
        ignoredAttributes: [],
        method: 'GET',
        matcher: 'http://example.com/',
        minTimes: 5,
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
      const args = createConstructorArgs('GET', 'http://example.com/', { minTimes: 2 });

      // Act
      const matcher = new PlaybackRequestMatcher(...args);

      expect(() => matcher.notifyRequestCompleted()).to.throw()
        .property('message').to.match(/No requests inflight/i);
    });

    it('returns the expected "isPending" value for new requests.', () => {
      // Arrange
      const args = createConstructorArgs('GET', 'http://example.com/', { minTimes: 2 });
      td.when(getRequestMatcherId(...args))
        .thenReturn('mock-request-id');
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id');

      // Act
      const matcher = new PlaybackRequestMatcher(...args);
      matcher.addResponse(200, 'OK', 'body-string', { 'mock-header': 'yes' }, { stuff: true });

      // Assert - We set minTimes to 2, so the "add" above caused the response
      // to have a "hit"
      expect(matcher.isPending()).to.be.true;

      // Act
      matcher.getResponse('mock-intercepted-response-id');

      // Assert - We pulled out the response, so its hit count went up by one.
      // Since the hit count now matches the minTimes count, the matcher is no
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
