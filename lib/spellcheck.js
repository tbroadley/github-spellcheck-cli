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
  'html',
  'link',
  'meta',
  'style',
  'body',
  'address',
  'article',
  'aside',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hgroup',
  'nav',
  'section',
  'blockquote',
  'dd',
  'dir',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'hr',
  'li',
  'main',
  'ol',
  'p',
  'pre',
  'ul',
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'kbd',
  'mark',
  'nobr',
  'q',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'area',
  'audio',
  'img',
  'map',
  'track',
  'video',
  'applet',
  'embed',
  'noembed',
  'object',
  'param',
  'picture',
  'source',
  'canvas',
  'noscript',
  'script',
  'del',
  'ins',
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'button',
  'datalist',
  'fieldset',
  'form',
  'input',
  'label',
  'legend',
  'meter',
  'optgroup',
  'option',
  'output',
  'progress',
  'select',
  'textarea',
  'details',
  'dialog',
  'menu',
  'menuitem',
  'summary',
  'content',
  'element',
  'shadow',
  'slot',
  'template',
  'acronym',
  'applet',
  'basefont',
  'bgsound',
  'big',
  'blink',
  'center',
  'command',
  'content',
  'dir',
  'element',
  'font',
  'frame',
  'frameset',
  'image',
  'isindex',
  'keygen',
  'listing',
  'marquee',
  'menu',
  'menuitem',
  'multicol',
  'nextid',
  'nobr',
  'noembed',
  'noframes',
  'plaintext',
  'shadow',
  'spacer',
  'strike',
  'tt',
  'xmp',

  // Attributes
  'accept-charset',
  'accesskey',
  'action',
  'align',
  'alt',
  'async',
  'autocomplete',
  'autofocus',
  'autoplay',
  'bgcolor',
  'border',
  'buffered',
  'challenge',
  'charset',
  'checked',
  'cite',
  'class',
  'code',
  'codebase',
  'color',
  'cols',
  'colspan',
  'content',
  'contenteditable',
  'contextmenu',
  'controls',
  'coords',
  'crossorigin',
  'data',
  'data-*',
  'datetime',
  'default',
  'defer',
  'dir',
  'dirname',
  'disabled',
  'download',
  'draggable',
  'dropzone',
  'enctype',
  'for',
  'form',
  'formaction',
  'headers',
  'height',
  'hidden',
  'high',
  'href',
  'hreflang',
  'http-equiv',
  'icon',
  'id',
  'integrity',
  'ismap',
  'itemprop',
  'keytype',
  'kind',
  'label',
  'lang',
  'language',
  'list',
  'loop',
  'low',
  'manifest',
  'max',
  'maxlength',
  'minlength',
  'media',
  'method',
  'min',
  'multiple',
  'muted',
  'name',
  'novalidate',
  'open',
  'optimum',
  'pattern',
  'ping',
  'placeholder',
  'poster',
  'preload',
  'radiogroup',
  'readonly',
  'rel',
  'required',
  'reversed',
  'rows',
  'rowspan',
  'sandbox',
  'scope',
  'scoped',
  'seamless',
  'selected',
  'shape',
  'size',
  'sizes',
  'slot',
  'span',
  'spellcheck',
  'src',
  'srcdoc',
  'srclang',
  'srcset',
  'start',
  'step',
  'style',
  'summary',
  'tabindex',
  'target',
  'title',
  'type',
  'usemap',
  'value',
  'width',
  'wrap',

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
  const substringStart = index.start - startOffset;
  const substringEnd = index.end - startOffset;
  // console.log(node.value.substring(substringStart, substringEnd));
  return _(htmlStringsToExclude)
    .filter({ length: index.end - index.start })
    .some(htmlString => node.value.substring(substringStart, substringEnd) === htmlString);
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

function inCodeElement(index, node) {
  const { children } = node;
  const childIndex = _.findIndex(children, (child) => {
    const [childStartOffset, childEndOffset] = getOffsets(child);
    return _.inRange(index.start, childStartOffset, childEndOffset);
  });
  if (childIndex > 0 && childIndex < children.length - 1) {
    const { type: childBeforeType, value: childBeforeValue } = children[childIndex - 1];
    const { type: childAfterType, value: childAfterValue } = children[childIndex + 1];
    return childBeforeType === 'html' &&
           /^<code ?.*>/.test(childBeforeValue) &&
           childAfterType === 'html' &&
           childAfterValue === '</code>';
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
    inCodeElement(index, node) ||
    isEmoji(index, node) ||
    _.some(children, child => excludeIndex(index, child))
  );
}

function filterIndices(indices, document) {
  const parsedDocument = parser.parse(document);
  // console.log(require('util').inspect(parsedDocument, {depth:null}));
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
