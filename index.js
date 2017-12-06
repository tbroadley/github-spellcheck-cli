const Git = require('nodegit');
const tmp = require('tmp-promise');

const { getMisspellings } = require('./lib/spellcheck');

const [user, repo] = process.argv[2].split('/');

console.log('Creating a temporary directory...');
tmp.dir({ unsafeCleanup: true })
  .then(({ path }) => {
    const url = `https://github.com/${user}/${repo}.git`;
    console.log(`Cloning ${url} into the temporary directory...`);
    return Git.Clone(url, path);
  }).then(repo => {
    console.log('Getting the last commit from the master branch...');
    return repo.getMasterCommit();
  }).then(master => {
    console.log('Getting README.md from the master branch...');
    return master.getEntry('README.md');
  }).then(entry => entry.getBlob())
  .then(blob => {
    console.log('Getting misspelled words in README.md...');
    return getMisspellings(blob.toString());
  }).then(result => console.log(result))
  .catch(error => console.error(error));
