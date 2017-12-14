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

function toChunk(diff) {
  return {
    path: diff.path,
    diffs: [diff.diff],
  };
}

function chunkByFileName(diffs) {
  if (_.isEmpty(diffs)) {
    return [];
  }

  const allChunks = [];

  const firstDiff = diffs[0];
  let currentPath = firstDiff.path;
  let currentChunk = toChunk(firstDiff);

  _.forEach(_.tail(diffs), diff => {
    if (diff.path === currentPath) {
      currentChunk.diffs.push(diff.diff);
    } else {
      currentPath = diff.path;
      allChunks.push(currentChunk);
      currentChunk = toChunk(diff);
    }
  });

  allChunks.push(currentChunk);
  return allChunks;
}

exports.chunkByFileName = chunkByFileName;

exports.formatDiffs = diffs => {
  const chunkedDiffs = chunkByFileName(diffs);
  return _(chunkedDiffs).map(({ path, diffs }) => `${path}\n\n${diffs.join('\n\n')}`).join('\n\n\n');
};
