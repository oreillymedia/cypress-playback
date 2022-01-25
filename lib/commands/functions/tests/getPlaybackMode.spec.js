const { ENV_MODE } = require('../../constants.js');

// Mock dependencies.
const cypressEnv = td.func();
const cypressConfig = td.func();

// Subject-under-test
const { getPlaybackMode } = require('../getPlaybackMode.js');

describe('getPlaybackMode', () => {
  beforeEach(() => {
    global.Cypress = {
      env: cypressEnv,
      config: cypressConfig,
    };
  });

  afterEach(() => {
    td.reset();
    delete global.Cypress;
  });

  describe('expected modes', () => {
    const testCases = [
      { mode: 'record', expected: 'record' },
      { mode: 'playback', expected: 'playback' },
      { mode: 'hybrid', expected: 'hybrid' },
    ];

    for (const { mode, expected } of testCases) {
      it(`returns "${expected}"`, () => {
        td.when(cypressEnv(ENV_MODE)).thenReturn(mode);

        expect(getPlaybackMode()).to.equal(expected);
      });
    }
  });

  describe('throws exceptions', () => {
    it('when mode is unsupported.', () => {
      // Arrange
      td.when(cypressEnv(ENV_MODE)).thenReturn('unsupported');

      // Act / Assert
      expect(() => getPlaybackMode()).to.throw()
        .property('message').to.match(/Invalid mode/);
    });
  });

  describe('fallbacks', () => {
    it('to "playback" if mode is undefined and not interactive.', () => {
      // Arrange
      td.when(cypressEnv(ENV_MODE)).thenReturn(undefined);
      td.when(cypressConfig()).thenReturn({ isInteractive: false });

      // Act / Assert
      expect(getPlaybackMode()).to.equal('playback');
    });

    it('to "hybrid" when mode is "undefined" and is interactive.', () => {
      // Arrange
      td.when(cypressEnv(ENV_MODE)).thenReturn(undefined);
      td.when(cypressConfig()).thenReturn({ isInteractive: true });

      // Act / Assert
      expect(getPlaybackMode()).to.equal('hybrid');
    });
  });
});