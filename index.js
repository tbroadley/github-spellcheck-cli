const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const fs = require('fs-extra');
const glob = require('globby');
const _ = require('lodash');
const { Clone, Cred, Diff, Index, Remote, Repository, Reset } = require('nodegit');
const opn = require('opn');
const path = require('path');
const prompt = require('prompt-promise');

const { addByUserSelection } = require('./lib/add-by-user-selection');
const { formatDiffs } = require('./lib/diff');
const {
  createPullRequest,
  deleteRepo,
  findForkOfRepo,
  forkRepo,
  getAllReposForAuthenticatedUser,
} = require ('./lib/github');
const { getMisspellings } = require('./lib/spellcheck');
const { respondToUserInput } = require('./lib/user-input');

let isNewFork = false;
let repoUser;
let repoName;
let clonePath;

function parseRepo(repo) {
  const regexes = [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([-\w]+)\/([-_\w\.]+)$/,
    /^([-\w]+)\/([-_\w\.]+)$/,
  ];
  const matchingRegex = _.find(regexes, re => re.test(repo));
  if (matchingRegex) {
    const result = matchingRegex.exec(repo);
    return [result[1], result[2]];
  } else {
    return Promise.reject('Repository name is invalid.');
  }
}

async function go() {
  const optionDefinitions = [
    { name: 'token', alias: 't' },
    { name: 'repository', alias: 'r', defaultOption: true },
    { name: 'branch', defaultValue: 'fix-typos' },
    { name: 'base', defaultValue: 'master' },
    { name: 'extensions', alias: 'e', multiple: true, defaultValue: ['md', 'txt'] },
    { name: 'include', multiple: true, defaultValue: [] },
    { name: 'exclude', multiple: true, defaultValue: [] },
  ];
  const {
    token,
    repository,
    branch: branchName,
    base: baseBranchName,
    extensions,
    include,
    exclude,
  } = commandLineArgs(optionDefinitions);

  if (token) {
    await fs.writeFile('.env', `GITHUB_TOKEN=${token}`);
  }
  require('dotenv').config();

  [repoUser, repoName] = await parseRepo(repository);
  const userAndRepo = `${repoUser}/${repoName}`;
  const extensionRegex = new RegExp(`\\.(${extensions.join('|')})$`);

  console.log('Getting a list of all GitHub repos that you have access to...');
  const userRepos = await getAllReposForAuthenticatedUser();

  const repoWithSameFullName = _.find(userRepos, { full_name: userAndRepo });
  if (repoWithSameFullName) {
    console.log(`You already have access to ${userAndRepo}.`);
  } else {
    console.log(`You don\'t have access to ${userAndRepo}.`);
    console.log(`Looking for a fork of ${userAndRepo} that you have access to...`);
    const fork = await findForkOfRepo(userAndRepo, userRepos);
    if (fork) {
      console.log(`You have access to ${fork.full_name}, which is a fork of ${userAndRepo}.`);
      repoUser = fork.owner.login;
      repoName = fork.name;
    } else {
      console.log(`You don\'t have access to ${userAndRepo} or any of its forks.`);
      console.log(`Forking ${userAndRepo} using your GitHub credentials...`);
      const newFork = await forkRepo(repoUser, repoName);
      console.log(`Forked ${userAndRepo} to ${newFork.full_name}.`)
      isNewFork = true;
      repoUser = newFork.owner.login;
      repoName = newFork.name;
    }
  }

  const githubCredentialsOptions = {
    callbacks: {
      credentials: () => Cred.userpassPlaintextNew(process.env.GITHUB_TOKEN, 'x-oauth-basic'),
    },
  };

  clonePath = path.join(__dirname, `/tmp/${repoUser}/${repoName}`);

  let exists;
  if (isNewFork) {
    console.log(`Making sure the temporary directory for ${repoUser}/${repoName} doesn't already exist...`);
    await fs.remove(clonePath);
    exists = false;
  } else {
    console.log(`Checking if ${repoUser}/${repoName} has already been cloned...`);
    exists = await fs.pathExists(clonePath);
  }

  let repo;
  if (exists) {
    console.log(`Pulling the latest on the branch '${baseBranchName}'...`);
    repo = await Repository.open(clonePath);
    await repo.fetchAll(githubCredentialsOptions);
    await repo.mergeBranches(baseBranchName, `origin/${baseBranchName}`);
  } else {
    console.log('Creating a temporary directory...');
    await fs.ensureDir(`tmp/${repoUser}/${repoName}`);

    const url = `https://github.com/${repoUser}/${repoName}.git`;
    console.log(`Cloning ${url} into the temporary directory...`);
    repo = await Clone(url, clonePath, {
      fetchOpts: githubCredentialsOptions,
    });
  }

  console.log(`Getting the last commit from the branch '${baseBranchName}'...`);
  const commit = await repo.getBranchCommit(baseBranchName);

  console.log('Resetting local repository...');
  await Reset.reset(repo, commit, Reset.TYPE.HARD);

  console.log('Getting the state of the working tree...');
  const tree = await commit.getTree();

  console.log('Getting a list of files in the working tree...');
  let treeEntries = await new Promise((resolve, reject) => {
    const walker = tree.walk(true);
    walker.on('end', resolve);
    walker.on('error', reject);
    walker.start();
  });
  const originalTreeEntries = treeEntries;

  async function getPathsToIncludeOrExclude(includeOrExclude) {
    return glob(includeOrExclude, { cwd: clonePath, gitignore: true });
  }

  function includesPath(pathsToTestAgainst) {
    return treeEntry => _.includes(pathsToTestAgainst, treeEntry.path().replace(/\\/g, '/'));
  }

  if (!_.isEmpty(include)) {
    console.log('Filtering the list to only include files that match the regexes specified with the --include option...');
    const pathsToInclude = await getPathsToIncludeOrExclude(include);
    treeEntries = _.filter(treeEntries, includesPath(pathsToInclude));
  }

  if (!_.isEmpty(exclude)) {
    console.log('Excluding files that match the regexes specified with the --exclude option...');
    const pathsToExclude = await getPathsToIncludeOrExclude(exclude);
    console.log(pathsToExclude);
    treeEntries = _.reject(treeEntries, includesPath(pathsToExclude));
  }

  console.log(`Filtering the list to only include files with extensions '${extensions.join(', ')}'...`);
  treeEntries = _.filter(treeEntries, treeEntry => extensionRegex.test(treeEntry.path()))

  console.log('Spell-checking the remaining files...');
  const misspellingsByFile = await Promise.all(_.map(treeEntries, async entry => {
    const blob = await entry.getBlob();
    const misspellings = await getMisspellings(blob.toString().replace(/\r\n/g, '\n'), entry.path());
    return _.map(misspellings, misspelling => _.assign({}, misspelling, {
      path: entry.path(),
    }));
  }));

  const { changeCount, diffs } = await addByUserSelection(_.flatten(misspellingsByFile), repo);

  console.log();

  if (changeCount > 0) {
    if (_(originalTreeEntries).map(entry => entry.path()).includes('CONTRIBUTING.md')) {
      console.log('Opening CONTRIBUTING.md...');
      await opn(`https://github.com/${repoUser}/${repoName}/blob/${baseBranchName}/CONTRIBUTING.md`);
      console.log();
    }

    console.log();
    console.log(formatDiffs(diffs));
    console.log();

    await respondToUserInput(
      'Are you sure you want to create a pull request with these corrections? y(es), n(o): ',
      [
        {
          regex: /^y(es)?$/,
          responseFunction: async () => {
            console.log(`Creating a new branch "${branchName}"...`);
            const newBranchRef = await repo.createBranch('fix-typos', commit, false);

            console.log(`Checking out "${branchName}"...`);
            await repo.checkoutBranch(newBranchRef);

            const index = await repo.refreshIndex();

            console.log('Adding all changes to the index...');
            await index.addAll(['*'], Index.ADD_OPTION.ADD_DEFAULT);
            await index.write();
            const indexOid = await index.writeTree();

            const signature = repo.defaultSignature();
            console.log('Committing all changes...');
            const newCommit = await repo.createCommit(
              'HEAD',
              signature,
              signature,
              'Fix typos',
              indexOid,
              [commit]
            );

            console.log(`Commit ${newCommit} created.`);

            const [remoteName] = await Remote.list(repo);
            const remote = await Remote.lookup(repo, remoteName);

            console.log(`Pushing to remote "${remoteName}"...`);
            await remote.push([`refs/heads/${branchName}`], githubCredentialsOptions);

            console.log('Creating a pull request...');
            const [sourceRepoUser, sourceRepoName] = await parseRepo(userAndRepo);
            const pullRequest = await createPullRequest(
              sourceRepoUser,
              sourceRepoName,
              `${repoUser}:${branchName}`,
              `Fix typo${changeCount === 1 ? '' : 's'}`,
              'PR created using https://github.com/tbroadley/github-spellcheck-cli.'
            );

            console.log(`Pull request #${pullRequest.number} created. Opening in your browser...`);
            await opn(pullRequest.html_url);
          },
        },
        {
          regex: /^n(o)?$/,
          responseFunction: _.noop,
        }
      ]
    );
  } else if (isNewFork) {
    console.log(chalk.red('No corrections added.'));
    console.log(chalk.red(`Deleting ${repoUser}/${repoName}...`));
    await deleteRepo(repoUser, repoName);
    await fs.remove(clonePath);
    console.log(chalk.red('Exiting...'));
  } else {
    console.log(chalk.red('No corrections added. Exiting...'));
  }

  prompt.finish();
}

go().catch(async error => {
  console.error(chalk.red(`Error: ${error}`));

  if (isNewFork && repoUser && repoName) {
    console.log(chalk.red(`Deleting ${repoUser}/${repoName}...`));
    await deleteRepo(repoUser, repoName);
    if (clonePath) {
      await fs.remove(clonePath);
    }
  }

  console.log(chalk.red('Exiting...'));
  process.exit(1);
});
