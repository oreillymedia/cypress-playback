const kebabCase = require('lodash.kebabcase');
const path = require('path');

function getTestOutputFilePath(config, testFile, testName) {
  const parsed = path.parse(testFile);
  const relativeDir = path.relative(config.integrationFolder, parsed.dir);
  return path.join(
    config.fixturesFolder,
    relativeDir,
    kebabCase(parsed.name),
    `${kebabCase(testName)}.cy-request`
  );
}

module.exports = {
  getTestOutputFilePath
};