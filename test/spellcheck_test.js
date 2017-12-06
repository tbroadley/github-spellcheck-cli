const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const { getMisspellings } = require('../lib/spellcheck');

describe('getMisspellings', () => {
  it('should return an empty array given a sentence with no misspellings', () => {
    const document = 'The quick brown fox jumps over the lazy dog';
    return getMisspellings(document).should.eventually.deep.equal([]);
  });
})
