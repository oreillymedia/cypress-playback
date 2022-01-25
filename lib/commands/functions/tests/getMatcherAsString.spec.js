// Subject-under-test
const { getMatcherAsString } = require('../getMatcherAsString');

describe('getMatcherAsString', () => {
  const cases = [
    { matcher: '/', expected: '/' },
    { matcher: /\//, expected: '/\\//' },
    { matcher: { stuff: true }, expected: '{"stuff":true}' },
  ];

  for (const { matcher, expected } of cases) {
    it(`when given "${matcher}"`, () => {
      expect(getMatcherAsString(matcher)).to.equal(expected);
    });
  }

  it('throws when given an unsupported matcher type', () => {
    expect(() => getMatcherAsString(3)).to.throw()
      .property('message').to.match(/unsupported matcher type: number/i);
  });
});
