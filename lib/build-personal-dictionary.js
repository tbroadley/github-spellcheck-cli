const fs = require('fs-extra');
const path = require('path');

function readPersonalDictionary(filePath) {
  if (path.extname(filePath).toLowerCase() === '.js') {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(path.join(process.cwd(), filePath)).map(line => `${line}\n`).join('');
  }
  return fs.readFile(filePath);
}

exports.buildPersonalDictionary = async (dictionaryPaths) => {
  if (dictionaryPaths.length > 0) {
    const personalDictionaries = await Promise.all(dictionaryPaths.map(readPersonalDictionary));
    return personalDictionaries.join('');
  }
  return '';
};
