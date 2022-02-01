// Mocked dependencies.
const md5 = td.func();

// Subject-under-test
let getInterceptedResponseId;

function createMockRequest(body, search = 'foo=bar') {
  return {
    url: `https://example.com:4444?${search}`,
    method: 'GET',
    body,
  };
}

describe('getInterceptedResponseId', () => {
  before(() => {
    td.replace('blueimp-md5', md5);
    ({ getInterceptedResponseId } = require('../getInterceptedResponseId.js'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('makes expected md5 calls', () => {
    it('when request body is a string', () => {
      td.when(md5(['https:', 'example.com', '4444', '/', '?foo=bar', 'GET', 'body-string'].join('::')))
        .thenReturn('md5-hash');

      expect(getInterceptedResponseId(createMockRequest('body-string'), [])).to.equal('md5-hash');
    });

    it('when request body can be JSON stringified', () => {
      td.when(md5(['https:', 'example.com', '4444', '/', '?foo=bar', 'GET', '{"body":true}'].join('::')))
        .thenReturn('md5-hash');

      expect(getInterceptedResponseId(createMockRequest({ body: true }), [])).to.equal('md5-hash');
    });
  });

  describe('with ignores', () => {
    it('calls the md5 function without search attribute.', () => {
      td.when(md5(['https:', 'example.com', '4444', '/', 'GET', 'body-string'].join('::')))
        .thenReturn('md5-hash');

      expect(getInterceptedResponseId(createMockRequest('body-string'), ['search'])).to.equal('md5-hash');
    });

    it('calls the md5 function without ignored search params.', () => {
      td.when(md5(['https:', 'example.com', '4444', '/', '?baz=quux', 'GET', 'body-string'].join('::')))
        .thenReturn('md5-hash');

      expect(getInterceptedResponseId(
        createMockRequest('body-string', 'foo=bar&baz=quux'), { searchParams: ['foo'] })
      ).to.equal('md5-hash');
    });

    it('calls the md5 function without ignored body property.', () => {
      td.when(md5(['https:', 'example.com', '4444', '/', '?foo=bar', 'GET', '{}'].join('::')))
        .thenReturn('md5-hash');

      expect(getInterceptedResponseId(
        createMockRequest({ baz: 'quux' }), { bodyProperties: ['baz'] })
      ).to.equal('md5-hash');
    });
  });

  describe('throws exception', () => {
    it('when the request has no body.', () => {
      expect(() => getInterceptedResponseId(createMockRequest(), [])).to.throw()
        .property('message').to.match(/Request body must be provided/);
    });
    it('when the ignores argument is not an object.', () => {
      expect(() => getInterceptedResponseId(createMockRequest('body-string'), 'not-an-object')).to.throw()
        .property('message').to.match(/Ignores must be an object/);
    });
  });
});
