const appRootPath = require('app-root-path');
const { accessSync, readFileSync } = require('fs');
const yaml = require('js-yaml');

const { printError } = require('./print-error');

const tryLoadYaml = (filePath) => {
  let result;

  try {
    result = yaml.load(readFileSync(filePath, 'utf8'));
  } catch (e) {
    printError(`Failed to read config file at ${filePath}. Error: ${e}`);
    process.exit(1);
  }

  return result;
};

const readConfigFile = (filePathFromArgs) => {
  if (filePathFromArgs) {
    return tryLoadYaml(filePathFromArgs);
  }

  const filePath = [
    '/.spellcheckerrc.yaml',
    '/.spellcheckerrc.yml',
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

  return filePath ? tryLoadYaml(filePath) : {};
};

exports.readConfigFile = readConfigFile;
