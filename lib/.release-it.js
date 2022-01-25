module.exports = {
  git: {
    commitMessage: 'chore: Release ${version}',
    tag: true,
    push: true
  },
  npm: {
    publish: true
  },
  github: {
    release: true
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'angular',
      infile: 'CHANGELOG.md'
    }
  },
  hooks: {
    'before:init': [
      'node ./scripts/prerelease.mjs',
      'npm test'
    ],
    'after:bump':[
      'git checkout -b release/${version}',
      'git push --set-upstream origin release/${version}'
    ],
    'after:git:release': [
      'node ./scripts/afterRelease.mjs --version ${version} --repo ${repo.repository}',
    ]
  }
};
