const fs = require('fs-extra');
const remark = require('remark');
const gemoji = require('remark-gemoji-to-emoji');
const remarkRetext = require('remark-retext');
const retext = require('retext');
const spell = require('retext-spell');
const vfile = require('vfile');

const { isMarkdownFile } = require('./is-markdown-file');

function buildSpellchecker({ dictionary, personalDictionary, plugins }) {
  const spellchecker = retext();

  if (plugins.includes('spell')) {
    spellchecker.use(spell, {
      dictionary,
      personal: personalDictionary,
    });
  }

  return spellchecker;
}

class Spellchecker {
  constructor({ language, personalDictionary, plugins }) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const dictionary = require(`dictionary-${language.toLowerCase()}`);
    this.spellchecker = buildSpellchecker({ dictionary, personalDictionary, plugins });
    this.markdownSpellchecker = remark().use(gemoji).use(remarkRetext, this.spellchecker);
  }

  async checkSpelling(filePath) {
    const spellcheckerForFileType = isMarkdownFile(filePath) ?
      this.markdownSpellchecker :
      this.spellchecker;

    const contents = await fs.readFile(filePath);
    const file = vfile({
      contents,
      path: filePath,
    });
    return spellcheckerForFileType.process(file);
  }
}

exports.Spellchecker = Spellchecker;
