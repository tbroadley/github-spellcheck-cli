const flatMap = require('lodash/flatMap');
const uniq = require('lodash/uniq');

exports.toDictionary = (vfiles) => {
  const misspellings = flatMap(vfiles, f => f.messages.map(m => m.actual));
  return uniq(misspellings).sort().join('\n');
};
