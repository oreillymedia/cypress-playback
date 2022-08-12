const kebabCase = require('lodash.kebabcase');
const path = require('path');

function getTestOutputFilePath(config, testFile, testName) {
  if (!path.isAbsolute(testFile)) {
    testFile = path.resolve(testFile);
  }
  const parsed = path.parse(testFile);
  const pathElements = [
    kebabCase(parsed.name),
    `${kebabCase(testName)}.cy-playback`
  ];

  if (config.fixturesFolder === false) {
    // Create a subdirectory relative to the test file
    pathElements.unshift(parsed.dir, 'cypress-playback');
  } else {
    const subdir = path.relative(config.fixturesFolder, parsed.dir)
      .replace(new RegExp(`\\.\\.\\${path.sep}`, 'g'), '');
    pathElements.unshift(config.fixturesFolder, subdir);
  }
  return path.join(...pathElements);
}

module.exports = {
  getTestOutputFilePath
};
