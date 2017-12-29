const chai = require('chai');
const { exec } = require('child_process');
const glob = require('globby');
const merge = require('lodash/merge');
const path = require('path');

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

describe('Spellchecker CLI', () => {
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
});
