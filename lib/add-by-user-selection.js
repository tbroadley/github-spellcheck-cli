const chalk = require('chalk');
const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');

const { generateWordDiff } = require('./diff');
const { prompt, respondToUserInput } = require('./user-input');

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
  const changes = [];
  const wordsToSkip = [];
  for (let index = 0; index < misspellings.length; index += 1) {
    const misspelling = misspellings[index];

    if (_.includes(wordsToSkip, misspelling.misspelling)) {
      continue;
    }

    const relativePath = misspelling.path;
    const currentFileContents = await readFileToCorrect(misspelling.path, repo);
    const updatedFileContents = applySpellingCorrection(misspelling, currentFileContents);
    const wordDiff = generateWordDiff(currentFileContents, updatedFileContents);

    const updateFile = async fileContents => {
      await fs.writeFile(getAbsolutePath(misspelling.path, repo), fileContents);
      const addLengthDifference = n => n + fileContents.length - currentFileContents.length;
      for (let update = index + 1; update < misspellings.length; update += 1) {
        if (misspellings[update].path === relativePath) {
          _.update(misspellings[update], 'index.start', addLengthDifference);
          _.update(misspellings[update], 'index.end', addLengthDifference);
        }
      }
    };

    console.log();
    console.log(relativePath);
    console.log();
    console.log(wordDiff);
    console.log();

    await respondToUserInput(
      'Apply this correction? y(es), n(o), i(gnore word), e(dit): ',
      [
        {
          regex: /^y(es)?$/,
          responseFunction: async () => {
            changes.push(misspelling);
            await updateFile(updatedFileContents);
          },
        },
        {
          regex: /^n(o)?$/,
          responseFunction: _.noop,
        },
        {
          regex: /^i(gnore word)?$/,
          responseFunction: () => wordsToSkip.push(misspelling.misspelling),
        },
        {
          regex: /^e(dit)?$/,
          responseFunction: async () => {
            const response = await prompt(`Replace "${misspelling.misspelling}" with: `);
            const change = _.assign({}, misspelling, { suggestions: [response] });
            changes.push(change);
            await updateFile(applySpellingCorrection(change, currentFileContents));
          }
        },
      ]
    );
  }

  return changes.length;
};
