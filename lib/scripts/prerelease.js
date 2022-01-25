const { createGitExcludes } = require('./routines/createGitExcludes');
const { setNpmConfig } = require('./routines/setNpmConfig');

async function prerelease() {
  try {
    await createGitExcludes(['.npmrc']);
    await setNpmConfig();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  prerelease();
}

module.exports = {
  prerelease
};
