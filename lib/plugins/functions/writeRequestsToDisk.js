const path = require('path');
const { promises: fs } = require('fs');
const { promisify } = require('util');

const { getTestOutputFilePath } = require('./getTestOutputFilePath');

const deflate = promisify(require('zlib').deflate);

/**
 * @param {{}} config
 * @param {string} testFile
 * @param {string} testName
 * @param {{}} data
 * @returns {Promise<void>}
 */
async function writeRequestsToDisk(config, testFile, testName, data) {
  const outputPath = getTestOutputFilePath(config, testFile, testName);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const deflated = await deflate(JSON.stringify(data));
  await fs.writeFile(
    outputPath,
    deflated.toString('latin1'),
    { encoding: 'latin1' }
  );
}

module.exports = { writeRequestsToDisk };