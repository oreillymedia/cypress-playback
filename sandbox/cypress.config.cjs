const { defineConfig } = require("cypress");

const setupE2E = require("./cypress/setup.e2e.cjs");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents: setupE2E
  }
});
