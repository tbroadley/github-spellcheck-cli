const { diffChars } = require('diff');
const _ = require('lodash');
const path = require('path');
const remark = require('remark');
const SpellChecker = require('spellchecker');

function isMarkdown(filePath) {
  return _.includes(['.md', '.markdown'], _.toLower(path.extname(filePath)));
}

const typesToExclude = ['code', 'inlineCode'];
const htmlStringsToExclude = [

  // Tags
  'img',
  'br',
  'th',
  'tr',
  'td',
  'hr',

  // Attributes
  'src',
  'colspan',
  'hspace',
  'vspace',
  'rel',
  'href',

];

function getOffsets(node) {
  const {
    position: {
      start: {
        offset: startOffset,
      },
      end: {
        offset: endOffset,
      },
    },
  } = node;

  return [startOffset, endOffset];
}

function inNode(index, node) {
  const [startOffset, endOffset] = getOffsets(node);
  return _.inRange(index.start, startOffset, endOffset);
}

function isInImageUrl(index, node) {
  const { alt } = node;
  const [startOffset, endOffset] = getOffsets(node);
  const imageStart = `![${alt}](`;
  const imageEnd = ')';
  return _.inRange(index.start, startOffset + imageStart.length, endOffset - imageEnd.length);
}

function isInHtmlTagOrAttribute(index, node) {
  const [startOffset] = getOffsets(node);
  return _.some(htmlStringsToExclude, htmlString => {
    const substringStart = index.start - startOffset;
    const substringEnd = substringStart + htmlString.length;
    return node.value.substring(substringStart, substringEnd) === htmlString  ;
  });
}

function excludeIndex(index, node) {
  const {
    type,
    children,
  } = node;

  return inNode(index, node) && (
    _.includes(typesToExclude, type) ||
    (type === 'link' && !_.some(children, child => inNode(index, child))) ||
    (type === 'image' && isInImageUrl(index, node)) ||
    (type === 'html' && isInHtmlTagOrAttribute(index, node)) ||
    _.some(children, child => excludeIndex(index, child))
  );
}

function filterIndices(indices, document) {
  const parsedDocument = remark.parse(document);
  return _.reject(indices, index => excludeIndex(index, parsedDocument));
}

function isCapitalizationChange({ misspelling, suggestions: [suggestion] }) {
  return suggestion && (_.toLower(misspelling) === _.toLower(suggestion));
}

function onlyPeriodsAdded({ misspelling, suggestions: [suggestion] }) {
  if (!suggestion) {
    return false;
  }

  const diff = diffChars(misspelling, suggestion);
  return _(diff).filter('removed').isEmpty() &&
         _(diff).filter('added').every(({ value }) => /^\.+$/.test(value));
}

exports.getMisspellings = (document, filePath) => SpellChecker.checkSpellingAsync(document)
  .then(indices => {
    const filteredIndices = isMarkdown(filePath) ? filterIndices(indices, document) : indices;
    const misspellings = filteredIndices.map(({ start, end }) => document.substring(start, end));
    const suggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    const misspellingObjects = _.zipWith(filteredIndices, misspellings, suggestions, (index, misspelling, suggestions) => ({
      index,
      misspelling,
      suggestions,
    }));
    return _.reject(misspellingObjects, obj => isCapitalizationChange(obj) || onlyPeriodsAdded(obj));
  });
