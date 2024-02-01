const getInterceptedResponseId = td.func();
let PlaybackResponse;

// Subject-under-test
let PlaybackResponseCollection;

function createConstructorArgs(interceptedRequest, ignores = []) {
  return [interceptedRequest, ignores];
}

function createSerializedResponseCollection(
  id,
  url,
  responseCount
) {
  const responses = [];
  for (let i = 0; i < responseCount; i++) {
    responses.push({
      statusCode: 200,
      statusMessage: 'OK',
      body: {'value': i + 1},
      bodyType: 'json',
      headers: { 'mock-header': 'yes' },
    });
  }
  return {
    id,
    url,
    responses
  };
}

describe('PlaybackResponseCollection', () => {
  beforeEach(() => {
    td.replace('../../functions/getInterceptedResponseId', { getInterceptedResponseId });
    PlaybackResponse = td.replace('../PlaybackResponse').PlaybackResponse;

    ({ PlaybackResponseCollection } = require('../PlaybackResponseCollection'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('constructor', () => {
    it('works', () => {
      // Arrange
      const mockUrl = '/todo/5';
      const interceptedRequest = {stuff: 5, url: mockUrl};
      const mockRequestId = 'mock-request-id-1';
      const args = createConstructorArgs(interceptedRequest);

      td.when(getInterceptedResponseId(interceptedRequest, [])).thenReturn(mockRequestId);
      // Act
      const collection = new PlaybackResponseCollection(...args);

      // Assert
      expect(collection.url).to.equal(mockUrl);
      expect(collection.id).to.equal(mockRequestId);
      expect(collection.hits).to.equal(0);
      expect(collection.responses).to.have.length(0);
    });

    it('throws if an incorrect number of arguments are provided.', () => {
      expect(() => new PlaybackResponseCollection()).to.throw()
        .property('message').to.match(/Invalid number of arguments/i);
    });

    describe('deserialization', () => {
      it('works', () => {
        // Arrange
        const mockId = 'mock-id';
        const mockUrl = '/todo/6';
        const responseCount = 2;
        const serialized = createSerializedResponseCollection(mockId, mockUrl, responseCount);

        for (let i = 0; i < serialized.responses.length; i++) {
          const response = serialized.responses[i];
          td.when(new PlaybackResponse(response)).thenReturn(response);
        }

        // Act
        const collection = new PlaybackResponseCollection(serialized);

        // Assert
        expect(collection.url).to.equal(mockUrl);
        expect(collection.id).to.equal(mockId);
        expect(collection.hits).to.equal(0);
        expect(collection.responses).to.have.length(responseCount);
      });
    });

    describe('serialization', () => {
      it('works', () => {
        // Arrange
        const mockUrl = '/todo/10';
        const interceptedRequest = {stuff: 10, url: mockUrl};
        const mockRequestId = 'mock-request-id-1';
        const args = createConstructorArgs(interceptedRequest);

        td.when(getInterceptedResponseId(interceptedRequest, [])).thenReturn(mockRequestId);

        // Fake PlaybackResponse
        const mockStatusCode = 200;
        const mockStatusMessage = 'OK';
        const mockBody = {stuff: 10};
        const mockHeaders = {'mock-header': 'yes'};
        const mockResponseSerialize = td.func();

        td.when(mockResponseSerialize()).thenReturn({
          statusCode: mockStatusCode,
          statusMessage: mockStatusMessage,
          body: mockBody,
          headers: mockHeaders,
        });
        td.when(new PlaybackResponse(mockStatusCode, mockStatusMessage, mockBody, mockHeaders)).thenReturn({
          statusCode: mockStatusCode,
          statusMessage: mockStatusMessage,
          body: mockBody,
          headers: mockHeaders,
          serialize: mockResponseSerialize
        });

        const collection = new PlaybackResponseCollection(...args);

        // Act
        collection.addResponse(mockStatusCode, mockStatusMessage, mockBody, mockHeaders);
        const serialized = collection.serialize();

        // Assert
        expect(serialized).to.deep.equal({
          id: mockRequestId,
          url: mockUrl,
          responses: [{
            statusCode: mockStatusCode,
            statusMessage: mockStatusMessage,
            body: mockBody,
            headers: mockHeaders,
          }]
        });
      });
    });

    describe('responses', () => {
      it('increments #hits for each added response', () => {
        // Arrange
        const mockUrl = '/todo/11';
        const interceptedRequest = {stuff: 11, url: mockUrl};
        const mockRequestId = 'mock-request-id-1';
        const args = createConstructorArgs(interceptedRequest);

        td.when(getInterceptedResponseId(interceptedRequest, [])).thenReturn(mockRequestId);

        td.when(new PlaybackResponse()).thenReturn({});

        const collection = new PlaybackResponseCollection(...args);

        // Act
        collection.addResponse();
        collection.addResponse();
        collection.addResponse();

        // Assert
        expect(collection.hits).to.equal(3);
      });

      it('gets the next response', () => {
        // Arrange
        const mockId = 'mock-id';
        const mockUrl = '/todo/6';
        const responseCount = 3;
        const serialized = createSerializedResponseCollection(mockId, mockUrl, responseCount);

        for (let i = 0; i < serialized.responses.length; i++) {
          const response = serialized.responses[i];
          td.when(new PlaybackResponse(response)).thenReturn(response);
        }

        // Act
        const collection = new PlaybackResponseCollection(serialized);

        // Assert
        const response1 = collection.getNextResponse();
        const response2 = collection.getNextResponse();
        const response3 = collection.getNextResponse();

        expect(response1.body.value).to.equal(1);
        expect(response2.body.value).to.equal(2);
        expect(response3.body.value).to.equal(3);

        expect(() => collection.getNextResponse()).to.throw().property('message').to.match(/No more recorded responses found for request with URL: \/todo\/6. Hit Count: 4/i);

      });
    });
  });
});