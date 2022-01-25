const { getPlaybackMode } = require('./getPlaybackMode.js');

/**
 * @param {'playback'|'record'|'hybrid'} mode
 * @returns {boolean}
 */
function isPlaybackMode(mode) {
  const currentMode = getPlaybackMode();
  switch (mode) {
    case 'playback': return ['playback', 'hybrid'].includes(currentMode);
    case 'record': return ['record', 'hybrid'].includes(currentMode);
    case 'hybrid': return 'hybrid' === currentMode;
    default: throw new Error(`Invalid mode: ${mode}`);
  }
}

module.exports = {
  isPlaybackMode
};
