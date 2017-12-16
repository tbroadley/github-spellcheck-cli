const chalk = require('chalk');

const { chunkByFileName, generateWordDiff } = require('../lib/diff');

describe('generateWordDiff', () => {
  it('works correctly on a multiline text with a misspelling', () => {
    const before = `
The quick brown fpx
jumps over teh
lazyy dgo.
    `;
    const after = `
The quick brown fpx
jumps over the
lazyy dgo.
    `;
    const expected = `-jumps over ${chalk.red('teh')}\n+jumps over ${chalk.green('the')}`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly on a text with multiple consecutive newlines', () => {
    const before = `
The quick brown fox

jumps ver


the lazy dog.
    `;
    const after = `
The quick brown fox

jumps over


the lazy dog.
    `;
    const expected = `-jumps ${chalk.red('ver')}\n+jumps ${chalk.green('over')}`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly on a text with a hyphenated word removed', () => {
    const before = 'The quick-brown fox';
    const after = 'The  fox';
    const expected = `-The${chalk.red(' quick-brown ')}fox\n+The${chalk.green('  ')}fox`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly with a Markdown multiline blockquote', () => {
    const before = '> Line Line 1\n> Line Line 1';
    const after = '> Line Lien 1\n> Line Line 1';
    const expected = `-> Line ${chalk.red('Line')} 1\n+> Line ${chalk.green('Lien')} 1`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly with a long long Markdown multiline blockquote', () => {
    const before = '> This is a long long long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n';
    const after = '> This is a long lung long long long long long long long long long long long long long paragraph.\n> This is a long long long long long long long long long long long long long long long paragraph.\n';
    const expected = `-> This is a long ${chalk.red('long')} long long long long long long long long long long long long long paragraph.\n+> This is a long ${chalk.green('lung')} long long long long long long long long long long long long long paragraph.`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly with an unknown word', () => {
    const before = 'I wonder why NobodyKnowsThisWord huh';
    const after = 'I wonder why [unknown word] huh';
    const expected = `-I wonder why ${chalk.red('NobodyKnowsThisWord')} huh\n+I wonder why ${chalk.green('[unknown')} ${chalk.green('word] ')}huh`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly on a deleted duplicate word', () => {
    const before = 'This word word is duplicated';
    const after = 'This word is duplicated';
    const expected = `-This word ${chalk.red('word ')}is duplicated\n+This word is duplicated`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly on identical sentences', () => {
    const sentence = 'These sentences are identical.';
    const expected = `-${sentence}\n+${sentence}`;

    generateWordDiff(sentence, sentence).should.equal(expected);
  });
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
