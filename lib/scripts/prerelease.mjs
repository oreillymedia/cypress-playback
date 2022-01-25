import url from 'url';

import { createGitExcludes } from './routines/createGitExcludes.mjs';
import { setNpmConfig } from './routines/setNpmConfig.mjs';

export async function prerelease() {
  try {
    await createGitExcludes(['.npmrc']);
    await setNpmConfig();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  prerelease();
}
