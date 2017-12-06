const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const _ = require('lodash');
const mockery = require('mockery');

describe('getMisspellings', () => {
  before(() => {
    mockery.registerAllowables(['fs', 'lodash', '../lib/spellcheck']);
    mockery.enable({ useCleanCache: true });
  });
  after(() => mockery.disable());

  function mockSpellchecker(checkSpelling, getCorrectionsForMisspelling) {
    mockery.deregisterMock('spellchecker');
    mockery.resetCache();
    mockery.registerMock('spellchecker', {
      checkSpellingAsync: () => Promise.resolve(checkSpelling()),
      getCorrectionsForMisspelling,
    });
    return require('../lib/spellcheck');
  }

  it('should return an empty array given a sentence with no misspellings', () => {
    const { getMisspellings } = mockSpellchecker(_.constant([]), _.noop);
    return getMisspellings('Test sentence').should.eventually.deep.equal([]);
  });

  it('should a single misspelling given a sentence with one misspelling', () => {
    const indices = [{ start: 5, end: 12 }];
    const suggestions = ['sentence', 'sententious'];
    const { getMisspellings } = mockSpellchecker(_.constant(indices), _.constant(suggestions));
    return getMisspellings('Test sentenc').should.eventually.deep.equal([
      {
        index: _.first(indices),
        misspelling: 'sentenc',
        suggestions,
      },
    ]);
  })
})
