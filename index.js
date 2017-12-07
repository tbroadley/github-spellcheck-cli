const commandLineArgs = require('command-line-args');
const _ = require('lodash');
const { Clone, Diff } = require('nodegit');
const tmp = require('tmp-promise');

const { addByUserSelection } = require('./lib/filter-by-user-selection');
const { getMisspellings } = require('./lib/spellcheck');

async function go() {
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

  const [user, repoName] = userAndRepo.split('/');
  const extensionRegex = new RegExp(`\\.(${extensions.join('|')})$`);

  console.log('Creating a temporary directory...');
  const { path } = await tmp.dir({ unsafeCleanup: true });

  const url = `https://github.com/${user}/${repoName}.git`;
  console.log(`Cloning ${url} into the temporary directory...`);
  const repo = await Clone(url, path);

  console.log('Getting the last commit from the master branch...');
  const commit = await repo.getMasterCommit();

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

  await addByUserSelection(_.flatten(misspellingsByFile), repo);
}

go();
