const fs = require('fs-extra');
const assign = require('lodash/assign');
const every = require('lodash/every');
const remark = require('remark');
const gemoji = require('remark-gemoji-to-emoji');
const remarkRetext = require('remark-retext');
const retext = require('retext');
const indefiniteArticle = require('retext-indefinite-article');
const repeatedWords = require('retext-repeated-words');
const spell = require('retext-spell');
const syntaxMentions = require('retext-syntax-mentions');
const syntaxUrls = require('retext-syntax-urls');
const vfile = require('vfile');

const { isMarkdownFile } = require('./is-markdown-file');

function buildSpellchecker({
  dictionary,
  suggestions,
  plugins,
}) {
  const spellchecker = retext();

  if (plugins.includes('indefinite-article')) {
    spellchecker.use(indefiniteArticle);
  }

  if (plugins.includes('repeated-words')) {
    spellchecker.use(repeatedWords);
  }

  if (plugins.includes('syntax-mentions')) {
    spellchecker.use(syntaxMentions);
  }

  if (plugins.includes('syntax-urls')) {
    spellchecker.use(syntaxUrls);
  }

  if (plugins.includes('spell')) {
    spellchecker.use(spell, {
      dictionary,
    });
  }

  return spellchecker;
}

class Spellchecker {
  constructor({
    language,
    personalDictionary,
    ignoreRegexes,
    suggestions,
    plugins,
  }) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const dictionary = require(`dictionary-${language.toLowerCase()}`);
    this.spellchecker = buildSpellchecker({ dictionary, plugins });
    this.markdownSpellchecker = remark().use(gemoji).use(remarkRetext, this.spellchecker);
    this.personalDictionary = personalDictionary;
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
    const result = await spellcheckerForFileType.process(file);
    return assign({}, result, {
      messages: result.messages.filter(({ actual }) => {
        const doesNotMatch = regex => !regex.test(actual);
        every(this.ignoreRegexes, doesNotMatch);
        return every(this.personalDictionary, doesNotMatch);
      }),
    });
  }
}

exports.Spellchecker = Spellchecker;
