/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-stale-vars
module.exports = (on, config) => {
  require('../../../lib/addTasks')(on, config);

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
