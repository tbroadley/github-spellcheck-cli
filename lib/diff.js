const chalk = require('chalk');
const { diffLines, diffWordsWithSpace } = require('diff');
const _ = require('lodash');

function buildWordDiffFromLines(before, after) {
  return _.trim(`-${before}\n+${after}`);
}

function moveSpacesInWordDiff(wordDiff) {
  const addedStateRegex = /rasa/;
  const removedStateRegex = /rasr/;

  const states = _.map(wordDiff, ({ added, removed, value }) => {
    if (removed) {
      return 'r';
    } else if (!added && !removed && value === ' ') {
      return 's';
    } else if (added) {
      return 'a';
    }
    return '-';
  }).join('');

  const matchesAddedRegex = addedStateRegex.test(states);
  const matchesRemovedRegex = removedStateRegex.test(states);

  if (matchesAddedRegex || matchesRemovedRegex) {
    const regex = matchesAddedRegex ? addedStateRegex : removedStateRegex;
    const { index } = regex.exec(states);
    const { value: removed } = wordDiff[index];
    const { value: added } = wordDiff[index + 1];
    const { value: spaceAtEnd } = wordDiff[index + 3];
    const { value: spaceAtStart } = wordDiff[index + 4];

    const toInsert = matchesAddedRegex ? [{
      removed: true,
      value: removed,
    }, {
      added: true,
      value: `${added} ${spaceAtEnd.substring(0, spaceAtEnd.length - 1)}`,
    }, {
      value: ` ${spaceAtStart}`,
    }] : [{
      removed: true,
      value: `${removed} ${spaceAtEnd.substring(0, spaceAtEnd.length - 1)}`,
    }, {
      added: true,
      value: added,
    }, {
      value: ` ${spaceAtStart}`,
    }];

    wordDiff.splice(index, 5, ...toInsert);
  }

  return wordDiff;
}

exports.generateWordDiff = (before, after) => {
  const diff = diffLines(before, after);

  if (_.every(diff, ({ removed, added }) => !added && !removed)) {
    return 'No changes';
  }

  const removedIndex = _.findIndex(diff, 'removed');
  const addedIndex = _.findIndex(diff, 'added');

  const removedLine = _.trimEnd(diff[removedIndex].value);
  const addedLine = _.trimEnd(diff[addedIndex].value);

  const wordDiff = moveSpacesInWordDiff(diffWordsWithSpace(removedLine, addedLine));

  const wordsBeforeChange = _(wordDiff)
    .filter(({ added, removed }) => removed || !added)
    .map(({ removed, value }) => (removed ? chalk.bgRed.white(value) : value))
    .join('');
  const wordsAfterChange = _(wordDiff)
    .filter(({ added, removed }) => added || !removed)
    .map(({ added, value }) => (added ? chalk.bgGreen.white(value) : value))
    .join('');

  return buildWordDiffFromLines(wordsBeforeChange, wordsAfterChange);
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

  _.forEach(_.tail(diffs), (diff) => {
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

exports.formatDiffs = (diffsToFormat) => {
  const chunkedDiffs = chunkByFileName(diffsToFormat);
  return _(chunkedDiffs).map(({ path, diffs }) => `${path}\n\n${diffs.join('\n\n')}`).join('\n\n\n');
};
