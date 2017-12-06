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

  function mockSpellchecker(indices, getCorrectionsForMisspelling) {
    mockery.deregisterMock('spellchecker');
    mockery.resetCache();
    mockery.registerMock('spellchecker', {
      checkSpellingAsync: _.constant(Promise.resolve(indices)),
      getCorrectionsForMisspelling,
    });
    return require('../lib/spellcheck');
  }

  it('should return an empty array given a sentence with no misspellings', () => {
    const { getMisspellings } = mockSpellchecker([], _.noop);
    return getMisspellings('Test sentence').should.eventually.deep.equal([]);
  });

  it('should return a single misspelling given a sentence with one misspelling', () => {
    const document = 'Test sentenc';
    const misspellings = ['sentenc'];
    const indices = buildIndicesFromWords(document, misspellings);
    const suggestions = ['sentence', 'sententious'];
    const { getMisspellings } = mockSpellchecker(indices, _.constant(suggestions));
    return getMisspellings(document).should.eventually.deep.equal([
      {
        index: _.first(indices),
        misspelling: 'sentenc',
        suggestions,
      },
    ]);
  });

  it('should handle Markdown backticks correctly', () => {
    const document = '`libssl`. A rael spelling mistake. This `libary` is in a sentenc. `tset`';
    const misspellings = ['libssl', 'rael', 'libary', 'sentenc', 'tset'];
    const indices = buildIndicesFromWords(document, misspellings);
    const suggestions = [];
    const { getMisspellings } = mockSpellchecker(indices, _.constant(suggestions));
    return getMisspellings(document).should.eventually.deep.equal(
      _.map([indices[1], indices[3]], index => ({
        index,
        misspelling: document.substring(index.start, index.end),
        suggestions: [],
      }))
    );
  });

  it('should handle Markdown triple backticks correctly', () => {
    const document = `
\`\`\`
Code bolck
\`\`\`
Outside code bloock
\`\`\`test
Codee block with language
\`\`\`

Outisde code block again


\`\`\` test2
Code boock with language and space
\`\`\`
    `;
    const misspellings = ['bolck', 'bloock', 'Codee', 'Outisde', 'boock'];
    const indices = buildIndicesFromWords(document, misspellings);
    const suggestions = [];
    const { getMisspellings } = mockSpellchecker(indices, _.constant(suggestions));
    return getMisspellings(document).should.eventually.deep.equal(
      _.map([indices[1], indices[3]], index => ({
        index,
        misspelling: document.substring(index.start, index.end),
        suggestions: [],
      }))
    );
  });
})
