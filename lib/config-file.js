const parse = require('path').parse
const appRootPath = require('app-root-path');
const { accessSync, readFileSync } = require('fs');
const yaml = require('js-yaml');
const jsonc = require('jsonc');

const { printError } = require('./print-error');

const tryLoad = (filePath) => {
  let result;

  try {
    extension = parse(filePath).ext.slice(1)
    if (extension === 'yaml' || extension === 'yml') {
      result = yaml.load(readFileSync(filePath, 'utf8'));
    } else {
      // extension is "json" or "jsonc"
      result = jsonc.parse(readFileSync(filePath, 'utf8'))
    }
  } catch (e) {
    printError(`Failed to read config file at ${filePath}. Error: ${e}`);
    process.exit(1);
  }

  return result;
};

const readConfigFile = (filePathFromArgs) => {
  if (filePathFromArgs) {
    return tryLoad(filePathFromArgs);
  }

  const filePath = [
    '/.spellcheckerrc.yaml',
    '/.spellcheckerrc.yml',
    './spellcheckerrc.json',
    './spellcheckerrc.jsonc'
  ]
    .map(path => appRootPath.resolve(path))
    .find((path) => {
      try {
        accessSync(path);
      } catch (e) {
        return false;
      }

      return true;
    });

  return filePath ? tryLoad(filePath) : {};
};

exports.readConfigFile = readConfigFile;
