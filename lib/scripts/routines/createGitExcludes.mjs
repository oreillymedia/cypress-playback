import path from 'path';
import fs, { promises as fsPromises } from 'fs';

import { runCommand } from './runCommand.mjs';

/**
 * @param {string[]} excludedFiles
 * @returns {Promise<void>}
 */
export async function createGitExcludes(excludedFiles) {
  // Get the top-level directory.
  const topLevelDir = await runCommand('git', ['rev-parse', '--show-toplevel']);
  // Get the git directory.
  const gitDir = await runCommand('git', ['rev-parse', '--git-dir']);

  const excludesPath = path.join(topLevelDir, gitDir, '/info/exclude');
  const excludesDir = path.dirname(excludesPath);

  if (!fs.existsSync(excludesDir)) {
    await fsPromises.mkdir(excludesDir, { recursive: true });
  }

  await fsPromises.writeFile(excludesPath, excludedFiles.join('\n') + '\n', { encoding: 'utf-8' });
}
