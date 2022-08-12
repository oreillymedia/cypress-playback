const path = require('node:path');
const { getTestOutputFilePath } = require('../getTestOutputFilePath.js');

describe('getTestOutputFilePath', () => {
  it('handles the fixture directory being disabled.', () => {
    const config = {
      fixturesFolder: false
    };
    const testFile = '/src/e2e/cheese/test-file.js';
    const testName = 'Test Name';

    // Act
    const result = getTestOutputFilePath(config, testFile, testName);

    // Assert
    expect(result).to.equal('/src/e2e/cheese/cypress-playback/test-file/test-name.cy-playback');
  });

  it('uses the fixture directory when defined.', () => {
    // Arrange
    const config = {
      fixturesFolder: '/src/fixtures-folder'
    };
    const testFile = '/src/e2e/cheese/test-file.js';
    const testName = 'Test Name';

    // Act
    const result = getTestOutputFilePath(config, testFile, testName);

    // Assert
    expect(result).to.equal('/src/fixtures-folder/e2e/cheese/test-file/test-name.cy-playback');
  });

  it('saves relative test file paths to the fixtures folder.', () => {
    // Arrange
    const config = {
      fixturesFolder: path.resolve('src/fixtures-folder')
    };
    const testFile = 'e2e/cheese/test-file.js';
    const testName = 'Test Name';

    // Act
    const result = getTestOutputFilePath(config, testFile, testName);

    // Assert
    expect(result).to.equal(path.join(config.fixturesFolder, 'e2e/cheese/test-file', 'test-name.cy-playback'));
  });

  it('saves relative test file paths correctly when there is no fixture folder.', () => {
    // Arrange
    const config = {
      fixturesFolder: false
    };
    const testFile = 'e2e/cheese/test-file.js';
    const testName = 'Test Name';

    // Act
    const result = getTestOutputFilePath(config, testFile, testName);

    // Assert
    expect(result).to.equal(path.resolve('e2e/cheese/cypress-playback/test-file/test-name.cy-playback'));
  });
});
