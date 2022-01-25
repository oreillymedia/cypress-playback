// Mocked dependencies.
const getMatcherAsString = td.func();
const md5 = td.func();

// Subject-under-test
let getRequestMatcherId;

describe('getRequestMatcherId', () => {
  before(() => {
    td.replace('blueimp-md5', md5);
    td.replace('../getMatcherAsString', { getMatcherAsString });
    ({ getRequestMatcherId } = require('../getRequestMatcherId.js'));
  });

  afterEach(() => {
    td.reset();
  });

  it('calls "md5" with the expected values.', () => {
    // Arrange
    td.when(getMatcherAsString('/')).thenReturn('matcher-as-string');
    td.when(md5('GET::matcher-as-string::{"options":true}')).thenReturn('md5-hash');

    // Act
    expect(getRequestMatcherId('GET', '/', { options: true })).to.equal('md5-hash');
  });
});
