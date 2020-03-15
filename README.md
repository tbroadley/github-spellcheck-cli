# Spellchecker CLI

A command-line tool for spellchecking files, built on top of [`retext`](https://github.com/retextjs/retext) and [`remark`](https://github.com/remarkjs/remark).

[![Build Status](https://travis-ci.org/tbroadley/spellchecker-cli.svg?branch=master)](https://travis-ci.org/tbroadley/spellchecker-cli)
[![npm](https://img.shields.io/npm/v/spellchecker-cli.svg)](https://www.npmjs.com/package/spellchecker-cli)

## Use Case

You can help contributors to your open-source software project catch spelling mistakes in documentation by running Spellchecker CLI as a pre-commit or pre-push Git hook or as part of your continuous integration process.

## Features

- Run on any plain text file, with special handling for Markdown syntax
- Check for spelling mistakes, repeated words, and/or correct usage of "a" and "and"
- Check spelling using an American, British, Canadian, Australian, or South African English dictionary
- Specify a custom dictionary of project-specific terms to be combined with the dictionary for the specified language
- Generate the custom dictionary automatically based on misspellings found in the checked files

## Installation

If you want to use Spellchecker CLI as a command-line tool on your own computer, you can install it globally:

```
$ npm install --global spellchecker-cli
```

If you want to run Spellchecker CLI in a Git hook or in a CI environment, it's better to add it as a development dependency of your application:

```
$ npm install --save-dev spellchecker-cli
```

## Usage

Run Spellchecker CLI using the command `spellchecker`. This command takes the following options:

```
-f, --files <file|glob> <file|glob>...   A list of files or globs to spellcheck.
-l, --language <language>                The language of the files. The default language is en-US. The following
                                         languages are supported: en-AU, en-CA, en-GB, en-US, en-ZA.
-d, --dictionaries <file> <file>...      Files to combine into a personal dictionary.
--generate-dictionary                    Write a personal dictionary that contains all found misspellings to
                                         dictionary.txt.
-i, --ignore <regex> <regex>...          Spelling mistakes that match any of these regexes (after being wrapped with ^
                                         and $) will be ignored.
-p, --plugins <name> <name>...           A list of retext plugins to use. The default is "spell indefinite-article
                                         repeated-words syntax-mentions syntax-urls". The following plugins are
                                         supported: spell, indefinite-article, repeated-words, syntax-mentions,
                                         syntax-urls, frontmatter.
--no-suggestions                         Do not print suggested replacements for misspelled words. This option will
                                         improve Spellchecker's runtime when many errors are detected.
-q, --quiet                              Do not output anything for files that contain no spelling mistakes.
--frontmatter-keys <key> <key>...        A list of frontmatter keys whose values should be spellchecked. By default,
                                         no values are spellchecked. Only valid when the `frontmatter` plugin is used.
--reports <file> <file>...               A list of report files to generate. The type of report is based on the
                                         extension of the file. (Supported: .junit.xml and .json)
-h, --help                               Print this help screen.
```

If you've installed Spellchecker CLI globally, you can simply run `spellchecker` to invoke the tool. If you used the `--save-dev` flag, run `./node_modules/.bin/spellchecker` from the root directory of your project (or just `spellchecker` inside an NPM script).

### Globs

Spellchecker CLI uses [`globby`](https://github.com/sindresorhus/globby), which is based on [`glob`](https://github.com/isaacs/node-glob), to parse globs. The tool passes the provided list of globs directly to `globby`. This means that you can, for instance, use `!` to negate a glob:

```
$ spellchecker --files '**/*.md' '!test/**/*.md' 'test/README.md'
```

See [the `node-glob` documentation](https://github.com/isaacs/node-glob#glob-primer) for a full description of glob syntax.

### Plugins

The following `retext` plugins are supported:

- [`retext-spell`](https://github.com/retextjs/retext-spell): check spelling
- [`retext-indefinite-article`](https://github.com/retextjs/retext-indefinite-article): check that "a" and "an" are used correctly
- [`retext-repeated-words`](https://github.com/retextjs/retext-repeated-words): check `for for` repeated words
- [`retext-syntax-mentions`](https://github.com/retextjs/retext-syntax-mentions): ignore GitHub mentions (_e.g._ @tbroadley) when spellchecking
- [`retext-syntax-urls`](https://github.com/retextjs/retext-syntax-urls): ignore URL-like values (_e.g._ `README.md`, `https://example.com`) when spellchecking

The following `remark` plugins are supported:

- [`remark-frontmatter`](https://github.com/remarkjs/remark-frontmatter): parse frontmatter for spellchecking (see [Frontmatter](#frontmatter))

When using the `--plugins` command-line option, make sure to remove `retext-` or `remark-` from the beginning of the plugin name. For example, to use only `retext-spell` and `retext-indefinite-article`, run:

```
$ spellchecker --files <glob> --plugins spell indefinite-article
```

### Personal dictionaries

Each line in a personal dictionary is treated as a regular expression. You could use this feature to ignore spelling mistakes with a common form but too many possible instances to be included in a personal dictionary. For instance, you could use the regular expression `[0-9a-f]{7}` to match Git short SHAs.

Each regex will be wrapped with `^` and `$` before mistakes are tested against it. For example, if "ize" is included in the dictionary, "optimize" and other words that contain "ize" will not be ignored. To match "optimize", you could use the regular expression `[A-Za-z]+ize`.

A personal dictionary should either be a plaintext file or a JavaScript file with the extension `.js` that exports an array of strings or regular expressions. For example, the following is a valid dictionary file:

```js
// dictionary.js
module.exports = ['foo', /^bazz?/];
```

### Generating a personal dictionary

This option is useful for adding Spellchecker CLI to an existing open-source software project with a lot of documentation. Instead of fixing every spelling mistake in one pull request, contributors can gradually remove misspellings from the generated dictionary. It's also helpful to be able to generate a personal dictionary then remove the actual misspellings from the dictionary, leaving behind only project-specific terms.

### Ignore regexes

You could use this feature to ignore spelling mistakes with a common form but too many possible instances to be included in a personal dictionary. For instance, you could use the regular expression `[0-9a-f]{7}` to match Git short SHAs.

Each regex will be wrapped with `^` and `$` before mistakes are tested against it. For example, suppose you invoke Spellchecker CLI as follows:

```
spellchecker --files README.md --ignore "ize"
```

In this case, only the literal word "ize" will be ignored, not words that contain it, like "optimize". To match optimize, you could use the regular expression `[A-Za-z]+ize`.

## Markdown

Spellchecker CLI performs some preprocessing on Markdown files (_i.e._ files with the extension `.md` or `.markdown`, ignoring capitalization):

- Ignores `inline code` and tables
- Transforms [Gemoji](https://github.com/wooorm/gemoji) into Unicode emoji, so that emoji names like `:octocat:` aren't spellchecked

### Frontmatter

Spellchecker CLI can parse Markdown frontmatter when the `frontmatter` plugin is used. The `--frontmatter-keys` option can be used to specify a list of top-level keys to extract from the frontmatter. Other top-level keys will be ignored. This is useful for spellchecking only certain parts of the frontmatter.

### Reports

Reports can be generated showing all the issues found in a way that can be read by automation tools or CI/CD systems.

For example, Jenkins and Gitlab CI/CD use JUnit reports, and this allows the creation of those reports, so that the output may be read in the User Interface of those tools. This allows for proper CI/CD integration before deploying static site documentation.

The report type is determined by how the file ends. If the extension ends with `.json` for example, then it will generate a JSON report.

List of Report types:

- JSON: ending in `.json`
- JUnit: ending in `junit.xml` (Note, the whole file name may be `junit.xml` as well)

## Development

Run `npm install` to install dependencies. Then, run `node index.js` to run Spellcheck CLI. You can also run `npm run spellchecker` to run Spellcheck CLI against its own documentation, `npm run lint` to lint the JavaScript source files, and `npm run test` to run the test suite.
