const commandLineArgs = require('command-line-args');
const dictionary = require('dictionary-en-us');
const promisify = require('es6-promisify');
const fs = require('fs-extra');
const glob = require('globby');
const sum = require('lodash/sum');
const path = require('path');
const remark = require('remark');
const gemoji = require('remark-gemoji-to-emoji');
const remarkRetext = require('remark-retext');
const retext = require('retext');
const spell = require('retext-spell');
const vfile = require('vfile');
const report = require('vfile-reporter');

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

  const personalDictionary = personalDictionaryPath ?
    await fs.readFile(personalDictionaryPath) :
    '';

  const markdownParser = remark().use(gemoji);
  const spellchecker = retext().use(spell, {
    dictionary,
    personal: personalDictionary,
  });

  async function checkSpelling(filePath) {
    let spellcheckerForFileType;
    if (['.md', '.markdown'].includes(path.extname(filePath).toLowerCase())) {
      spellcheckerForFileType = spellchecker;
    } else {
      spellcheckerForFileType = markdownParser.use(remarkRetext, spellchecker);
    }

    const contents = await fs.readFile(filePath);
    const file = vfile({
      contents,
      path: filePath,
    });
    return promisify(spellcheckerForFileType.process)(file);
  }

  const filesFromGlobs = await glob(files, { gitignore: true });
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  console.log(report(vfiles));

  if (sum(vfiles, file => file.messages.length) > 0) {
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
