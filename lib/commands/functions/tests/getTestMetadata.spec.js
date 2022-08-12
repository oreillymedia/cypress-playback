const { getTestMetadata } = require('../getTestMetadata');

function getMockContext() {
  return {
    test: {
      file: 'relative/path/to/file.js',
    },
    currentTest: {
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
        relativeFile: 'relative/path/to/file.js'
      }
    }
  };
}

describe('getTestMetadata', () => {
  describe('returns expected values', () => {
    const expected = {
      file: 'relative/path/to/file.js',
      state: 'passed',
      title: 'grandparent-parent-does thing'
    };

    it('works with a fully defined context.', () => {
      expect(getTestMetadata(getMockContext())).to.eql(expected);
    });

    it('works with a missing "test" property in the context.', () => {
      const context = getMockContext();
      delete context.test;
      expect(getTestMetadata(context)).to.eql(expected);
    });
  });

  describe('throws exceptions', () => {
    it('when missing "file"', () => {
      // Arrange
      const context = getMockContext();
      delete context.test.file;
      delete context.currentTest.invocationDetails;

      // Act / Assert
      expect(() => getTestMetadata(context)).to.throw()
        .property('message').to.match(/Could not determine "file"/);
    });

    it('when missing "title"', () => {
      // Arrange
      const context = getMockContext();
      delete context.currentTest.title;
      context.currentTest.parent = { root: true };

      // Act / Assert
      expect(() => getTestMetadata(context)).to.throw()
        .property('message').to.match(/Could not determine "title"/);
    });

    it('when no "currentTest" object on the context.', () => {
      expect(() => getTestMetadata()).to.throw()
        .property('message').to.match(/No "currentTest" in context/);
    });
  });
});
