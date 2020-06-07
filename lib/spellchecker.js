const fs = require('fs-extra');
const every = require('lodash/every');
const assign = require('lodash/assign');
const remark = require('remark');
const frontmatter = require('remark-frontmatter');
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
const { frontmatterFilter } = require('./frontmatter-filter');

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
      max: suggestions ? Infinity : -1,
    });
  }

  return spellchecker;
}

function buildMarkdownSpellchecker({
  plugins,
  spellchecker,
}) {
  const markdownSpellchecker = remark().use(gemoji);

  const frontmatterOptions = plugins.filter(({ frontmatter: fm }) => fm);
  if (frontmatterOptions.length > 0) {
    markdownSpellchecker
      .use(frontmatter, ['yaml', 'toml'])
      .use(frontmatterFilter, frontmatterOptions[0].frontmatter);
  }

  return markdownSpellchecker.use(remarkRetext, spellchecker);
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
    this.spellchecker = buildSpellchecker({ dictionary, suggestions, plugins });
    this.markdownSpellchecker = buildMarkdownSpellchecker({
      plugins,
      spellchecker: this.spellchecker,
    });
    this.ignoreRegexes = ignoreRegexes;
    this.personalDictionary = personalDictionary;
  }

  async checkSpelling(filePath) {
    const spellcheckerForFileType = isMarkdownFile(filePath)
      ? this.markdownSpellchecker
      : this.spellchecker;

    const excludeBlockRe = /(<!--\s*spellchecker-disable\s*-->([\S\s]*?)<!--\s*spellchecker-enable\s*-->)/ig;

    const contents = (await fs.readFile(filePath)).toString();
    const contentsWithoutExcludes = contents.replace(excludeBlockRe, '');
    const contentsWithoutVariationSelectors = contentsWithoutExcludes.replace(/[\uFE0E\uFE0F]/g, '');

    const file = vfile({
      contents: contentsWithoutVariationSelectors,
      path: filePath,
    });
    const result = await spellcheckerForFileType.process(file);
    return assign({}, result, {
      messages: result.messages.filter(({ actual }) => {
        const doesNotMatch = regex => !regex.test(actual);
        return every(this.ignoreRegexes, doesNotMatch)
          && every(this.personalDictionary, doesNotMatch);
      }),
    });
  }
}

exports.Spellchecker = Spellchecker;
