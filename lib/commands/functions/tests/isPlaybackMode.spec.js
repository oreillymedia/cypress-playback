// Mock Dependencies
const getPlaybackMode = td.func();

// Subject-under-test
let isPlaybackMode;

describe('isPlaybackMode', () => {
  beforeEach(() => {
    td.replace('../getPlaybackMode.js', { getPlaybackMode });
    ({ isPlaybackMode } = require('../isPlaybackMode'));
  });

  afterEach(() => {
    td.reset();
  });

  describe('expected modes', () => {
    const cases = [
      { currentMode: 'playback', testMode: 'playback', expected: true },
      { currentMode: 'playback', testMode: 'record', expected: false },
      { currentMode: 'playback', testMode: 'hybrid', expected: false },
      { currentMode: 'hybrid', testMode: 'playback', expected: true },
      { currentMode: 'hybrid', testMode: 'record', expected: true },
      { currentMode: 'hybrid', testMode: 'hybrid', expected: true },
      { currentMode: 'record', testMode: 'playback', expected: false },
      { currentMode: 'record', testMode: 'record', expected: true },
      { currentMode: 'record', testMode: 'hybrid', expected: false },
    ];

    for (const { currentMode, testMode, expected } of cases) {
      it(`returns "${expected}" when testing "${testMode}" against current "${currentMode}".`, () => {
        // Arrange
        td.when(getPlaybackMode()).thenReturn(currentMode);

        // Act / Assert
        expect(isPlaybackMode(testMode)).to.equal(expected);
      });
    }
  });

  describe('invalid mode', () => {
    it ('throws', () => {
      // Arrange
      td.when(getPlaybackMode()).thenReturn('playback');

      // Act / Assert
      expect(() => isPlaybackMode('invalid')).to.throw()
        .property('message').to.match(/Invalid mode/);
    });
  });
});