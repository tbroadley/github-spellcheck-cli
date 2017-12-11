const _ = require('lodash');
const SpellChecker = require('spellchecker');

function getIndicesOfRegexPart(getIndex) {
  return (document, re) => {
    const indices = [];
    let result;
    while ((result = re.exec(document)) !== null) {
      indices.push(getIndex(result));
    }
    return indices;
  };
}

const getIndicesOfFirstCaptureGroup = getIndicesOfRegexPart(result => {
  return result.index + result[0].indexOf(result[1]);
});

const getIndicesOfFullMatch = getIndicesOfRegexPart(result => ({
  start: result.index,
  end: result.index + result[0].length,
}));

function isInsideDelimiters(delimiterIndices, index) {
  return _.filter(delimiterIndices, i => i < index).length % 2 === 1;
}

function doesIndexMatchSomeRule(index, regexes, document, matcher) {
  return _(regexes).map(re => getIndicesOfFirstCaptureGroup(document, re))
                   .some(indices => matcher(indices, index));
}

function isIndexInSomeLine(index, regexes, document) {
  return _(regexes).flatMap(re => getIndicesOfFullMatch(document, re))
                   .some(({ start, end }) => start <= index && end > index);
}

function filterIndices(indices, document) {
  const delimiterRegexes = [
    /(?:^|[^`])+(`)(?:$|[^`])/gm,  // Backticks
    /^\s*(`{3})[\s\w]*$/gm,        // Triple backticks (Markdown code blocks)
  ];
  const indexRegexes = [
    /<\/?([-_\w]+)[-=_'"\s\w]*>/g, // HTML tag names
    /([-_\w]+)=['"]?[^'"]*['"]?/g, // HTML element property names
    /[-_\w]+=['"]?([^'"]*)['"]?/g, // HTML element property values
  ];
  const lineRegexes = [
    /^ {4}.*$/gm,              // Lines beginning with four spaces (Markdown code blocks)
  ];

  return _.reject(indices, ({ start }) => {
    return doesIndexMatchSomeRule(start, delimiterRegexes, document, isInsideDelimiters) ||
           doesIndexMatchSomeRule(start, indexRegexes, document, _.includes) ||
           isIndexInSomeLine(start, lineRegexes, document);
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
