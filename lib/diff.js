const assert = require('assert');
const chalk = require('chalk');
const { diffLines } = require('diff');
const _ = require('lodash');

function buildLine({ words, changedWordIndex, formatChangedWord, prefix }) {
  const wordsBefore = _.take(words, changedWordIndex);
  const changedWord = words[changedWordIndex];
  const wordsAfter = _.drop(words, changedWordIndex + 1);
  const line = _.chain([wordsBefore, formatChangedWord(changedWord), wordsAfter])
    .flatten()
    .join(' ')
    .trimEnd()
    .value();
  return `${prefix}${line}`;
}

exports.generateWordDiff = (before, after) => {
  const diff = diffLines(before, after);
  assert(_.filter(diff, 'removed').length === 1);
  assert(_.filter(diff, 'added').length === 1);

  const removedIndex = _.findIndex(diff, 'removed');
  const addedIndex = _.findIndex(diff, 'added');

  const removedWords = _.split(_.trimEnd(diff[removedIndex].value), ' ');
  const addedWords = _.split(_.trimEnd(diff[addedIndex].value), ' ');

  const changedWordIndex = _.findIndex(
    _.zip(removedWords, addedWords),
    ([removed, added]) => removed !== added
  );
  assert(changedWordIndex !== -1);

  const removedLine = buildLine({
    words: removedWords,
    changedWordIndex,
    formatChangedWord: chalk.red,
    prefix: '-',
  });

  const addedLine = buildLine({
    words: addedWords,
    changedWordIndex,
    formatChangedWord: chalk.green,
    prefix: '+',
  });

  return _.trim(`${removedLine}\n${addedLine}`);
};
