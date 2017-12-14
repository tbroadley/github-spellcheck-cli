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
  const wordsToSkip = [];
  let whitelistedWords = await readWhitelistFile();
  const filesToSkip = [];
  for (let index = 0; index < misspellings.length; index += 1) {
    const misspelling = misspellings[index];

    if (_.includes(_.concat(wordsToSkip, whitelistedWords), misspelling.misspelling) || _.includes(filesToSkip, misspelling.path)) {
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
      'Apply this correction? y(es), n(o), r(emove duplicate word), i(gnore word), w(hitelist word), e(dit), s(kip file): ',
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
          regex: /^r(emove duplicate word)?$/,
          responseFunction: async () => {
            const change = _.merge({}, misspelling, {
              index: {
                start: misspelling.index.start - 1,
              },
              misspelling: ` ${misspelling.misspelling}`,
              suggestions: [''],
            });
            changes.push(change);
            await updateFile(applySpellingCorrection(change, currentFileContents));
          },
        },
        {
          regex: /^i(gnore word)?$/,
          responseFunction: () => wordsToSkip.push(misspelling.misspelling),
        },
        {
          regex: /^w(hitelist word)?$/,
          responseFunction: async () => {
            await addToWhitelist(misspelling.misspelling);
            whitelistedWords.push(misspelling.misspelling);
          },
        },
        {
          regex: /^e(dit)?$/,
          responseFunction: async () => {
            const response = await prompt(`Replace "${misspelling.misspelling}" with: `);
            const change = _.assign({}, misspelling, { suggestions: [response] });
            changes.push(change);
            await updateFile(applySpellingCorrection(change, currentFileContents));
          },
        },
        {
          regex: /^s(kip file)?$/,
          responseFunction: () => filesToSkip.push(misspelling.path),
        },
      ]
    );
  }

  return changes.length;
};
