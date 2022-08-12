const fs = require('fs');
const { promisify } = require('util');

const deflate = promisify(require('zlib').deflate);

// Mocked dependencies.
const readFile = td.func();

// Subject-under-test
let readRequestsFromDisk;

describe('readRequestsFromDisk', () => {
  const config = {
    fixturesFolder: '/src/fixtures-folder'
  };
  const testFile = '/src/e2e/cheese/test-file.js';
  const testName = 'Test Name';

  beforeEach(() => {
    td.replace(fs.promises, 'readFile', readFile);
    ({ readRequestsFromDisk } = require('../readRequestsFromDisk.js'));
  });

  afterEach(() => {
    td.reset();
  });

  it('works', async () => {
    // Arrange
    td.when(readFile(
      '/src/fixtures-folder/e2e/cheese/test-file/test-name.cy-playback',
      { encoding: 'latin1' })
    ).thenResolve(
      (await deflate(JSON.stringify({ stuff: true }))).toString('latin1')
    );

    // Act
    const result = await readRequestsFromDisk(config, testFile, testName);

    // Assert
    expect(result).to.deep.equal({ stuff: true });
  });

  it('gracefully handles a missing file.',async() => {
    // Arrange
    td.when(readFile(
      '/src/fixtures-folder/e2e/cheese/test-file/test-name.cy-playback',
      { encoding: 'latin1' })
    ).thenReject({ code: 'ENOENT' });

    // Act
    const result = await readRequestsFromDisk(config, testFile, testName);

    // Assert
    expect(result).to.be.null;
  });

  it('rethrows other errors', async () => {
    // Arrange
    td.when(readFile(
      '/src/fixtures-folder/e2e/cheese/test-file/test-name.cy-playback',
      { encoding: 'latin1' })
    ).thenReject(new Error('bad things'));

    try {
      await readRequestsFromDisk(config, testFile, testName);
      expect.fail('Function should have thrown');
    } catch (e) {
      expect(e).property('message').to.equal('bad things');
    }
  });
});
