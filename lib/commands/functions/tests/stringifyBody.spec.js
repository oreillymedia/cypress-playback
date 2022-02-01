const { stringifyBody } = require('../stringifyBody');

describe('stringifyBody', () => {
  it('should remove properties as expected.', () => {
    // Arrange
    const body = {
      foo: 'bar',
      nested1: {
        nested2: {
          baz: 'qux',
        }
      },
      array: [
        {
          quux: 'garply',
          'A Nested Array': [{
            waldo: 'fred'
          }]
        },
        {
          xyzzy: 'thud'
        }
      ]
    };

    const removedProperties = [
      'foo',
      'nested1.nested2.baz',
      'array.0.quux',
      'array.0["A Nested Array"].0.waldo',
      'array.1.xyzzy'
    ];

    // Act
    const result = JSON.parse(stringifyBody(body, removedProperties));

    // Assert
    expect(result).to.deep.equal({
      nested1: { nested2: { } },
      array: [
        { 'A Nested Array': [{}] },
        {}
      ]
    });
  });

  it('should handle a "string" body.', () => {
    expect(stringifyBody('body-string', [])).to.equal('body-string');
  });
});