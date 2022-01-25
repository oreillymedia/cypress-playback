import { runCommand } from './runCommand.mjs';

export async function setNpmConfig() {
  await runCommand(
    'npm',
    ['config', 'set', '//registry.npmjs.org/:_authToken', '${NPM_TOKEN}']
  );
}
