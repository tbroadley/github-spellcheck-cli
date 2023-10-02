# GitHub Spellcheck

A tool for checking GitHub repositories for spelling errors and submitting PRs to fix them.

Currently, **GitHub Spellcheck doesn't work on Linux** because of https://github.com/atom/node-spellchecker/issues/54. More information: https://github.com/tbroadley/github-spellcheck-cli/issues/90.

[![npm](https://img.shields.io/npm/v/github-spellcheck-cli.svg)](https://www.npmjs.com/package/github-spellcheck-cli)
[![Build Status](https://travis-ci.org/tbroadley/github-spellcheck-cli.svg?branch=master)](https://travis-ci.org/tbroadley/github-spellcheck-cli)

## Demo

![Github Spellcheck demo](https://raw.githubusercontent.com/tbroadley/github-spellcheck-cli/master/docs/demo.gif)

## Inspiration

When I'm looking through the documentation of an open-source software project, I sometimes notice a typo. When I do, I usually create a pull request to fix it. I wanted to streamline this process.

## Setup

You need to have Git, Node.js, and NPM installed.

```
$ npm install --global github-spellcheck-cli
```

Or:

```
$ npm install --location=global github-spellcheck-cli
```

## Usage

The command is `github-spellcheck`. It takes the following options:

```
-h, --help                                       Print this usage guide.
-t, --token <token>                              GitHub personal access token. You only need to provide the token when you
                                                 start using github-spellcheck, and again if you have a new token.
-r, --repository <username/repository or URL>    The repository to spellcheck.
--no-pr                                          Do not automatically create a pull request on the target repository.
--branch <branch name>                           The name of the branch to commit corrections to.
--base <branch name>                             The name of the branch to create the pull request against.
-e, --extensions <extension> [<extension>] ...   Only spellcheck files with these extensions for spelling mistakes.
--include <glob> ...                             Only spellcheck files that match at least one of these globs.
--exclude <glob> ...                             Do not spellcheck files that match one of these globs.
-q, --quiet                                      Do not open CONTRIBUTING.md or the new pull request in a browser.
```

## Applying corrections

The tool will search for potential spelling mistakes in the specified GitHub repository, then ask you what you want to do with each mistake. Here are the commands that the tool accepts:

```
Command   Meaning           Description
y         yes               Include this correction in the pull request.
n         no                Do not include this correction in the pull request.
d         delete repeated   Delete the word to be corrected and the space in front of it. For example, "the the" will become "the".
w         whitelist         Permanently whitelist the word to be corrected.
e         edit              Replace the word to be corrected with a specified word.
s         skip file         Do not include this correction on any other corrections in this file.
h         help              Print this usage guide.
```

**WARNING**: After you use this tool once for a repository, if you try and use it again for the same repoistory it will error at the end due to [Issue #108](https://github.com/tbroadley/github-spellcheck-cli/issues/108), and you will lose all the corrections you have made with no way to recover them. To deal with this, you need to delete the folder corresponding to the package in `~/.github-spellcheck/YourUsername`, as well as the branch associated with the created pull request as GitHub prompts you to do after it has been merged.

## Whitelist

The whitelist is stored at `~/.github-spellcheck/whitelist.txt`.

## GitHub personal access token

Instructions for generating a personal access token are [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/). The token should have the `repo` and `delete_repo` scopes.

After generating a personal access token, invoke the tool as follows:

```
$ github-spellcheck --token <token> --repository ...
```

It's only necessary to pass `--token <token>` to the tool once, or if you want to update the token. GitHub Spellcheck will store the token in a file and subsequent invocations will read the token from there.

## Development

Fork this repository, clone your fork, then run `npm install`.

You can run `node index.js` to start the CLI or `npm test` to run the tests.

### Linting

Run `npm run lint` to run ESLint or `npm run lint-fix` to automatically fix problems.
