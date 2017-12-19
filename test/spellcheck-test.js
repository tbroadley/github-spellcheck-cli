const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

const _ = require('lodash');
const mockery = require('mockery');

describe('getMisspellings', () => {
  before(() => {
    mockery.registerAllowables(['fs', 'lodash', 'path', '../lib/spellcheck']);
    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
  });
  after(() => mockery.disable());

  function buildIndicesFromWords(document, words) {
    return _.map(words, (word) => {
      const start = document.indexOf(word);
      return {
        start,
        end: start + word.length,
      };
    });
  }

  function mockSpellchecker(indices, corrections) {
    mockery.deregisterMock('spellchecker');
    mockery.resetCache();
    mockery.registerMock('spellchecker', {
      checkSpellingAsync: _.constant(Promise.resolve(indices)),
      getCorrectionsForMisspelling: misspelling => corrections[misspelling],
    });
    // eslint-disable-next-line global-require
    return require('../lib/spellcheck');
  }

  function testSpellcheck({
    document, misspellings, corrections, expectedMisspellings, fileName,
  }) {
    const indices = buildIndicesFromWords(document, misspellings);
    const { getMisspellings } = mockSpellchecker(indices, corrections);
    return getMisspellings(document, fileName)
      .should.eventually.deep.equal(_.map(expectedMisspellings, index => ({
        index: indices[index],
        misspelling: misspellings[index],
        suggestions: corrections[misspellings[index]],
      })));
  }

  it('returns an empty array given a sentence with no misspellings', () => testSpellcheck({
    document: 'Test sentence',
    misspellings: [],
    corrections: [],
    expectedMisspellings: [],
    fileName: 'test.txt',
  }));

  it('returns a single misspelling given a sentence with one misspelling', () => testSpellcheck({
    document: 'Test sentenc',
    misspellings: ['sentenc'],
    corrections: { sentenc: ['sentence'] },
    expectedMisspellings: [0],
    fileName: 'test.txt',
  }));

  it('skips lines between triple backticks in a Markdown file', () => testSpellcheck({
    document: '```\ntset\n```',
    misspellings: ['tset'],
    corrections: { tset: ['test'] },
    expectedMisspellings: [],
    fileName: 'test.md',
  }));

  it('skips code blocks specified with four-space indent in a Markdown file', () => testSpellcheck({
    document: '# Heading\n\n    tset\n\ntest',
    misspellings: ['tset'],
    corrections: { tset: ['test'] },
    expectedMisspellings: [],
    fileName: 'test.md',
  }));

  it('skips inline code blocks in a Markdown file', () => testSpellcheck({
    document: '`tset`',
    misspellings: ['tset'],
    corrections: { tset: ['test'] },
    expectedMisspellings: [],
    fileName: 'test.md',
  }));

  it('spellchecks lines between triple backticks in a text file', () => testSpellcheck({
    document: '```\ntset\n```',
    misspellings: ['tset'],
    corrections: { tset: ['test'] },
    expectedMisspellings: [0],
    fileName: 'test.txt',
  }));

  it('skips Markdown link URLs but not link text', () => testSpellcheck({
    document: '[My awesoem project](/github)',
    misspellings: ['awesoem', 'github'],
    corrections: {
      awesoem: ['awesome'],
      github: ['gilt'],
    },
    expectedMisspellings: [0],
    fileName: 'test.md',
  }));

  it('spellchecks a Markdown link with one misspelled word', () => testSpellcheck({
    document: '[Testerino](/test)',
    misspellings: ['Testerino'],
    corrections: {
      Testerino: [],
    },
    expectedMisspellings: [0],
    fileName: 'testerino.md',
  }));

  it('skips Markdown image URLs but not alt text', () => testSpellcheck({
    document: '![Alt text with errror](/my-awesome-image.png)',
    misspellings: ['errror', 'png'],
    corrections: {
      errror: ['error'],
      png: ['pang'],
    },
    expectedMisspellings: [0],
    fileName: 'test.md',
  }));

  it('handles a Markdown image in a link', () => testSpellcheck({
    document: '[![Alt text with errror](/my-awesome-image.png)](/github)',
    misspellings: ['errror', 'png', 'github'],
    corrections: {
      errror: ['error'],
      png: ['pang'],
      github: ['gilt'],
    },
    expectedMisspellings: [0],
    fileName: 'test.md',
  }));

  it('handles an HTML img tag in a Markdown file', () => testSpellcheck({
    document: '# Heading\n\n<img src="/test.png">',
    misspellings: ['img', 'src'],
    corrections: {
      img: ['image'],
      src: ['sec'],
    },
    expectedMisspellings: [],
    fileName: 'test.md',
  }));

  it('handles an HTML table in a Markdown file', () => testSpellcheck({
    document: `
# Heading

<table>
  <th>
    <td>Colunm 1</td>
    <td>Column 2</td>
  </th>
  <tr>
    <td>Test</td>
    <td>Test 2</td>
  </tr>
  <tr>
    <td colspan="2">Wiide column</td>
  </tr>
</table>
      `,
    misspellings: ['th', 'td', 'Colunm', 'tr', 'colspan', 'Wiide'],
    corrections: {
      th: ['the'],
      td: ['the'],
      Colunm: ['Column'],
      tr: ['try'],
      colspan: ['column'],
      Wiide: ['Wide'],
    },
    expectedMisspellings: [2, 5],
    fileName: 'test.md',
  }));

  it('ignores capitalization changes', () => testSpellcheck({
    document: 'tHiS hAs some CAPitalization issues, github.',
    misspellings: ['tHiS', 'hAs', 'CAPitalization', 'github'],
    corrections: {
      tHiS: ['This'],
      hAs: ['has'],
      CAPitalization: ['capitalization'],
      github: ['GitHub'],
    },
    expectedMisspellings: [],
    fileName: 'test.txt',
  }));

  it('ignores abbreviation corrections', () => testSpellcheck({
    document: 'ie etc',
    misspellings: ['ie', 'etc'],
    corrections: {
      ie: ['i.e.'],
      etc: ['etc.'],
    },
    expectedMisspellings: [],
    fileName: 'test.txt',
  }));

  it('ignores HTML list elements', () => testSpellcheck({
    document: `
## Overview

*Static Methods*

<ul class="apiIndex">
  <li>
    <a href="#create">
      <pre>static create(...): CharacterMetadata</pre>
    </a>
  </li>
</ul>
<ol>
  <li>
    Test
  </li>
</ol>
    `,
    misspellings: ['ul', 'apiIndex', 'li', 'href', 'pre', 'CharacterMetadata', 'ol'],
    corrections: {
      ul: ['um'],
      apiIndex: [],
      li: ['lie'],
      href: ['here'],
      pre: ['pref'],
      CharacterMetadata: [],
    },
    expectedMisspellings: [1, 5],
    fileName: 'APIReference-CharacterMetadata.md',
  }));

  it('ignores image and URL references', () => testSpellcheck({
    document: '## [![npm][npmjs-img]][npmjs-url]',
    misspellings: ['npm', 'npmjs-img', 'npmjs-url'],
    corrections: {
      npm: [],
      'npmjs-img': [],
      'npmjs-url': [],
    },
    expectedMisspellings: [0],
    fileName: 'readme.md',
  }));

  it('ignores gemoji', () => testSpellcheck({
    document: `
# Heading :check_mark:
## Second heading :wonderful_stuff:

Just some normal text with a :+1_emoji:

  - Bullets and emoji :kpow:
    `,
    misspellings: ['check_mark', 'wonderful_stuff', '+1_emoji', 'kpow'],
    corrections: {
      check_mark: [],
      wonderful_stuff: [],
      '+1_emoji': [],
      kpow: [],
    },
    expectedMisspellings: [],
    fileName: 'readme.md',
  }));
});
