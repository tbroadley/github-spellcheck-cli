const { diffChars } = require('diff');
const _ = require('lodash');
const path = require('path');
const gemoji = require('remark-gemoji');
const parse = require('remark-parse');
const SpellChecker = require('spellchecker');
const unified = require('unified');

const parser = unified()
  .use(parse)
  .use(gemoji);

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
  'ol',
  'ul',
  'li',
  'pre',

  // Attributes
  'src',
  'colspan',
  'hspace',
  'vspace',
  'rel',
  'href',

  // Entities
  'amp',
  'lt',
  'gt',
  'Agrave',
  'Aacute',
  'Acirc',
  'Atilde',
  'Auml',
  'Aring',
  'AElig',
  'Ccedil',
  'Egrave',
  'Eacute',
  'Ecirc',
  'Euml',
  'Igrave',
  'Iacute',
  'Icirc',
  'Iuml',
  'ETH',
  'Ntilde',
  'Ograve',
  'Oacute',
  'Ocirc',
  'Otilde',
  'Ouml',
  'Oslash',
  'Ugrave',
  'Uacute',
  'Ucirc',
  'Uuml',
  'Yacute',
  'THORN',
  'szlig',
  'agrave',
  'aacute',
  'acirc',
  'atilde',
  'auml',
  'aring',
  'aelig',
  'ccedil',
  'egrave',
  'eacute',
  'ecirc',
  'euml',
  'igrave',
  'iacute',
  'icirc',
  'iuml',
  'eth',
  'ntilde',
  'ograve',
  'oacute',
  'ocirc',
  'otilde',
  'ouml',
  'oslash',
  'ugrave',
  'uacute',
  'ucirc',
  'uuml',
  'yacute',
  'thorn',
  'yuml',
  'nbsp',
  'iexcl',
  'cent',
  'pound',
  'curren',
  'yen',
  'brvbar',
  'sect',
  'uml',
  'copy',
  'ordf',
  'laquo',
  'not',
  'shy',
  'reg',
  'macr',
  'deg',
  'plusmn',
  'sup2',
  'sup3',
  'acute',
  'micro',
  'para',
  'cedil',
  'sup1',
  'ordm',
  'raquo',
  'frac14',
  'frac12',
  'frac34',
  'iquest',
  'times',
  'divide',
  'forall',
  'part',
  'exist',
  'empty',
  'nabla',
  'isin',
  'notin',
  'ni',
  'prod',
  'sum',
  'minus',
  'lowast',
  'radic',
  'prop',
  'infin',
  'ang',
  'and',
  'or',
  'cap',
  'cup',
  'int',
  'there4',
  'sim',
  'cong',
  'asymp',
  'ne',
  'equiv',
  'le',
  'ge',
  'sub',
  'sup',
  'nsub',
  'sube',
  'supe',
  'oplus',
  'otimes',
  'perp',
  'sdot',
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'zeta',
  'eta',
  'theta',
  'iota',
  'kappa',
  'lambda',
  'mu',
  'nu',
  'xi',
  'omicron',
  'pi',
  'rho',
  'sigmaf',
  'sigma',
  'tau',
  'upsilon',
  'phi',
  'chi',
  'psi',
  'omega',
  'thetasym',
  'upsih',
  'piv',
  'OElig',
  'oelig',
  'Scaron',
  'scaron',
  'Yuml',
  'fnof',
  'circ',
  'tilde',
  'ensp',
  'emsp',
  'thinsp',
  'zwnj',
  'zwj',
  'lrm',
  'rlm',
  'ndash',
  'mdash',
  'lsquo',
  'rsquo',
  'sbquo',
  'ldquo',
  'rdquo',
  'bdquo',
  'dagger',
  'Dagger',
  'bull',
  'hellip',
  'permil',
  'prime',
  'Prime',
  'lsaquo',
  'rsaquo',
  'oline',
  'euro',
  'trade',
  'larr',
  'uarr',
  'rarr',
  'darr',
  'harr',
  'crarr',
  'lceil',
  'rceil',
  'lfloor',
  'rfloor',
  'loz',
  'spades',
  'clubs',
  'hearts',
  'diams',
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
  return _.some(htmlStringsToExclude, (htmlString) => {
    const substringStart = index.start - startOffset;
    const substringEnd = substringStart + htmlString.length;
    return node.value.substring(substringStart, substringEnd) === htmlString;
  });
}

function isEmoji(index, node) {
  const { value } = node;
  const [startOffset] = getOffsets(node);
  const emojiRegex = /:[-_+\w]+:/g;
  let result = emojiRegex.exec(value);

  while (result !== null) {
    const emojiStartOffset = startOffset + result.index + 1;
    const emojiEndOffset = emojiStartOffset + (result[0].length - 1);

    if (_.every([index.start, index.end], i => _.inRange(i, emojiStartOffset, emojiEndOffset))) {
      return true;
    }

    result = emojiRegex.exec(value);
  }

  return false;
}

function excludeIndex(index, node) {
  const {
    type,
    children,
  } = node;

  return inNode(index, node) && (
    _.includes(typesToExclude, type) ||
    ((type === 'link' || type === 'linkReference') && !_.some(children, child => inNode(index, child))) ||
    ((type === 'image' || type === 'imageReference') && isInImageUrl(index, node)) ||
    (type === 'html' && isInHtmlTagOrAttribute(index, node)) ||
    isEmoji(index, node) ||
    _.some(children, child => excludeIndex(index, child))
  );
}

function filterIndices(indices, document) {
  const parsedDocument = parser.parse(document);
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
  .then((indices) => {
    const filteredIndices = isMarkdown(filePath) ? filterIndices(indices, document) : indices;
    const misspellings = filteredIndices.map(({ start, end }) => document.substring(start, end));
    const allSuggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    const misspellingObjects = _.zipWith(
      filteredIndices,
      misspellings,
      allSuggestions,
      (index, misspelling, suggestions) => ({
        index,
        misspelling,
        suggestions,
      })
    );
    return _.reject(misspellingObjects, o => isCapitalizationChange(o) || onlyPeriodsAdded(o));
  });
