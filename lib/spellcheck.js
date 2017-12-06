const _ = require('lodash');
const SpellChecker = require('spellchecker');

function getIndicesOfFirstCaptureGroup(document, re) {
  const indices = [];
  let result;
  while ((result = re.exec(document)) !== null) {
    indices.push(result.index + result[0].indexOf(result[1]));
  }
  return indices;
}

function isInsideDelimiters(delimiterIndices, index) {
  return _.filter(delimiterIndices, i => i < index).length % 2 === 1;
}

function doesIndexMatchSomeRule(index, regexes, document, matcher) {
  return _(regexes).map(re => getIndicesOfFirstCaptureGroup(document, re))
                   .some(indices => matcher(indices, index));
}

function filterIndices(indices, document) {
  const delimiterRegexes = [
    /(?:^|[^`])+(`)(?:$|[^`])/gm,  // Backticks
    /^\s*(`{3})[\s\w]*$/gm,        // Triple backticks (Markdown code blocks)
  ];
  const indexRegexes = [
    /<\/?([-_\w]+)[-=_'"\s\w]*>/g, // HTML tag names
    /(\w+)=['"]?\w+['"]?/g,        // HTML element property names
    /\w+=['"]?(\w+)['"]?/g,        // HTML element property values
  ];

  return _.reject(indices, ({ start }) => {
    return doesIndexMatchSomeRule(start, delimiterRegexes, document, isInsideDelimiters) ||
           doesIndexMatchSomeRule(start, indexRegexes, document, _.includes);
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
