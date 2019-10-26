const promisify = require('es6-promisify');
const GitHubApi = require('@octokit/rest');

let github;

function githubAuthenticate() {
  github = new GitHubApi({
    auth: process.env.GITHUB_TOKEN,
  });
}

exports.createPullRequest = async (owner, repo, head, base, title, body) => {
  githubAuthenticate();
  const { data } = await promisify(github.pullRequests.create)({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });
  return data;
};

exports.getRepo = async (owner, repo) => {
  githubAuthenticate();
  return (await github.repos.get({ owner, repo })).data;
};

exports.deleteRepo = async (owner, repo) => {
  githubAuthenticate();
  await promisify(github.repos.delete)({ owner, repo });
};

exports.forkRepo = async (owner, repo) => {
  githubAuthenticate();
  return (await promisify(github.repos.createFork)({ owner, repo })).data;
};
