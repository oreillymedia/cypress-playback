const fs = require('fs');
const { promisify } = require('util');

const deflate = promisify(require('zlib').deflate);

// Mocked dependencies.
const writeFile = td.func();
const mkdir = td.func();

// Subject-under-test
let writeRequestsToDisk;

// "x\x9C«V*.)MKS²*)*M\x05\x00'6\x05_"
//  x\x9C«V*.)MKS²*)*M\x05\x00'6\x05_

describe('writeRequestsToDisk', () => {
  beforeEach(() => {
    td.replace(fs.promises, 'writeFile', writeFile);
    td.replace(fs.promises, 'mkdir', mkdir);
    ({ writeRequestsToDisk } = require('../writeRequestsToDisk.js'));
  });

  afterEach(() => {
    td.reset();
  });

  it('works', async () => {
    // Arrange
    const config = {
      fixturesFolder: '/src/fixtures-folder'
    };
    const testFile = '/src/e2e/cheese/test-file.js';
    const testName = 'Test Name';

    td.when(mkdir(td.matchers.anything(), td.matchers.anything())).thenResolve();
    td.when(writeFile()).thenResolve();

    // Act
    await writeRequestsToDisk(config, testFile, testName, { stuff: true });

    // Assert
    td.verify(writeFile(
      '/src/fixtures-folder/e2e/cheese/test-file/test-name.cy-playback',
      (await deflate(JSON.stringify({ stuff: true }))).toString('latin1'),
      { encoding: 'latin1' },
    ));
  });
});
