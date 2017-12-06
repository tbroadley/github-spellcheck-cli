const _ = require('lodash');
const SpellChecker = require('spellchecker');

function getDelimiterIndices(document, re) {
  const indices = [];
  let result;
  while ((result = re.exec(document)) !== null) {
    indices.push(result.index + result[0].indexOf(result[1]));
  }
  return indices;
}

function isInsideDelimiters(index, delimiterIndices) {
  return _.filter(delimiterIndices, i => i < index).length % 2 === 1;
}

function getHtmlTagNameIndices(document) {
  const re = /<\/?([-_\w]+)[-=_'"\s\w]*>/g;
  const indices = [];
  let result;
  while ((result = re.exec(document)) !== null) {
    indices.push(result.index + result[0].indexOf(result[1]));
  }
  return indices;
}

function isHtmlTagName(index, htmlTagNameIndices) {
  return _.some(htmlTagNameIndices, i => i === index);
}

function filterIndices(indices, document) {
  const CODE_REGEX = /(?:^|[^`])+(`)(?:$|[^`])/gm;
  const CODE_BLOCK_REGEX = /^\s*(`{3})[\s\w]*$/gm;

  const codeDelimiterIndices = getDelimiterIndices(document, CODE_REGEX);
  const codeBlockDelimiterIndices = getDelimiterIndices(document, CODE_BLOCK_REGEX);
  const htmlTagNameIndices = getHtmlTagNameIndices(document);

  return _.reject(indices, ({ start }) => {
    return isInsideDelimiters(start, codeDelimiterIndices) ||
           isInsideDelimiters(start, codeBlockDelimiterIndices) ||
           isHtmlTagName(start, htmlTagNameIndices);
  });
}

exports.getMisspellings = document => SpellChecker.checkSpellingAsync(document)
  .then(indices => {
    const filteredIndices = filterIndices(indices, document);
    const misspellings = filteredIndices.map(({ start, end }) => document.substring(start, end));
    const suggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    return _.zipWith(filteredIndices, misspellings, suggestions, (index, misspelling, suggestions) => ({
      index,
      misspelling,
      suggestions,
    }));
  });
