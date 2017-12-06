const fs = require('fs-extra');
const _ = require('lodash');
const { Checkout, Diff } = require('nodegit');
const path = require('path');

function shouldInclude({ path: relativePath, index: { start, end }, misspelling, suggestions: [suggestion] }, repo, commit) {
  const absolutePath = path.join(repo.workdir(), relativePath);
  let originalFileContents;
  return fs.readFile(absolutePath, { encoding: 'utf8' })
    .then(data => {
      data = data.replace(/\r\n/g, '\n');
      originalFileContents = data;
      return fs.writeFile(
        absolutePath,
        [data.slice(0, start), suggestion, data.slice(end)].join('')
    )})
    .then(() => repo.refreshIndex())
    .then(() => {
      return commit.getTree()
        .then(tree => Diff.treeToWorkdir(repo, tree))
        .then(diff => diff.toBuf(Diff.FORMAT.PATCH))
        .then(buf => console.log(buf))
        .then(() => new Promise((resolve, reject) => {
          console.log('Do you want to add this fix?');
          console.log('  y (yes)');
          console.log('  n (no)');
          process.openStdin().addListener('data', data => {
            console.log();
            resolve(data.toString().trim());
          });
        }))
        .then(userInput => {
          if (userInput !== 'y' && userInput !== 'yes') {
            return fs.writeFile(absolutePath, originalFileContents).then(() => userInput);
          } else {
            return Promise.resolve(userInput);
          }
        });
    })
}

function filterByUserSelectionHelper(misspellings, filteredMisspellings, repo, commit) {
  if (_.isEmpty(misspellings)) {
    return filteredMisspellings;
  } else {
    const misspelling = _.first(misspellings);
    return shouldInclude(misspelling, repo, commit)
      .then(userInput => {
        if (userInput === 'y' || userInput === 'yes') {
          filteredMisspellings.push(misspelling);
          misspellings = misspellings.map(({ path, index: { start, end }, misspelling: ms, suggestions }) => ({
            path,
            index: {
              start: start + misspelling.suggestions[0].length - misspelling.misspelling.length,
              end: end + misspelling.suggestions[0].length - misspelling.misspelling.length,
            },
            misspelling: ms,
            suggestions,
          }));
        }
        return filterByUserSelectionHelper(_.tail(misspellings), filteredMisspellings, repo, commit);
      });
  }
}

exports.filterByUserSelection = (misspellings, repo, commit) => {
  return filterByUserSelectionHelper(misspellings, [], repo, commit);
};
