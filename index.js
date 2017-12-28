const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const glob = require('globby');
const sum = require('lodash/sum');
const report = require('vfile-reporter');

const { Spellchecker } = require('./lib/spellchecker');

function printError(message) {
  console.error();
  console.error(chalk.red(message));
}

(async () => {
  const supportedLanguages = [
    'en-AU',
    'en-CA',
    'en-GB',
    'en-US',
    'en-ZA',
  ];

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
      name: 'language',
      alias: 'l',
      typeLabel: '<language>',
      description: `The language of the files. The default language is en-US. The following languages are supported: ${supportedLanguages.join(', ')}.`,
      defaultValue: 'en-US',
    },
    {
      name: 'dictionary',
      alias: 'd',
      typeLabel: '<file>',
      description: 'A file to use as a personal dictionary.',
    },
    {
      name: 'quiet',
      alias: 'q',
      type: Boolean,
      description: 'Do not output anything for files that contain no spelling mistakes.',
    },
    {
      name: 'help',
      alias: 'h',
      type: Boolean,
      description: 'Print this help screen.',
    },
  ];

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

  let parsedArgs;

  try {
    parsedArgs = commandLineArgs(optionList);
  } catch (error) {
    printError(error.toString());
    console.log(usage);
    process.exit(1);
  }

  const {
    files,
    language,
    dictionary: personalDictionaryPath,
    quiet,
    help,
  } = parsedArgs;

  if (help) {
    console.log(usage);
    return;
  }

  if (!files || files.length === 0) {
    printError('A list of files is required.');
    console.log(usage);
    process.exit(1);
  }

  if (!supportedLanguages.includes(language)) {
    printError(`The language "${language}" is not supported.`);
    console.log(usage);
    process.exit(1);
  }

  const spellchecker = new Spellchecker();
  await spellchecker.init({ language, personalDictionaryPath });

  const filesFromGlobs = await glob(files, { gitignore: true });

  const checkSpelling = filePath => spellchecker.checkSpelling.call(spellchecker, filePath);
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  console.log(report(vfiles, { quiet }));

  if (sum(vfiles, file => file.messages.length) > 0) {
    process.exit(1);
  }
})().catch((error) => {
  console.error(chalk.red(error));
  process.exit(1);
});
