import fetch from 'node-fetch';
import url from 'url';

function getArg(argName) {
  const argIdx = process.argv.findIndex(arg => arg === argName);
  if (argIdx === -1) {
    throw new Error(`${argName} argument not found`);
  }
  const arg = process.argv[argIdx + 1];
  if (!arg) {
    throw new Error(`No value provided for ${argName}`);
  }
  return arg;
}

async function getDefaultBranch(repo) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}`,
    {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      }
    }
  );

  let defaultBranch;
  if (response.ok) {
    const json = await response.json();
    ({ default_branch: defaultBranch } = json);
  }
  if (!defaultBranch) {
    throw new Error('Could not determine default branch');
  }

  return defaultBranch;
}

async function createPullRequest(repo, version, defaultBranch) {
  const body = {
    head: `release/${version}`,
    base: defaultBranch,
    title: `chore: Release ${version}`
  };
  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to create pull request: ${await response.text()}`);
  }
  const json = await response.json();
  return json.number;
}

export async function afterRelease() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    const repo = getArg('--repo');
    const version = getArg('--version');

    console.log(`Creating pull request in ${repo} for ${version}.`);

    const defaultBranch = await getDefaultBranch(repo);
    console.log('defaultBranch', defaultBranch);
    const prNumber = await createPullRequest(repo, version, defaultBranch);
    console.log(`Created pull request ${prNumber}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  afterRelease();
}
