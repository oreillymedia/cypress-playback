const { getTestMetadata } = require('../getTestMetadata');

function getMockContext(testProp = 'test') {
  return {
    [testProp]: {
      title: 'does thing',
      state: 'passed',
      parent: {
        title: 'parent',
        parent: {
          title: 'grandparent',
          parent: {
            title: 'root',
            root: true
          }
        }
      },
      invocationDetails: {
        absoluteFile: '/path/to/file.js'
      }
    }
  };
}

describe('getTestMetadata', () => {
  describe('returns expected values', () => {
    const expected = {
      file: '/path/to/file.js',
      state: 'passed',
      title: 'grandparent-parent-does thing'
    };

    it('when context uses "currentTest"', () => {
      expect(getTestMetadata(getMockContext('currentTest'))).to.eql(expected);
    });

    it('when context uses "test"', () => {
      expect(getTestMetadata(getMockContext('test'))).to.eql(expected);
    });
  });

  describe('throws exceptions', () => {
    it('when missing "file"', () => {
      // Arrange
      const context = getMockContext();
      delete context.test.invocationDetails;

      // Act / Assert
      expect(() => getTestMetadata(context)).to.throw()
        .property('message').to.match(/Could not determine "file"/);
    });

    it('when missing "title"', () => {
      // Arrange
      const context = getMockContext();
      delete context.test.title;
      context.test.parent = { root: true };

      // Act / Assert
      expect(() => getTestMetadata(context)).to.throw()
        .property('message').to.match(/Could not determine "title"/);
    });

    it('when no "test" object on the context.', () => {
      expect(() => getTestMetadata()).to.throw()
        .property('message').to.match(/No "test" in context/);
    });
  });
});
