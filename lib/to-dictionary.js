const flatMap = require('lodash/flatMap');
const uniq = require('lodash/uniq');

exports.toDictionary = (vfiles) => {
  const misspellings = flatMap(vfiles, (file) => {
    const retextSpellMessages = file.messages.filter(message => message.source === 'retext-spell');
    return retextSpellMessages.map(m => m.actual);
  });
  return uniq(misspellings).sort().join('\n');
};
