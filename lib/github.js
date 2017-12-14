const promisify = require('es6-promisify');
const GitHubApi = require('github');
const _ = require('lodash');

const github = new GitHubApi();

function githubAuthenticate() {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
}

async function getAllPages(endpoint, parameters) {
  let currentPage = await promisify(endpoint)(parameters);
  let allPages = currentPage.data;
  /* eslint-disable no-await-in-loop */
  while (await github.hasNextPage(currentPage)) {
    currentPage = await github.getNextPage(currentPage);
    /* eslint-enable no-await-in-loop */
    allPages = _.concat(allPages, currentPage.data);
  }
  return allPages;
}

exports.createPullRequest = async (owner, repo, head, title, body) => {
  githubAuthenticate();
  const { data } = await promisify(github.pullRequests.create)({
    owner,
    repo,
    head,
    base: 'master',
    title,
    body,
  });
  return data;
};

exports.deleteRepo = async (owner, repo) => {
  githubAuthenticate();
  await promisify(github.repos.delete)({ owner, repo });
};

exports.findForkOfRepo = async (fullName, authenticatedUserRepos) => {
  const forks = _.filter(authenticatedUserRepos, 'fork');
  const getRepo = promisify(github.repos.get);

  githubAuthenticate();

  return new Promise((resolve) => {
    _.forEach(forks, ({ owner: { login: owner }, name: repo }) => {
      getRepo({ owner, repo })
        .then(({ data }) => data)
        .then((fork) => {
          if (_.toLower(fork.source.full_name) === _.toLower(fullName)) {
            resolve(fork);
          }
        });
    });
  });
};

exports.forkRepo = async (owner, repo) => {
  githubAuthenticate();
  return (await promisify(github.repos.fork)({ owner, repo })).data;
};

exports.getAllReposForAuthenticatedUser = async () => {
  githubAuthenticate();
  return getAllPages(github.repos.getAll, { type: 'all' });
};
