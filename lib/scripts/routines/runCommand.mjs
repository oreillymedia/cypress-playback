import { spawn } from 'child_process';

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<string>}
 */
export async function runCommand(command, args) {
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
