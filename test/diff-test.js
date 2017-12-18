const chalk = require('chalk');

const { chunkByFileName, generateWordDiff } = require('../lib/diff');

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
    expected: `-jumps over ${chalk.red('teh')}\n+jumps over ${chalk.green('the')}`,
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
    expected: `-jumps ${chalk.red('ver')}\n+jumps ${chalk.green('over')}`,
  }));

  it('works correctly on a text with a hyphenated word removed', () => testGenerateWordDiff({
    before: 'The quick-brown fox',
    after: 'The  fox',
    expected: `-The${chalk.red(' quick-brown ')}fox\n+The${chalk.green('  ')}fox`,
  }));

  it('works correctly with a Markdown multiline blockquote', () => testGenerateWordDiff({
    before: '> Line Line 1\n> Line Line 1',
    after: '> Line Lien 1\n> Line Line 1',
    expected: `-> Line ${chalk.red('Line')} 1\n+> Line ${chalk.green('Lien')} 1`,
  }));

  it('works correctly with a long long Markdown multiline blockquote', () => testGenerateWordDiff({
    before: '> This is a long long long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n',
    after: '> This is a long lung long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n',
    expected: `-> This is a long ${chalk.red('long')} long long long long long long long long long long long long long paragraph.\n+> This is a long ${chalk.green('lung')} long long long long long long long long long long long long long paragraph.`,
  }));

  it('works correctly with an unknown word', () => testGenerateWordDiff({
    before: 'I wonder why NobodyKnowsThisWord huh',
    after: 'I wonder why [unknown word] huh',
    expected: `-I wonder why ${chalk.red('NobodyKnowsThisWord')} huh\n+I wonder why ${chalk.green('[unknown')} ${chalk.green('word] ')}huh`,
  }));

  it('works correctly on a deleted duplicate word', () => testGenerateWordDiff({
    before: 'This word word is duplicated',
    after: 'This word is duplicated',
    expected: `-This word ${chalk.red('word ')}is duplicated\n+This word is duplicated`,
  }));

  it('works correctly on identical sentences', () => testGenerateWordDiff({
    before: 'These sentences are identical.',
    after: 'These sentences are identical.',
    expected: '-These sentences are identical.\n+These sentences are identical.',
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
