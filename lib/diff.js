const assert = require('assert');
const chalk = require('chalk');
const { diffLines, diffWordsWithSpace } = require('diff');
const _ = require('lodash');

exports.generateWordDiff = (before, after) => {
  const diff = diffLines(before, after);
  assert(_.filter(diff, 'removed').length === 1);
  assert(_.filter(diff, 'added').length === 1);

  const removedIndex = _.findIndex(diff, 'removed');
  const addedIndex = _.findIndex(diff, 'added');

  const removed = _.trimEnd(diff[removedIndex].value);
  const added = _.trimEnd(diff[addedIndex].value);

  const wordDiff = diffWordsWithSpace(removed, added);

  const wordsBeforeChange = _(wordDiff)
    .filter(({ added, removed }) => removed || !added)
    .map(({ removed, value }) => removed ? chalk.red(value) : value)
    .join('');
  const wordsAfterChange = _(wordDiff)
    .filter(({ added, removed }) => added || !removed)
    .map(({ added, value }) => added ? chalk.green(value) : value)
    .join('');

  return _.trim(`-${wordsBeforeChange}\n+${wordsAfterChange}`);
};
