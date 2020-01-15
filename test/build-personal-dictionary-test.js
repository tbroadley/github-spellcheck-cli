const chai = require('chai');

const { buildPersonalDictionary } = require('../lib/build-personal-dictionary');

chai.should();

describe('buildPersonalDictionary', () => {
  it('returns an empty array when no dictionaries are specified', async () => {
    (await buildPersonalDictionary([])).should.deep.equal([]);
  });

  it('reads a plaintext dictionary', async () => {
    (await buildPersonalDictionary(['test/fixtures/dictionaries/one.txt'])).should.deep.equal([
      /^Thisisnotaword$/,
      /^preprocessed$/,
    ]);
  });

  it('reads a plaintext dictionary that uses regex notation', async () => {
    (await buildPersonalDictionary(['test/fixtures/dictionaries/regex.txt'])).should.deep.equal([
      /^Thisisnot.*$/,
      /^(pre)?processed$/,
    ]);
  });

  it('reads a JavaScript dictionary', async () => {
    (await buildPersonalDictionary(['test/fixtures/dictionaries/regex.js'])).should.deep.equal([
      /^Thisisnotaword$/,
      /^(pre)?processed$/,
      /^canadaa$/i,
    ]);
  });

  it('reads multiple dictionaries', async () => {
    (await buildPersonalDictionary([
      'test/fixtures/dictionaries/one.txt',
      'test/fixtures/dictionaries/regex.js',
    ])).should.deep.equal([
      /^Thisisnotaword$/,
      /^preprocessed$/,
      /^Thisisnotaword$/,
      /^(pre)?processed$/,
      /^canadaa$/i
    ]);
  });
});
