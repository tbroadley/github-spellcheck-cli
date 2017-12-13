const _ = require('lodash');
const path = require('path');
const remark = require('remark');
const SpellChecker = require('spellchecker');

function isMarkdown(filePath) {
  return _.includes(['.md', '.markdown'], _.toLower(path.extname(filePath)));
}

const typesToExclude = ['code', 'inlineCode'];

function excludeIndex(index, parsedDocument) {
  const {
    type,
    children,
    position: {
      start: {
        offset: startOffset,
      },
      end: {
        offset: endOffset,
      }
    },
  } = parsedDocument;

  return _.inRange(index.start, startOffset, endOffset) && (
    _.includes(typesToExclude, type) ||
    _.some(children, child => excludeIndex(index, child))
  );
}

function filterIndices(indices, document) {
  const parsedDocument = remark.parse(document);
  return _.reject(indices, index => excludeIndex(index, parsedDocument));
}

exports.getMisspellings = (document, filePath) => SpellChecker.checkSpellingAsync(document)
  .then(indices => {
    const filteredIndices = isMarkdown(filePath) ? filterIndices(indices, document) : indices;
    const misspellings = filteredIndices.map(({ start, end }) => document.substring(start, end));
    const suggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    return _.zipWith(filteredIndices, misspellings, suggestions, (index, misspelling, suggestions) => ({
      index,
      misspelling,
      suggestions,
    }));
  });
