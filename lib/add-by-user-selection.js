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

function applySpellingCorrection({ index: { start, end }, suggestions }, document) {
  return [
    document.slice(0, start),
    suggestions.length > 0 ? suggestions[0] : '[no suggestion found]',
    document.slice(end),
  ].join('');
}

const WHITELIST_PATH = path.join(__dirname, '../tmp/whitelist.txt');

async function readWhitelistFile() {
  await fs.ensureFile(WHITELIST_PATH);
  const whitelistFileContents = (await fs.readFile(WHITELIST_PATH, 'utf8')).replace(/\r\n/g, '\n');
  return _.initial(_.split(whitelistFileContents, '\n'));
}

async function addToWhitelist(word) {
  await fs.writeFile(WHITELIST_PATH, `${word}\n`, { flag: 'a' });
}

exports.addByUserSelection = async (misspellings, repo) => {
  const changes = [];
  const diffs = [];
  const wordsToSkip = [];
  const whitelistedWords = await readWhitelistFile();
  const filesToSkip = [];
  for (let index = 0; index < misspellings.length; index += 1) {
    const misspelling = misspellings[index];

    if (_.includes(_.concat(wordsToSkip, whitelistedWords), misspelling.misspelling) ||
        _.includes(filesToSkip, misspelling.path)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const relativePath = misspelling.path;
    // eslint-disable-next-line no-await-in-loop
    const currentFileContents = await readFileToCorrect(misspelling.path, repo);
    const updatedFileContents = applySpellingCorrection(misspelling, currentFileContents);
    const wordDiff = generateWordDiff(currentFileContents, updatedFileContents);

    const updateFile = async (fileContents) => {
      await fs.writeFile(getAbsolutePath(misspelling.path, repo), fileContents);
      const addLengthDifference = n => n + (fileContents.length - currentFileContents.length);
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

    const commands = [
      {
        command: 'yes',
        description: 'Include this correction in the pull request.',
        responseFunction: async () => {
          changes.push(misspelling);
          diffs.push({
            path: relativePath,
            diff: wordDiff,
          });
          await updateFile(updatedFileContents);
        },
      },
      {
        command: 'no',
        description: 'Do not include this correction in the pull request.',
        responseFunction: _.noop,
      },
      {
        command: 'delete repeated',
        description: 'Delete the word to be corrected and the space in front of it. For example, "the the" will become "the".',
        responseFunction: async () => {
          const change = _.merge({}, misspelling, {
            index: {
              start: misspelling.index.start - 1,
            },
            misspelling: ` ${misspelling.misspelling}`,
            suggestions: [''],
          });
          changes.push(change);

          const fileContents = applySpellingCorrection(change, currentFileContents);
          diffs.push({
            path: relativePath,
            diff: generateWordDiff(currentFileContents, fileContents),
          });
          await updateFile(fileContents);
        },
      },
      {
        command: 'ignore',
        description: 'Ignore the word to be corrected for the rest of the session.',
        responseFunction: () => wordsToSkip.push(misspelling.misspelling),
      },
      {
        command: 'whitelist',
        description: 'Permanently whitelist the word to be corrected.',
        responseFunction: async () => {
          await addToWhitelist(misspelling.misspelling);
          whitelistedWords.push(misspelling.misspelling);
        },
      },
      {
        command: 'edit',
        description: 'Replace the word to be corrected with a specified word.',
        responseFunction: async () => {
          const response = await prompt(`Replace "${misspelling.misspelling}" with: `);
          const change = _.assign({}, misspelling, { suggestions: [response] });
          changes.push(change);

          const fileContents = applySpellingCorrection(change, currentFileContents);
          diffs.push({
            path: relativePath,
            diff: generateWordDiff(currentFileContents, fileContents),
          });
          await updateFile(fileContents);
        },
      },
      {
        command: 'skip file',
        description: 'Do not include this correction on any other corrections in this file.',
        responseFunction: () => filesToSkip.push(misspelling.path),
      },
    ];

    // eslint-disable-next-line no-await-in-loop
    await respondToUserInput('Apply this correction?', commands);
  }

  return {
    changeCount: changes.length,
    diffs,
  };
};
