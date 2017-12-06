const _ = require('lodash');
const SpellChecker = require('spellchecker');

exports.getMisspellings = document => SpellChecker.checkSpellingAsync(document)
  .then(indices => {
    const misspellings = indices.map(({ start, end }) => document.substring(start, end));
    const suggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    return _.zipWith(indices, misspellings, suggestions, (index, misspelling, suggestions) => ({
      index,
      misspelling,
      suggestions,
    }));
  });
