const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const _ = require('lodash');
const mockery = require('mockery');

function mockSpellchecker(checkSpelling, getCorrectionsForMisspelling) {
  mockery.registerMock('spellchecker', {
    checkSpellingAsync: () => Promise.resolve(checkSpelling()),
    getCorrectionsForMisspelling,
  });
  return require('../lib/spellcheck');
}

describe('getMisspellings', () => {
  before(() => {
    mockery.registerAllowables(['fs', 'lodash', '../lib/spellcheck']);
    mockery.enable();
  });
  after(() => mockery.disable());

  it('should return an empty array given a sentence with no misspellings', () => {
    const { getMisspellings } = mockSpellchecker(_.constant([]), _.noop);
    return getMisspellings('Test sentence').should.eventually.deep.equal([]);
  });
})
