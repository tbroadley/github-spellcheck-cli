#!/usr/bin/env node
const chalk = require('chalk');
const progress = require('cli-progress');
const dotenv = require('dotenv');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const fs = require('fs-extra');
const glob = require('globby');
const _ = require('lodash');
const opn = require('opn');
const path = require('path');
const prompt = require('prompt-promise');
const userHome = require('user-home');

const { addByUserSelection } = require('./lib/add-by-user-selection');
const { git } = require('./lib/git');
const {
  createPullRequest,
  deleteRepo,
  forkRepo,
  getAllReposForAuthenticatedUser,
} = require('./lib/github');
const { cloneWithRetry } = require('./lib/retry');
const { getMisspellings } = require('./lib/spellcheck');
const { respondToUserInput } = require('./lib/user-input');

let isNewFork = false;
let repoUser;
let repoName;
let clonePath;

function parseRepo(repo) {
  if (!repo) {
    return Promise.reject(new Error('No repository name specified.'));
  }

  const regexes = [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([-\w]+)\/([-_\w.]+)(?:\/[^/]+)*$/,
    /^([-\w]+)\/([-_\w.]+)$/,
  ];
  const matchingRegex = _.find(regexes, re => re.test(repo));
  if (matchingRegex) {
    const result = matchingRegex.exec(repo);
    return Promise.resolve([result[1], result[2]]);
  }
  return Promise.reject(new Error('Repository name is invalid.'));
}

async function findGithubFile(name) {
  return _.first(await glob(
    `{${name}*,{.github,docs}/${name}*}`,
    { cwd: clonePath, gitignore: true, nocase: true }
  ));
}

function lines(str) {
  return str.trim().replace(/\r/g, '').split('\n');
}

const optionDefinitions = [
  {
    name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.',
  },
  {
    name: 'token', alias: 't', typeLabel: '<token>', description: 'GitHub personal access token. You only need to provide the token when you start using github-spellcheck, and again if you have a new token.',
  },
  {
    name: 'repository', alias: 'r', typeLabel: '<username/repository or URL>', description: 'The repository to spellcheck.',
  },
  {
    name: 'branch', defaultValue: 'fix-typos', typeLabel: '<branch name>', description: 'The name of the branch to commit corrections to.',
  },
  {
    name: 'base', typeLabel: '<branch name>', description: 'The name of the branch to create the pull request against.',
  },
  {
    name: 'extensions', alias: 'e', multiple: true, defaultValue: ['md', 'txt'], typeLabel: '<extension> [<extension>] ...', description: 'Only spellcheck files with these extensions for spelling mistakes.',
  },
  {
    name: 'include', multiple: true, defaultValue: [], typeLabel: '<glob> ...', description: 'Only spellcheck files that match at least one of these globs.',
  },
  {
    name: 'exclude', multiple: true, defaultValue: [], typeLabel: '<glob> ...', description: 'Do not spellcheck files that match one of these globs.',
  },
  {
    name: 'quiet', alias: 'q', type: Boolean, description: 'Do not open CONTRIBUTING.md or the new pull request in a browser.',
  },
];

const usageSections = [
  {
    header: 'github-spellcheck',
    content: 'A tool for checking GitHub repositories for spelling errors and submitting PRs to fix them.',
  },
  {
    header: 'Options',
    optionList: optionDefinitions,
  },
];

function printUsage() {
  console.log(getUsage(usageSections));
}

async function deleteNewForkAndExit(exitCode) {
  if (isNewFork && repoUser && repoName) {
    console.log(chalk.red(`Deleting ${repoUser}/${repoName}...`));
    await deleteRepo(repoUser, repoName);
  }

  console.log(chalk.red('Exiting...'));
  process.exit(exitCode);
}

