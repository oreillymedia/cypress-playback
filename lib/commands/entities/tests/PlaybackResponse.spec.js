const { resetModule } = require('../../../tests/utils');

// Mocked dependencies.
const getInterceptedResponseId = td.func();

// Subject-under-test
/** @type {import('../PlaybackResponse.js').PlaybackResponse} */
let PlaybackResponse;

function createConstructorArgs(body) {
  return [
    // statusCode
    200,
    // statusMessage
    'OK',
    // body
    body,
    // headers
    { 'mock-header': 'yes' },
    // Cypress intercepted request
    { stuff: 'things' },
    // ignoredAttributes
    []
  ];
}

function createSerializedResponse(body, bodyType) {
  return {
    id: 'mock-intercepted-response-id',
    statusCode: 200,
    statusMessage: 'OK',
    body,
    bodyType,
    headers: { 'mock-header': 'yes' },
  };
}

describe('PlaybackResponse', () => {
  before(() => {
    // Other tests may have already run and replaced a dependency we are mocking
    // below. Resetting the module will ensure it gets our mock.
    resetModule(/entities\/PlaybackResponse.js$/);

    td.replace('../../functions/getInterceptedResponseId', { getInterceptedResponseId });

    ({ PlaybackResponse } = require('../PlaybackResponse'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('constructor', () => {
    it('should create a new instance from a Cypress request', () => {
      // Arrange
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id');

      // Act
      const playbackResponse = new PlaybackResponse(...createConstructorArgs({ foo: 'bar' }));

      // Assert
      expect(playbackResponse.id).to.equal('mock-intercepted-response-id');
      expect(playbackResponse.statusCode).to.equal(200);
      expect(playbackResponse.statusMessage).to.equal('OK');
      expect(playbackResponse.body).to.deep.equal({ foo: 'bar' });
      expect(playbackResponse.headers).to.deep.equal({ 'mock-header': 'yes' });
    });

    it('should throw if not given a supported number of arguments.', () => {
      expect(() => new PlaybackResponse()).to.throw()
        .property('message').to.match(/Invalid number of arguments/i);
    });
  });

  describe('deserialization', () => {
    const cases = [
      { body: '{"foo":"bar"}', bodyType: 'json', expected: { foo: 'bar' } },
      { body: 'body-string', bodyType: 'string', expected: 'body-string' },
      { body: 'Y2hlZXNl', bodyType: 'ArrayBuffer', expected: new Uint8Array(Buffer.from('Y2hlZXNl', 'base64')) },
    ];

    for (const { body, bodyType, expected } of cases) {
      it(`should handle a bodyType of "${bodyType}"`, () => {
        // Arrange
        const serialized = createSerializedResponse(body, bodyType);

        // Act
        const response = new PlaybackResponse(serialized);

        // Assert
        expect(response.statusCode).to.equal(serialized.statusCode);
        expect(response.statusMessage).to.equal(serialized.statusMessage);
        expect(response.headers).to.deep.equal(serialized.headers);

        if (bodyType === 'json') {
          expect(response.body).to.deep.equal(expected);
        } else if (bodyType === 'ArrayBuffer') {
          const view = new Uint8Array(response.body);
          expect(view.byteLength).to.equal(expected.byteLength);
          for (let i = 0; i < expected.byteLength; i++) {
            expect(view[i]).to.equal(expected[i]);
          }
        } else {
          expect(response.body).to.equal(expected);
        }
      });
    }
  });

  describe('serialization', () => {
    beforeEach(() => {
      td.when(getInterceptedResponseId(td.matchers.anything(), td.matchers.anything()))
        .thenReturn('mock-intercepted-response-id');
    });

    const cases = [
      { body: { foo: 'bar' }, bodyType: 'json', expected: '{"foo":"bar"}' },
      { body: 'body-string', bodyType: 'string', expected: 'body-string' },
      { body: new Uint8Array(Buffer.from('Y2hlZXNl', 'base64')), bodyType: 'ArrayBuffer', expected: 'Y2hlZXNl' },
    ];

    for (const { body, bodyType, expected } of cases) {
      it(`should handle a bodyType of "${bodyType}"`, () => {
        const playbackResponse = new PlaybackResponse(...createConstructorArgs(body));

        // Act
        const serialized = playbackResponse.serialize();

        // Assert
        expect(serialized.id).to.equal('mock-intercepted-response-id');
        expect(serialized.statusCode).to.equal(200);
        expect(serialized.statusMessage).to.equal('OK');
        expect(serialized.body).to.equal(expected);
        expect(serialized.bodyType).to.equal(bodyType);
        expect(serialized.headers).to.deep.equal({ 'mock-header': 'yes' });
      });
    }
  });

  describe('hits', () => {
    it('keeps track of hits.', () => {
      // Arrange
      const playbackResponse = new PlaybackResponse(...createConstructorArgs({ foo: 'bar' }));

      // Act
      playbackResponse.addHit();

      // Assert
      expect(playbackResponse.hits).to.equal(1);
    });
  });
});