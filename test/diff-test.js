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
});
