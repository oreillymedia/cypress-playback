// Subject-under-test
const { getRequestMatcherId } = require('../getRequestMatcherId');

describe('getRequestMatcherId', () => {
  it('should return unique ids', () => {
    const options = {
      matching: { ignores: ['hostname', 'port'] },
      rewriteOrigin: 'https://example.com'
    };
    const id1 = getRequestMatcherId('GET', '/api/v1/foo/', { ...options });
    const id2 = getRequestMatcherId('GET', '/api/v1/foo/*', { ...options });
    expect(id1).to.not.equal(id2);
  });

  it('should return the same ids with the same inputs', () => {
    const options = {
      matching: { ignores: ['hostname', 'port'] },
      rewriteOrigin: 'https://example.com'
    };
    const id1 = getRequestMatcherId('GET', '/api/v1/foo/', { ...options });
    const id2 = getRequestMatcherId('GET', '/api/v1/foo/', { ...options });
    expect(id1).to.equal(id2);
  });
});
