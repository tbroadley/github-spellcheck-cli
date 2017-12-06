const _ = require('lodash');
require('chai').should();

const { getMisspellings } = require('../lib/spellcheck');

describe('getMisspellings', () => {
  it('should return an empty array given a sentence with no misspellings', () => {
    const document = 'The quick brown fox jumps over the lazy dog';
    getMisspellings(document).then(result => result.should.deep.equal([]));
  });
})
