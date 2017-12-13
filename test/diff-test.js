const chalk = require('chalk');

const { generateWordDiff } = require('../lib/diff');

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
    `
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
    const expected = `-The ${chalk.red('quick-brown')} fox\n+The ${chalk.green('')} fox`;

    generateWordDiff(before, after).should.equal(expected);
  });

  it('works correctly with a Markdown multiline blockquote', () => {
    const before = '> Line Line 1\n> Line Line 1';
    const after = '> Line Lien 1\n> Line Line 1';
    const expected = `-> Line ${chalk.red('Line')} 1\n+> Line ${chalk.green('Lien')} 1`;

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
});
