const { promises: fs } = require('fs');
const { promisify } = require('util');

const { getTestOutputFilePath } = require('./getTestOutputFilePath');

const unzip = promisify(require('zlib').unzip);

/**
 * @param {{}} config
 * @param {string} testFile
 * @param {string} testName
 * @returns {Promise<{} | null>}
 */
async function readRequestsFromDisk(config, testFile, testName) {
  const outputPath = getTestOutputFilePath(config, testFile, testName);

  try {
    const buffer = Buffer.from(
      await fs.readFile(outputPath, { encoding: 'latin1' }),
      'latin1'
    );
    const inflated = await unzip(buffer);
    return JSON.parse(inflated);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
}

module.exports = {
  readRequestsFromDisk
};
