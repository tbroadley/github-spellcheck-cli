const chalk = require('chalk');

const { chunkByFileName, generateWordDiff } = require('../lib/diff');

const removed = chalk.bgRed.white;
const added = chalk.bgGreen.white;

function testGenerateWordDiff({ before, after, expected }) {
  generateWordDiff(before, after).should.equal(expected);
}

describe('generateWordDiff', () => {
  it('works correctly on a multiline text with a misspelling', () => testGenerateWordDiff({
    before: `
The quick brown fpx
jumps over teh
lazyy dgo.
    `,
    after: `
The quick brown fpx
jumps over the
lazyy dgo.
    `,
    expected: `-jumps over ${removed('teh')}\n+jumps over ${added('the')}`,
  }));

  it('works correctly on a text with multiple consecutive newlines', () => testGenerateWordDiff({
    before: `
The quick brown fox

jumps ver


the lazy dog.
    `,
    after: `
The quick brown fox

jumps over


the lazy dog.
    `,
    expected: `-jumps ${removed('ver')}\n+jumps ${added('over')}`,
  }));

  it('works correctly on a text with a hyphenated word removed', () => testGenerateWordDiff({
    before: 'The quick-brown fox',
    after: 'The fox',
    expected: `-The ${removed('quick-brown ')}fox\n+The fox`,
  }));

  it('works correctly with a Markdown multiline blockquote', () => testGenerateWordDiff({
    before: '> Line Line 1\n> Line Line 1',
    after: '> Line Lien 1\n> Line Line 1',
    expected: `-> Line ${removed('Line')} 1\n+> Line ${added('Lien')} 1`,
  }));

  it('works correctly with a long long Markdown multiline blockquote', () => testGenerateWordDiff({
    before: '> This is a long long long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n',
    after: '> This is a long lung long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n',
    expected: `-> This is a long ${removed('long')} long long long long long long long long long long long long long paragraph.\n+> This is a long ${added('lung')} long long long long long long long long long long long long long paragraph.`,
  }));

  it('works correctly with an unknown word', () => testGenerateWordDiff({
    before: 'I wonder why NobodyKnowsThisWord huh',
    after: 'I wonder why [unknown word] huh',
    expected: `-I wonder why ${removed('NobodyKnowsThisWord')} huh\n+I wonder why ${added('[unknown word]')} huh`,
  }));

  it('works correctly on a deleted duplicate word', () => testGenerateWordDiff({
    before: 'This word word is duplicated',
    after: 'This word is duplicated',
    expected: `-This word ${removed('word ')}is duplicated\n+This word is duplicated`,
  }));

  it('works correctly on identical sentences', () => testGenerateWordDiff({
    before: 'These sentences are identical.',
    after: 'These sentences are identical.',
    expected: '-These sentences are identical.\n+These sentences are identical.',
  }));

  it('works correctly on a sentence with two words combined into one', () => testGenerateWordDiff({
    before: 'This sentence is a great sentence',
    after: 'This sentence is agreat sentence',
    expected: `-This sentence is ${removed('a great')} sentence\n+This sentence is ${added('agreat')} sentence`,
  }));

  it('works correctly on a sentence with one word broken into two', () => testGenerateWordDiff({
    before: 'This sentence is agreat sentence',
    after: 'This sentence is a great sentence',
    expected: `-This sentence is ${removed('agreat')} sentence\n+This sentence is ${added('a great')} sentence`,
  }));

  it('works correctly on a sentence with one word broken into three', () => testGenerateWordDiff({
    before: 'This sentence isagreat sentence',
    after: 'This sentence is a great sentence',
    expected: `-This sentence ${removed('isagreat')} sentence\n+This sentence ${added('is a great')} sentence`,
  }));

  it('works correctly on a sentence with one word broken into two around a period', () => testGenerateWordDiff({
    before: 'This sentence.is a great sentence',
    after: 'This sentence. Is a great sentence',
    expected: `-This sentence.${removed('is')} a great sentence\n+This sentence. ${added('Is ')}a great sentence`,
  }));

  it('works correctly when an apostrophe is removed', () => testGenerateWordDiff({
    before: 'I love React\'s components',
    after: 'I love React components',
    expected: `-I love React${removed('\'s')} components\n+I love React components`,
  }));
});

describe('chunkByFileName', () => {
  it('correctly chunks an empty array', () => {
    chunkByFileName([]).should.deep.equal([]);
  });

  it('correctly chunks an array with one element', () => {
    chunkByFileName([
      { path: 'a', diff: 'b' },
    ]).should.deep.equal([
      { path: 'a', diffs: ['b'] },
    ]);
  });

  it('correctly chunks an array with multiple elements with the same path', () => {
    chunkByFileName([
      { path: 'a', diff: 'b' },
      { path: 'a', diff: 'c' },
      { path: 'a', diff: 'd' },
    ]).should.deep.equal([
      { path: 'a', diffs: ['b', 'c', 'd'] },
    ]);
  });

  it('correctly chunks an array with two groups of paths', () => {
    chunkByFileName([
      { path: 'a', diff: '1' },
      { path: 'a', diff: '2' },
      { path: 'b', diff: '3' },
      { path: 'b', diff: '4' },
      { path: 'b', diff: '5' },
    ]).should.deep.equal([
      { path: 'a', diffs: ['1', '2'] },
      { path: 'b', diffs: ['3', '4', '5'] },
    ]);
  });

  it('correctly chunks a complicated case', () => {
    chunkByFileName([
      { path: 'a', diff: '1' },
      { path: 'b', diff: '2' },
      { path: 'a', diff: '3' },
      { path: 'a', diff: '4' },
      { path: 'c', diff: '5' },
      { path: 'c', diff: '6' },
      { path: 'a', diff: '7' },
      { path: 'c', diff: '8' },
    ]).should.deep.equal([
      { path: 'a', diffs: ['1'] },
      { path: 'b', diffs: ['2'] },
      { path: 'a', diffs: ['3', '4'] },
      { path: 'c', diffs: ['5', '6'] },
      { path: 'a', diffs: ['7'] },
      { path: 'c', diffs: ['8'] },
    ]);
  });
});
