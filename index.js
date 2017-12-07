const commandLineArgs = require('command-line-args');
const _ = require('lodash');
const Git = require('nodegit');
const tmp = require('tmp-promise');

const { addByUserSelection } = require('./lib/filter-by-user-selection');
const { getMisspellings } = require('./lib/spellcheck');

const optionDefinitions = [
  { name: 'repository', alias: 'r', defaultOption: true },
  { name: 'extensions', alias: 'e', multiple: true, defaultValue: ['md', 'txt'] },
  { name: 'include', multiple: true, defaultValue: [] },
  { name: 'exclude', multiple: true, defaultValue: [] },
];
const {
  repository: userAndRepo,
  extensions,
  include,
  exclude,
} = commandLineArgs(optionDefinitions);

const [user, repo] = userAndRepo.split('/');
const extensionRegex = new RegExp(`\\.(${extensions.join('|')})$`);

let nodeGitRepo;
let masterCommit;

console.log('Creating a temporary directory...');
tmp.dir({ unsafeCleanup: true })
  .then(({ path }) => {
    const url = `https://github.com/${user}/${repo}.git`;
    console.log(`Cloning ${url} into the temporary directory...`);
    return Git.Clone(url, path);
  }).then(repo => {
    nodeGitRepo = repo;
    console.log('Getting the last commit from the master branch...');
    return repo.getMasterCommit();
  }).then(commit => {
    masterCommit = commit;
    console.log('Getting the state of the working tree...');
    return commit.getTree();
  }).then(tree => {
    console.log('Getting a list of files in the working tree...');
    return new Promise((resolve, reject) => {
      const walker = tree.walk(true);
      walker.on('end', resolve);
      walker.on('error', reject);
      walker.start();
    });
  }).then(treeEntries => {
    if (!_.isEmpty(include)) {
      console.log('Filtering the list to only include files that match the regexes specified with the --include option...');
      return _.filter(treeEntries, treeEntry => {
        return _(include)
          .map(reString => new RegExp(reString))
          .some(re => re.test(treeEntry.path()));
      });
    } else {
      return treeEntries;
    }
  }).then(treeEntries => {
    if (!_.isEmpty(exclude)) {
      console.log('Excluding files that match the regexes specified with the --exclude option...');
      return _.reject(treeEntries, treeEntry => {
        return _(exclude)
          .map(reString => new RegExp(reString))
          .some(re => re.test(treeEntry.path()));
      });
    } else {
      return treeEntries;
    }
  }).then(treeEntries => {
    console.log(`Filtering the list to only include files with extensions '${extensions.join(', ')}'...`);
    return _.filter(treeEntries, treeEntry => extensionRegex.test(treeEntry.path()))
  }).then(matchedTreeEntries => {
    console.log('Spell-checking the remaining files...');
    console.log();
    return Promise.all(_.map(matchedTreeEntries, entry => {
      return entry.getBlob()
        .then(blob => getMisspellings(blob.toString()))
        .then(misspellings => _.map(misspellings, misspelling => _.assign({}, misspelling, {
          path: entry.path(),
        })));
    }));
  }).then(_.flatten)
  .then(misspellings => addByUserSelection(misspellings, nodeGitRepo, masterCommit))
  .catch(error => console.error(error));
