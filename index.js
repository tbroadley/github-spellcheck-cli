const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const fs = require('fs-extra');
const _ = require('lodash');
const { Clone, Cred, Diff, Index, Remote } = require('nodegit');
const opn = require('opn');
const prompt = require('prompt-promise');
const tmp = require('tmp-promise');

const { addByUserSelection } = require('./lib/add-by-user-selection');
const {
  createPullRequest,
  deleteRepo,
  findForkOfRepo,
  forkRepo,
  getAllReposForAuthenticatedUser,
} = require ('./lib/github');
const { highlightDiff } = require('./lib/highlighting');
const { getMisspellings } = require('./lib/spellcheck');
const { respondToUserInput } = require('./lib/user-input');

let isNewFork = false;
let repoUser;
let repoName;

function parseRepo(repo) {
  const regexes = [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([-\w]+)\/([-_\w]+)$/,
    /^([-\w]+)\/([-_\w]+)$/,
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

  console.log('Creating a temporary directory...');
  const { path } = await tmp.dir({ unsafeCleanup: true });

  const url = `https://github.com/${repoUser}/${repoName}.git`;
  console.log(`Cloning ${url} into the temporary directory...`);
  const githubCredentialsOptions = {
    callbacks: {
      credentials: () => Cred.userpassPlaintextNew(process.env.GITHUB_TOKEN, 'x-oauth-basic'),
    },
  };
  const repo = await Clone(url, path, {
    fetchOpts: githubCredentialsOptions,
  });

  console.log(`Getting the last commit from the branch '${baseBranchName}'...`);
  const commit = await repo.getBranchCommit(baseBranchName);

  console.log('Getting the state of the working tree...');
  const tree = await commit.getTree();

  console.log('Getting a list of files in the working tree...');
  let treeEntries = await new Promise((resolve, reject) => {
    const walker = tree.walk(true);
    walker.on('end', resolve);
    walker.on('error', reject);
    walker.start();
  });

  function matchSomeRegex(regexes) {
    return treeEntry => _(regexes).map(re => new RegExp(re).test(treeEntry.path()));
  }

  if (!_.isEmpty(include)) {
    console.log('Filtering the list to only include files that match the regexes specified with the --include option...');
    treeEntries = _.filter(treeEntries, matchSomeRegex(include));
  }

  if (!_.isEmpty(exclude)) {
    console.log('Excluding files that match the regexes specified with the --exclude option...');
    treeEntries = _.reject(treeEntries, matchSomeRegex(exclude));
  }

  console.log(`Filtering the list to only include files with extensions '${extensions.join(', ')}'...`);
  treeEntries = _.filter(treeEntries, treeEntry => extensionRegex.test(treeEntry.path()))

  console.log('Spell-checking the remaining files...');
  const misspellingsByFile = await Promise.all(_.map(treeEntries, async entry => {
    const blob = await entry.getBlob();
    const misspellings = await getMisspellings(blob.toString());
    return _.map(misspellings, misspelling => _.assign({}, misspelling, {
      path: entry.path(),
    }));
  }));

  const changeCount = await addByUserSelection(_.flatten(misspellingsByFile), repo);

  console.log();

  if (changeCount > 0) {
    const diff = await Diff.treeToWorkdir(repo, tree);
    const diffBuf = await diff.toBuf(Diff.FORMAT.PATCH);

    console.log(highlightDiff(diffBuf));

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
            const pullRequest = await h(createPullRequest(
              sourceRepoUser,
              sourceRepoName,
              `${repoUser}:${branchName}`,
              `Fix typo${changeCount === 1 ? '' : 's'}`,
              'PR created using https://github.com/tbroadley/github-spellcheck.'
            ));

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
    console.log(chalk.red('Exiting...'));
  } else {
    console.log(chalk.red('No corrections added. Exiting...'));
  }

  prompt.finish();
}

go().catch(async error => {
  console.error(chalk.red(`Error: ${error}`));

  if (isNewFork) {
    console.log(chalk.red(`Deleting ${repoUser}/${repoName}...`));
    await deleteRepo(repoUser, repoName);
  }

  console.log(chalk.red('Exiting...'));
  process.exit(1);
});
