const chai = require('chai');
const { exec } = require('child_process');
const glob = require('globby');
const merge = require('lodash/merge');
const parallel = require('mocha.parallel');
const path = require('path');

const {
  supportedLanguages,
  addPlugins,
  removePlugins,
  supportedPlugins,
} = require('../lib/command-line');

chai.should();

function runWithArguments(args) {
  return new Promise((resolve) => {
    exec(`node index.js ${args}`, (error, stdout, stderr) => {
      if (error) {
        resolve(merge({}, error, { stdout, stderr }));
      }
      resolve({ stdout, stderr });
    });
  });
}

const notSpell = plugin => plugin !== 'spell';

const nonSpellPlugins = supportedPlugins.filter(notSpell);
const nonSpellAddPlugins = addPlugins.filter(notSpell);
const nonSpellRemovePlugins = removePlugins.filter(notSpell);

const toHyphenSplitRegex = word => word.split('-').join('-\\s*');

parallel('Spellchecker CLI', function testSpellcheckerCLI() {
  this.timeout(60000);
  this.slow(60000);

  it('prints the command-line usage when the argument `-h` is passed', async () => {
    const result = await runWithArguments('-h');
    result.should.not.have.property('code');
    result.stdout.should.include('A command-line tool for spellchecking files.');
  });

  it('prints the command-line usage when the argument `--help` is passed', async () => {
    const result = await runWithArguments('--help');
    result.should.not.have.property('code');
    result.stdout.should.include('A command-line tool for spellchecking files.');
  });

  it('lists all supported languages in the command-line usage', async () => {
    const { stdout } = await runWithArguments('-h');
    const languageRegex = new RegExp(supportedLanguages.map(toHyphenSplitRegex).join(',\\s*'));
    stdout.should.match(languageRegex);
  });

  it('lists all supported plugins in the command-line usage', async () => {
    const { stdout } = await runWithArguments('-h');
    const pluginRegex = new RegExp(supportedPlugins.map(toHyphenSplitRegex).join(',\\s*'));
    stdout.should.match(pluginRegex);
  });

  it('exits with an error when no arguments are provided', async () => {
    const { code, stderr } = await runWithArguments('');
    code.should.equal(1);
    stderr.should.include('A list of files is required.');
  });

  it('exits with an error when an empty list of files is provided', async () => {
    const { code, stderr } = await runWithArguments('--files');
    code.should.equal(1);
    stderr.should.include('A list of files is required.');
  });

  it('exits with an error when passed an unknown argument', async () => {
    const { code, stderr } = await runWithArguments('--test');
    code.should.equal(1);
    stderr.should.include('UNKNOWN_OPTION: Unknown option: --test');
  });

  it('exits with an error when passed an unknown language', async () => {
    const { code, stderr } = await runWithArguments('--files a b c --language test');
    code.should.equal(1);
    stderr.should.include('The language "test" is not supported.');
  });

  it('exits with an error when run on a file with a spelling mistake', async () => {
    const { code, stdout } = await runWithArguments('test/fixtures/incorrect.txt');
    code.should.equal(1);
    stdout.should.include('`Thisisnotaword` is misspelt');
  });

  it('exits with no error when run on a file with no spelling mistakes', async () => {
    const result = await runWithArguments('--files test/fixtures/correct.txt');
    result.should.not.have.property('code');
  });

  it('exits with an error when run with a dictionary that does not contain the words in the given file', async () => {
    const { code, stdout } = await runWithArguments('test/fixtures/en-CA.txt');
    code.should.equal(1);
    ['Colour', 'honour', 'behaviour'].forEach((word) => {
      stdout.should.include(`\`${word}\` is misspelt`);
    });
  });

  it('exits with no error when run with a dictionary that contains the words in the given file', async () => {
    const result = await runWithArguments('-f test/fixtures/en-CA.txt -l en-CA');
    result.should.not.have.property('code');
  });

  it('handles Markdown syntax', async () => {
    const { code, stdout } = await runWithArguments('--files test/fixtures/markdown.md');
    code.should.equal(1);
    ['Spellig', 'paragrap', 'containin', 'mistaks', 'Bullts', 'Moar'].forEach((word) => {
      stdout.should.include(`\`${word}\` is misspelt`);
    });
  });

  it('ignores spelling mistakes in code blocks', async () => {
    const result = await runWithArguments('-f test/fixtures/code-blocks.md');
    result.should.not.have.property('code');
  });

  it('ignores Gemoji', async () => {
    const result = await runWithArguments('-f test/fixtures/gemoji.md');
    result.should.not.have.property('code');
  });

  it('ignores HTML tables', async () => {
    const result = await runWithArguments('--files test/fixtures/table.md');
    result.should.not.have.property('code');
  });

  it('ignores words in the provided dictionary file', async () => {
    const result = await runWithArguments('test/fixtures/incorrect.txt --dictionary test/fixtures/dictionary.txt');
    result.should.not.have.property('code');
  });

  it('does not spellcheck the provided dictionary file', async () => {
    const { stdout } = await runWithArguments('-f test/fixtures/*.txt -d test/fixtures/dictionary.txt');
    stdout.should.not.contain('test/fixtures/dictionary.txt: no issues found');
  });

  it('spellchecks all files in a glob', async () => {
    const { stdout } = await runWithArguments('test/fixtures/*');
    const fileNames = await glob('*', { cwd: path.join(__dirname, 'test/fixtures') });
    fileNames.forEach((fileName) => {
      stdout.should.contain(`test/fixtures/${fileName}`);
    });
  });

  it('runs in quiet mode when the argument `-q` is passed', async () => {
    const { stdout } = await runWithArguments('--files test/fixtures/correct.txt -q');
    stdout.should.equal('\n');
  });

  it('runs in quiet mode when the argument `--quiet` is passed', async () => {
    const { stdout } = await runWithArguments('--files test/fixtures/correct.txt --quiet');
    stdout.should.equal('\n');
  });

  it('exits with no error when passed an empty list of plugins', async () => {
    const result = await runWithArguments('--files a b c --plugins');
    result.should.not.have.property('code');
  });

  it('exits with an error when passed unknown plugins', async () => {
    const { code, stderr } = await runWithArguments('--files a b c --plugins d e f');
    code.should.equal(1);
    stderr.should.include('The following retext plugins are not supported: d, e, f.');
  });

  it('does nothing when passed an empty list of plugins', async () => {
    const { stdout } = await runWithArguments('--files a b c --plugins');
    stdout.should.equal('\n');
  });

  it('applies only retext-spell by default', async () => {
    const { code, stdout } = await runWithArguments(`--files test/fixtures/{${nonSpellPlugins.join(',')}}.md`);
    code.should.equal(1);
    nonSpellAddPlugins.forEach((plugin) => {
      stdout.should.not.include(`retext-${plugin}`);
    });
    nonSpellRemovePlugins.forEach((plugin) => {
      stdout.should.not.include(`test/fixtures/${plugin}.md: no issues found`);
    });
  });

  it('applies all the specified plugins', async () => {
    const { code, stdout } = await runWithArguments(`--files test/fixtures/{${nonSpellPlugins.join(',')}}.md --plugins ${nonSpellPlugins.join(' ')}`);
    code.should.equal(1);
    nonSpellAddPlugins.forEach((plugin) => {
      stdout.should.include(`retext-${plugin}`);
    });
    nonSpellRemovePlugins.forEach((plugin) => {
      stdout.should.include(`test/fixtures/${plugin}.md: no issues found`);
    });
  });

  it('applies retext-indefinite-article when it is specified', async () => {
    const { code, stdout } = await runWithArguments('test/fixtures/indefinite-article.md -p indefinite-article');
    code.should.equal(1);
    stdout.should.include('Use `an` before `8-year`, not `a`');
    stdout.should.include('Use `an` before `hour`, not `a`');
    stdout.should.include('Use `a` before `European`, not `an`');
  });

  it('applies retext-repeated-words when it is specified', async () => {
    const { code, stdout } = await runWithArguments('test/fixtures/repeated-words.md -p repeated-words');
    code.should.equal(1);
    stdout.should.include('Expected `it` once, not twice');
    stdout.should.include('Expected `to` once, not twice');
    stdout.should.include('Expected `the` once, not twice');
  });

  it('applies retext-syntax-mentions when it is specified', async () => {
    const result = await runWithArguments('test/fixtures/syntax-mentions.md -p syntax-mentions');
    result.should.not.have.property('code');
  });

  it('applies retext-syntax-urls when it is specified', async () => {
    const result = await runWithArguments('test/fixtures/syntax-urls.md -p syntax-urls');
    result.should.not.have.property('code');
  });

  it('does not generate a personal dictionary if no spelling mistakes are found', async () => {
    const { stdout } = await runWithArguments('test/fixtures/repeated-words.md --plugins spell repeated-words');
    stdout.should.not.include('Personal dictionary written to dictionary.txt.');
  });
});
