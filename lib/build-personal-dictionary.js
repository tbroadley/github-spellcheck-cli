const fs = require('fs-extra');
const concat = require('lodash/concat');
const path = require('path');

function toDictionaryRegExp(entry) {
  return new RegExp(`^${entry}$`);
}

async function readPersonalDictionary(filePath) {
  if (path.extname(filePath).toLowerCase() === '.js') {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    return require(path.join(process.cwd(), filePath)).map((entry) => {
      if (entry instanceof RegExp) {
        return entry;
      }
      return toDictionaryRegExp(entry);
    });
  }

  const fileContents = await fs.readFile(filePath);
  return fileContents.toString().trim().split('\n').map(toDictionaryRegExp);
}

exports.buildPersonalDictionary = async (dictionaryPaths) => {
  const personalDictionaries = await Promise.all(dictionaryPaths.map(readPersonalDictionary));
  return concat(...personalDictionaries);
};
