const { ENV_MODE } = require('../constants.js');

const modeTypes = ['record', 'playback', 'hybrid'];

/**
 * @returns {'record'|'playback'|'hybrid'}
 */
function getPlaybackMode() {
  const mode = Cypress.env(ENV_MODE);
  if (mode) {
    if (modeTypes.includes(mode)) {
      return mode;
    }
    throw new Error(`CYPRESS PLAYBACK: Invalid mode: ${mode}`);
  }

  // No mode was set, so check if we are running in interactive mode. If we are
  // not interactive, we are running headless, so assume playback mode.
  if (!Cypress.config().isInteractive) {
    return 'playback';
  }

  // Otherwise, default to 'hybrid'.
  return 'hybrid';
}

module.exports = {
  getPlaybackMode
};