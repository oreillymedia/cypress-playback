const { readRequestsFromDisk } = require('./plugins/functions/readRequestsFromDisk');
const { writeRequestsToDisk } = require('./plugins/functions/writeRequestsToDisk');

module.exports = (on, config) => {
  on('task', {
    'cypress-playback:record': async ({ file, title, data }) => {
      await writeRequestsToDisk(config, file, title, data);
      return true;
    },
    'cypress-playback:load': async ({ file, title }) => {
      return await readRequestsFromDisk(config, file, title);
    }
  });
  return config;
};
