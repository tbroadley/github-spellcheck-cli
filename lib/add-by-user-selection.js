const chalk = require('chalk');
const { createPatch } = require('diff');
const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const prompt = require('prompt-promise');

function getAbsolutePath(relativePath, repo) {
  return path.join(repo.workdir(), relativePath);
}

async function readFileToCorrect(relativePath, repo) {
  const contents = await fs.readFile(getAbsolutePath(relativePath, repo), { encoding: 'utf8' });
  return contents.replace(/\r\n/g, '\n');
}

function applySpellingCorrection({ index: { start, end }, suggestions: [suggestion] }, document) {
  return [
    document.slice(0, start),
    suggestion,
    document.slice(end),
  ].join('');
}

exports.addByUserSelection = async (misspellings, repo) => {
  const wordsToSkip = [];
  for (let index = 0; index < misspellings.length; index += 1) {
    const misspelling = misspellings[index];

    if (_.includes(wordsToSkip, misspelling.misspelling)) {
      continue;
    }

    const relativePath = misspelling.path;
    const currentFileContents = await readFileToCorrect(misspelling.path, repo)
    const updatedFileContents = applySpellingCorrection(misspelling, currentFileContents);
    const patch = createPatch(relativePath, currentFileContents, updatedFileContents);

    console.log();
    console.log(patch);

    let invalidResponse = true;
    while (invalidResponse) {
      const response = await prompt(chalk.blue('Apply this correction? y(es), n(o), i(gnore word): '));

      switch (response) {
        case 'y':
        case 'yes':
          invalidResponse = false;
          await fs.writeFile(getAbsolutePath(misspelling.path, repo), updatedFileContents);
          for (let update = index + 1; update < misspellings.length; update += 1) {
            const addLengthDifference = n => n + updatedFileContents.length - currentFileContents.length;
            _.update(misspellings[update], 'index.start', addLengthDifference);
            _.update(misspellings[update], 'index.end', addLengthDifference);
          }
          break;
        case 'n':
        case 'no':
          invalidResponse = false;
          break;
        case 'i':
        case 'ignore word':
          invalidResponse = false;
          wordsToSkip.push(misspelling.misspelling);
          break;
      }
    }
  }
};
