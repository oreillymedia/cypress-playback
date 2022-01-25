const { getTestOutputFilePath } = require('../getTestOutputFilePath.js');

describe('getTestOutputFilePath', () => {
  it('works', () => {
    // Arrange
    const config = {
      integrationFolder: '/src/integration-folder',
      fixturesFolder: '/src/fixtures-folder'
    };
    const testFile = '/src/integration-folder/cheese/test-file.js';
    const testName = 'Test Name';

    // Act
    const result = getTestOutputFilePath(config, testFile, testName);

    // Assert
    expect(result).to.equal('/src/fixtures-folder/cheese/test-file/test-name.cy-request');
  });
});
