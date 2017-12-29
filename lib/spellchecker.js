const promisify = require('es6-promisify');
const fs = require('fs-extra');
const path = require('path');
const remark = require('remark');
const gemoji = require('remark-gemoji-to-emoji');
const remarkRetext = require('remark-retext');
const retext = require('retext');
const spell = require('retext-spell');
const vfile = require('vfile');

function isMarkdownFile(filePath) {
  return ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
}

class Spellchecker {
  constructor({ language, personalDictionary }) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const dictionary = require(`dictionary-${language.toLowerCase()}`);
    this.spellchecker = retext().use(spell, {
      dictionary,
      personal: personalDictionary,
    });
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
    return promisify(spellcheckerForFileType.process)(file);
  }
}

exports.Spellchecker = Spellchecker;
