const { spawn } = require('child_process');

async function setNpmConfig() {
  return new Promise((resolve, reject) => {
    const npm = spawn(
      'npm',
      ['config', 'set', '//registry.npmjs.org/:_authToken', '${NPM_TOKEN}']
    );
    npm.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    npm.stderr.on('data', (data) => {
      console.error(`ERR: ${data.toString()}`);
    });
    npm.on('close', (code) => {
      if (code) {
        reject(new Error(`child process exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = { setNpmConfig };