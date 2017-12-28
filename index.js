const commandLineArgs = require('command-line-args');
const dictionary = require('dictionary-en-us');
const promisify = require('es6-promisify');
const fs = require('fs-extra');
const glob = require('globby');
const path = require('path');
const remark = require('remark');
const gemoji = require('remark-gemoji-to-emoji');
const remarkRetext = require('remark-retext');
const retext = require('retext');
const spell = require('retext-spell');

const markdownParser = remark().use(gemoji);
const spellchecker = retext().use(spell, dictionary);

async function checkSpelling(filePath) {
  let spellcheckerForFileType;
  if (['.md', '.markdown'].includes(path.extname(filePath).toLowerCase())) {
    spellcheckerForFileType = spellchecker;
  } else {
    spellcheckerForFileType = markdownParser.use(remarkRetext, spellchecker);
  }
  console.log(`Checking ${filePath}...`);

  const fileContents = await fs.readFile(filePath);
  const vfile = await promisify(spellcheckerForFileType.process)(fileContents);
  return vfile.messages;
}

const optionDefinitions = [
  {
    name: 'files',
    alias: 'f',
    multiple: true,
    defaultOption: true,
  },
];

(async () => {
  const {
    files,
  } = commandLineArgs(optionDefinitions);

  const filesFromGlobs = await glob(files, { gitignore: true });
  console.log(filesFromGlobs);
  const spellingMistakes = await Promise.all(filesFromGlobs.map(checkSpelling));
  console.log(spellingMistakes);
})();
