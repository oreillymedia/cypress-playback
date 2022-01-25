const path = require('path');
const { promises: fs } = require('fs');
const { spawn } = require('child_process');

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<string>}
 */
async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args);
    let stdout = '';
    cmd.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    cmd.on('close', (code) => {
      if (code) {
        reject(new Error(`child process exited with code ${code}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * @param {string[]} excludedFiles
 * @returns {Promise<void>}
 */
async function createGitExcludes(excludedFiles) {
  // Get the top-level directory.
  const topLevelDir = await runCommand('git', ['rev-parse', '--show-toplevel']);
  // Get the git directory.
  const gitDir = await runCommand('git', ['rev-parse', '--git-dir']);

  const excludesPath = path.join(topLevelDir, gitDir, '/info/exclude');

  await fs.writeFile(excludesPath, excludedFiles.join('\n'));
}

module.exports = {
  createGitExcludes
};
