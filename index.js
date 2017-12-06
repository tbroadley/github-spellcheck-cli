const _ = require('lodash');
const SpellChecker = require('spellchecker');

const document = 'The quikc (brown) foxx jumps ovr teh lazy dgo...';
SpellChecker.checkSpellingAsync(document)
  .then(indices => {
    const misspellings = indices.map(({ start, end }) => document.substring(start, end));
    const suggestions = misspellings.map(SpellChecker.getCorrectionsForMisspelling);
    return _.zipWith(indices, misspellings, suggestions, (index, misspelling, suggestions) => ({
      index,
      misspelling,
      suggestions,
    }));
  })
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
