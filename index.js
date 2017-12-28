const commandLineArgs = require('command-line-args');
const glob = require('globby');
const sum = require('lodash/sum');
const report = require('vfile-reporter');

const { Spellchecker } = require('./lib/spellchecker');

(async () => {
  const optionDefinitions = [
    {
      name: 'files',
      alias: 'f',
      multiple: true,
      defaultOption: true,
    },
    {
      name: 'dictionary',
      alias: 'd',
    },
  ];

  const {
    files,
    dictionary: personalDictionaryPath,
  } = commandLineArgs(optionDefinitions);

  const spellchecker = new Spellchecker();
  await spellchecker.init(personalDictionaryPath);

  const filesFromGlobs = await glob(files, { gitignore: true });

  const checkSpelling = filePath => spellchecker.checkSpelling.call(spellchecker, filePath);
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  console.log(report(vfiles));

  if (sum(vfiles, file => file.messages.length) > 0) {
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
