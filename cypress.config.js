const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    video: false,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {},
  },
});
