const chalk = require('chalk');
const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const userHome = require('user-home');

const { formatDiffs, generateWordDiff } = require('./diff');
const { prompt, respondToUserInput } = require('./user-input');

function getAbsolutePath(relativePath, repo) {
  return path.join(repo.workdir(), relativePath);
}

async function readFileToCorrect(relativePath, repo) {
  const contents = await fs.readFile(getAbsolutePath(relativePath, repo), { encoding: 'utf8' });
  return contents.replace(/\r\n/g, '\n');
}

function applySpellingCorrection({ index: { start, end }, suggestions }, document) {
  return [
    document.slice(0, start),
    suggestions.length > 0 ? suggestions[0] : 'NO SUGGESTIONS',
    document.slice(end),
  ].join('');
}

const WHITELIST_PATH = path.join(userHome, '/.github-spellcheck/whitelist.txt');

async function readWhitelistFile() {
  await fs.ensureFile(WHITELIST_PATH);
  const whitelistFileContents = (await fs.readFile(WHITELIST_PATH, 'utf8')).replace(/\r\n/g, '\n');
  return _.initial(_.split(whitelistFileContents, '\n'));
}

async function addToWhitelist(word) {
  await fs.writeFile(WHITELIST_PATH, `${word}\n`, { flag: 'a' });
}

function skipWord(misspelling, filePath, whitelistedWords, filesToSkip) {
  return _.includes(whitelistedWords, misspelling) ||
         _.includes(filesToSkip, filePath);
}

function countRemaining(misspellings, index, whitelistedWords, filesToSkip) {
  return _.reject(misspellings.slice(index), (misspellingObject) => {
    const { misspelling, path: filePath } = misspellingObject;
    return skipWord(misspelling, filePath, whitelistedWords, filesToSkip);
  }).length;
}

exports.addByUserSelection = async (misspellings, repo) => {
  const changes = [];
  const diffs = [];
  const whitelistedWords = await readWhitelistFile();
  const filesToSkip = [];
  for (let index = 0; index < misspellings.length; index += 1) {
    const misspellingObject = misspellings[index];
    const { misspelling, path: filePath } = misspellingObject;

    if (!skipWord(misspelling, filePath, whitelistedWords, filesToSkip)) {
      // eslint-disable-next-line no-await-in-loop
      const currentFileContents = await readFileToCorrect(filePath, repo);
      const updatedFileContents = applySpellingCorrection(misspellingObject, currentFileContents);
      const wordDiff = generateWordDiff(currentFileContents, updatedFileContents);

      const updateFile = async (fileContents) => {
        await fs.writeFile(getAbsolutePath(filePath, repo), fileContents);
        const addLengthDifference = n => n + (fileContents.length - currentFileContents.length);
        for (let update = index + 1; update < misspellings.length; update += 1) {
          if (misspellings[update].path === filePath) {
            _.update(misspellings[update], 'index.start', addLengthDifference);
            _.update(misspellings[update], 'index.end', addLengthDifference);
          }
        }
      };

      console.log();
      console.log(filePath);
      console.log();
      console.log(wordDiff);
      console.log();

      const remaining = countRemaining(
        misspellings,
        index,
        whitelistedWords,
        filesToSkip
      );
      console.log(chalk.yellow(`${remaining} spelling mistake${remaining === 1 ? '' : 's'} left.`));

      const commands = [
        {
          command: 'y',
          meaning: 'yes',
          description: 'Include this correction in the pull request.',
          responseFunction: async () => {
            changes.push(misspellingObject);
            diffs.push({
              path: filePath,
              diff: wordDiff,
            });
            await updateFile(updatedFileContents);
          },
        },
        {
          command: 'n',
          meaning: 'no',
          description: 'Do not include this correction in the pull request.',
          responseFunction: _.noop,
        },
        {
          command: 'd',
          meaning: 'delete repeated',
          description: 'Delete the word to be corrected and the space in front of it. For example, "the the" will become "the".',
          responseFunction: async () => {
            const change = _.merge({}, misspellingObject, {
              index: {
                start: misspellingObject.index.start - 1,
              },
              misspelling: ` ${misspelling}`,
              suggestions: [''],
            });
            changes.push(change);

            const fileContents = applySpellingCorrection(change, currentFileContents);
            diffs.push({
              path: filePath,
              diff: generateWordDiff(currentFileContents, fileContents),
            });
            await updateFile(fileContents);
          },
        },
        {
          command: 'w',
          meaning: 'whitelist',
          description: 'Permanently whitelist the word to be corrected.',
          responseFunction: async () => {
            await addToWhitelist(misspelling);
            whitelistedWords.push(misspelling);
          },
        },
        {
          command: 'e',
          meaning: 'edit',
          description: 'Replace the word to be corrected with a specified word.',
          responseFunction: async () => {
            const response = await prompt(`Replace "${misspelling}" with: `);
            const change = _.assign({}, misspellingObject, { suggestions: [response] });
            changes.push(change);

            const fileContents = applySpellingCorrection(change, currentFileContents);
            diffs.push({
              path: filePath,
              diff: generateWordDiff(currentFileContents, fileContents),
            });
            await updateFile(fileContents);
          },
        },
        {
          command: 's',
          meaning: 'skip file',
          description: 'Do not include this correction on any other corrections in this file.',
          responseFunction: () => filesToSkip.push(filePath),
        },
      ];

      // eslint-disable-next-line no-await-in-loop
      await respondToUserInput('Apply this correction?', commands);
    }
  }

  return {
    changeCount: changes.length,
    finalDiff: formatDiffs(diffs),
  };
};
