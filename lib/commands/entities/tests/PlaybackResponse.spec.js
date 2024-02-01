const { resetModule } = require('../../../tests/utils');

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

    ({ PlaybackResponse } = require('../PlaybackResponse'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('constructor', () => {
    it('should create a new instance from a Cypress request', () => {
      // Arrange
      // Act
      const playbackResponse = new PlaybackResponse(...createConstructorArgs({ foo: 'bar' }));

      // Assert
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
      { body: undefined, bodyType: null, expected: undefined},
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

    const cases = [
      { body: { foo: 'bar' }, expectedBodyType: 'json', expected: '{"foo":"bar"}' },
      { body: 'body-string', expectedBodyType: 'string', expected: 'body-string' },
      { body: new Uint8Array(Buffer.from('Y2hlZXNl', 'base64')), expectedBodyType: 'ArrayBuffer', expected: 'Y2hlZXNl' },
      { body: undefined, expectedBodyType: null, expected: undefined },
    ];

    for (const { body, expectedBodyType, expected } of cases) {
      it(`should handle a bodyType of "${expectedBodyType}"`, () => {
        const playbackResponse = new PlaybackResponse(...createConstructorArgs(body));

        // Act
        const serialized = playbackResponse.serialize();

        // Assert
        expect(serialized.statusCode).to.equal(200);
        expect(serialized.statusMessage).to.equal('OK');
        expect(serialized.body).to.equal(expected);
        expect(serialized.bodyType).to.equal(expectedBodyType);
        expect(serialized.headers).to.deep.equal({ 'mock-header': 'yes' });
      });
    }
  });
});