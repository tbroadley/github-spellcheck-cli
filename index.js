const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const glob = require('globby');
const sum = require('lodash/sum');
const report = require('vfile-reporter');

const { Spellchecker } = require('./lib/spellchecker');

(async () => {
  const optionList = [
    {
      name: 'files',
      alias: 'f',
      typeLabel: '<file|glob> <file|glob>...',
      description: 'A list of files or globs to spellcheck.',
      multiple: true,
      defaultOption: true,
    },
    {
      name: 'dictionary',
      alias: 'd',
      typeLabel: '<file>',
      description: 'A file to use as a personal dictionary.',
    },
    {
      name: 'help',
      alias: 'h',
      type: Boolean,
      description: 'Print this help screen.',
    },
  ];

  const {
    files,
    dictionary: personalDictionaryPath,
    help,
  } = commandLineArgs(optionList);

  const usage = getUsage([
    {
      header: 'spellcheck',
      content: 'A command-line tool for spellchecking files.',
    },
    {
      header: 'Options',
      optionList,
    },
  ]);

  if (help) {
    console.log(usage);
    return;
  }

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
