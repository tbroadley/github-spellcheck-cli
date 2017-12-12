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

  function buildIndicesFromWords(document, words) {
    return _.map(words, word => {
      const start = document.indexOf(word);
      return {
        start,
        end: start + word.length,
      };
    });
  }

  function mockSpellchecker(indices, corrections) {
    mockery.deregisterMock('spellchecker');
    mockery.resetCache();
    mockery.registerMock('spellchecker', {
      checkSpellingAsync: _.constant(Promise.resolve(indices)),
      getCorrectionsForMisspelling: misspelling => corrections[misspelling],
    });
    return require('../lib/spellcheck');
  }

  it('should return an empty array given a sentence with no misspellings', () => {
    const { getMisspellings } = mockSpellchecker([], {});
    return getMisspellings('Test sentence').should.eventually.deep.equal([]);
  });

  it('should return a single misspelling given a sentence with one misspelling', () => {
    const document = 'Test sentenc';
    const misspellings = ['sentenc'];
    const indices = buildIndicesFromWords(document, misspellings);
    const corrections = { sentenc: ['sentence', 'sententious'] };
    const { getMisspellings } = mockSpellchecker(indices, corrections);
    return getMisspellings(document).should.eventually.deep.equal([
      {
        index: _.first(indices),
        misspelling: 'sentenc',
        suggestions: corrections['sentenc'],
      },
    ]);
  });
});
