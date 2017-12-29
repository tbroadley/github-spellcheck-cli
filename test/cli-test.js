const chai = require('chai');
const { exec } = require('child_process');
const merge = require('lodash/merge');

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
    const { code } = await runWithArguments('test/fixtures/incorrect.txt');
    code.should.equal(1);
  });

  it('exits with no error when run on a file with no spelling mistakes', async () => {
    const result = await runWithArguments('--files test/fixtures/correct.txt');
    result.should.not.have.property('code');
  });

  it('exits with an error when run with a dictionary that does not contain the words in the given file', async () => {
    const { code } = await runWithArguments('test/fixtures/en-CA.txt');
    code.should.equal(1);
  });

  it('exits with no error when run with a dictionary that contains the words in the given file', async () => {
    const result = await runWithArguments('-f test/fixtures/en-CA.txt -l en-CA');
    result.should.not.have.property('code');
  });
});
