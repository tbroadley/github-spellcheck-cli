#!/usr/bin/env node

const fs = require('fs-extra');
const glob = require('globby');
const report = require('vfile-reporter');

const { buildPersonalDictionary } = require('./lib/build-personal-dictionary');
const { parseConfig } = require('./lib/config');
const { hasMessages } = require('./lib/has-messages');
const { printError } = require('./lib/print-error');
const { Spellchecker } = require('./lib/spellchecker');
const { toDictionary } = require('./lib/to-dictionary');
const { generateReports } = require('./lib/report-generator');

(async () => {
  const {
    files,
    language,
    personalDictionaryPaths,
    generateDictionary,
    noGitignore,
    ignoreRegexes,
    suggestions,
    plugins,
    reports,
    quiet,
  } = parseConfig();

  const personalDictionary = await buildPersonalDictionary(personalDictionaryPaths);
  const spellchecker = new Spellchecker({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  });

  if (personalDictionaryPaths.length > 0) {
    files.push(...personalDictionaryPaths.map(filePath => `!${filePath}`));
  }

  const filesFromGlobs = await glob(files, { gitignore: !noGitignore });

  if (!quiet) {
    console.log(`Spellchecking ${filesFromGlobs.length} file${filesFromGlobs.length === 1 ? '' : 's'}...`);
  }

  const checkSpelling = filePath => spellchecker.checkSpelling(filePath);
  const vfiles = await Promise.all(filesFromGlobs.map(checkSpelling));

  const results = report(vfiles, { quiet });
  if (results.length > 0) {
    if (!quiet) {
      console.log();
    }
    console.log(results);
  }

  if (reports.length > 0) {
    generateReports(reports, vfiles);
  }

  if (hasMessages(vfiles)) {
    if (generateDictionary && hasMessages(vfiles, message => message.source === 'retext-spell')) {
      await fs.writeFile('dictionary.txt', toDictionary(vfiles));
      console.log('Personal dictionary written to dictionary.txt.');
    }

    process.exit(1);
  }
})().catch((error) => {
  printError(error);
  process.exit(1);
});
