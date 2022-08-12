/// <reference types="cypress" />

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-stale-vars
module.exports = (on, config) => {
  require('../../lib/addTasks')(on, config);

  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--auto-open-devtools-for-tabs');
    } else if (browser.family === 'firefox') {
      launchOptions.args.push('-devtools');
    } else if (browser.name === 'electron') {
      launchOptions.preferences.devTools = true;
    }
    return launchOptions;
  });
}