async function go() {
  let commandLineArguments;

  try {
    commandLineArguments = commandLineArgs(optionDefinitions);
  } catch (error) {
    if (error.name === 'UNKNOWN_OPTION') {
      console.error(chalk.red(error.message));
      printUsage();
    } else {
      console.error(chalk.red('An unknown error occurred.'));
    }

    process.exit(1);
  }

  const {
    help,
    token,
    repository,
    branch: branchName,
    extensions,
    include,
    exclude,
    quiet,
  } = commandLineArguments;

  let baseBranchName = commandLineArguments.base;

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (extensions.length === 0) {
    console.error(chalk.red('Provide at least one extension.'));
    printUsage();
    process.exit(1);
  }

  if (token) {
    await fs.writeFile('.env', `GITHUB_TOKEN=${token}`);

    if (!repository) {
      console.log('Saved your GitHub token.');
      return;
    }
  }

  dotenv.config();

  [repoUser, repoName] = await parseRepo(repository).catch((error) => {
    console.error(chalk.red(error));
    printUsage();
    process.exit(1);
  });
  const userAndRepo = `${repoUser}/${repoName}`;
  const extensionRegex = new RegExp(`\\.(${extensions.join('|')})$`);

  console.log('Getting a list of all GitHub repos that you have access to...');
  const userRepos = await getAllReposForAuthenticatedUser();

  let githubRepo = _.find(userRepos, { full_name: userAndRepo });
  if (githubRepo) {
    console.log(`You already have access to ${userAndRepo}.`);
  } else {
    console.log(`You don't have access to ${userAndRepo}.`);
    console.log(`Forking ${userAndRepo} or retrieving your existing fork...`);
    githubRepo = await forkRepo(repoUser, repoName);
    console.log(`Fork of ${userAndRepo} now exists at ${githubRepo.full_name}.`);
    isNewFork = (new Date() - new Date(githubRepo.created_at)) / 1000 < 10;
    repoUser = githubRepo.owner.login;
    repoName = githubRepo.name;
  }

  if (!baseBranchName) {
    baseBranchName = githubRepo.default_branch;
  }

  clonePath = path.join(userHome, `/.github-spellcheck/${repoUser}/${repoName}`);

  let exists;
  if (isNewFork) {
    console.log(`Making sure the temporary directory for ${repoUser}/${repoName} doesn't already exist...`);
    await fs.remove(clonePath);
    exists = false;
  } else {
    console.log(`Checking if ${repoUser}/${repoName} has already been cloned...`);
    exists = (await fs.pathExists(clonePath)) && (await fs.pathExists(path.join(clonePath, '/.git')));
  }

  const repoFullUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${repoUser}/${repoName}.git`;

  if (!exists) {
    console.log('Creating a temporary directory...');
    await fs.ensureDir(clonePath);

    console.log(`Cloning ${repoUser}/${repoName} into the temporary directory...`);
    await cloneWithRetry(repoFullUrl, clonePath);
  }

  async function repoHasRemote(remoteName) {
    const [stdout] = await git(clonePath, 'remote');
    return _.includes(lines(stdout), remoteName);
  }

  console.log(`Fetching the latest on the branch '${baseBranchName}' from the parent repository...`);
  if (!await repoHasRemote('parent')) {
    await git(clonePath, `remote add parent https://github.com/${userAndRepo}`);
  }
  await git(clonePath, 'fetch parent');

  async function repoHasBranch(name) {
    const [stdout] = await git(clonePath, 'branch');
    const branches = lines(stdout);
    return _.includes(branches, `  ${name}`) || _.includes(branches, `* ${name}`);
  }

  function getBranchCommit(name) {
    return git(clonePath, `rev-parse parent/${name}`)
      .then(([stdout]) => stdout.trim());
  }

  console.log(`Merging the latest from the parent repository into '${baseBranchName}'...`);
  if (!await repoHasBranch(baseBranchName)) {
    const branchCommit = await getBranchCommit(baseBranchName);
    await git(clonePath, `branch ${baseBranchName} ${branchCommit}`);
  }
  await git(clonePath, `checkout ${baseBranchName}`);
  await git(clonePath, `merge parent/${baseBranchName}`);

  console.log(`Getting the last commit from the branch '${baseBranchName}'...`);
  const commit = await getBranchCommit(baseBranchName);

  console.log('Resetting local repository...');
  await git(clonePath, `reset --hard ${commit}`);

  console.log('Getting a list of files in the working tree...');
  let treeEntries = await git(clonePath, 'ls-files').then(([stdout]) => lines(stdout));

  function getPathsToIncludeOrExclude(includeOrExclude) {
    return glob(includeOrExclude, { cwd: clonePath, gitignore: true });
  }

  function includesPath(pathsToTestAgainst) {
    return treeEntry => _.includes(pathsToTestAgainst, treeEntry.replace(/\\/g, '/'));
  }

  if (!_.isEmpty(include)) {
    console.log('Filtering the list to only include files that match the regexes specified with the --include option...');
    const pathsToInclude = await getPathsToIncludeOrExclude(include);
    treeEntries = _.filter(treeEntries, includesPath(pathsToInclude));
  }

  if (!_.isEmpty(exclude)) {
    console.log('Excluding files that match the regexes specified with the --exclude option...');
    const pathsToExclude = await getPathsToIncludeOrExclude(exclude);
    treeEntries = _.reject(treeEntries, includesPath(pathsToExclude));
  }

  console.log(`Filtering the list to only include files with extensions '${extensions.join(', ')}'...`);
  treeEntries = _.filter(treeEntries, treeEntry => extensionRegex.test(treeEntry));

  console.log('Spell-checking the remaining files...');
  const progressBar = new progress.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    stopOnComplete: true,
  }, progress.Presets.legacy);
  progressBar.start(treeEntries.length, 0);
  const misspellingsByFile = await Promise.all(_.map(treeEntries, async (entry) => {
    const buf = await fs.readFile(path.join(clonePath, entry));
    const misspellings = await getMisspellings(buf.toString().replace(/\r\n/g, '\n'), entry);
    progressBar.increment();
    return _.map(misspellings, misspelling => _.assign({}, misspelling, {
      path: entry,
    }));
  }));

  const { changeCount, finalDiff } = await addByUserSelection(
    _.flatten(misspellingsByFile),
    clonePath
  );

  console.log();

  if (changeCount > 0) {
    const contributingGuidelines = await findGithubFile('CONTRIBUTING');
    if (!quiet && contributingGuidelines) {
      console.log('Opening CONTRIBUTING.md...');
      await opn(`https://github.com/${repoUser}/${repoName}/blob/${baseBranchName}/${contributingGuidelines}`);
      console.log();
    }

    console.log();
    console.log();
    console.log(chalk.yellow('Overview of corrections'));
    console.log(chalk.yellow('-----------------------'));
    console.log();
    console.log(finalDiff);
    console.log();

    await respondToUserInput(
      'Are you sure you want to create a pull request with these corrections?',
      [
        {
          command: 'y',
          meaning: 'yes',
          description: 'Create a pull request with the specified changes.',
          responseFunction: async () => {
            console.log(`Creating a new branch "${branchName}"...`);
            await git(clonePath, `branch ${branchName} ${commit}`);

            console.log(`Checking out "${branchName}"...`);
            await git(clonePath, `checkout ${branchName}`);

            console.log('Adding all changes to the index...');
            await git(clonePath, 'add -A');

            console.log('Committing all changes...');
            await git(clonePath, `commit -m "docs: fix typo${changeCount === 1 ? '' : 's'}"`);

            const newCommit = await git(clonePath, 'rev-parse HEAD')
              .then(([stdout]) => stdout.trim());
            console.log(`Commit ${newCommit} created.`);
            console.log('Pushing to remote "origin"...');
            await git(clonePath, `push ${repoFullUrl} refs/heads/${branchName}`);

            if (await findGithubFile('PULL_REQUEST_TEMPLATE') && !quiet) {
              console.log('Opening the pull request creation page...');
              await opn(`https://github.com/${userAndRepo}/compare/${baseBranchName}...${repoUser}:${branchName}`);
            } else {
              console.log('Creating a pull request...');
              const [parentRepoUser, parentRepoName] = await parseRepo(userAndRepo);
              const pullRequest = await createPullRequest(
                parentRepoUser,
                parentRepoName,
                `${repoUser}:${branchName}`,
                baseBranchName,
                `Fix typo${changeCount === 1 ? '' : 's'}`,
                'PR created using https://github.com/tbroadley/github-spellcheck-cli.'
              );

              if (quiet) {
                console.log(`Pull request #${pullRequest.number} created.`);
              } else {
                console.log(`Pull request #${pullRequest.number} created. Opening in your browser...`);
                await opn(pullRequest.html_url);
              }
            }
          },
        },
        {
          command: 'n',
          meaning: 'no',
          description: 'Exit the program.',
          responseFunction: _.noop,
        },
      ]
    );
  } else {
    console.log(chalk.red('No corrections added.'));
    await deleteNewForkAndExit(0);
  }

  prompt.finish();
}

process.on('SIGINT', () => {
  console.log();
  deleteNewForkAndExit(130);
});

go().catch(async (error) => {
  console.error(chalk.red(`Error: ${error}`));
  await deleteNewForkAndExit(1);
});
