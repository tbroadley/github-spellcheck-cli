# GitHub Spellcheck

[![Build Status](https://travis-ci.org/tbroadley/github-spellcheck-cli.svg?branch=master)](https://travis-ci.org/tbroadley/github-spellcheck-cli)

A tool for checking GitHub repositories for spelling errors and submitting PRs to fix them.

## Inspiration

When I'm looking through the documentation of an open-source software project, I sometimes notice a typo. When I do, I usually create a pull request to fix it. I wanted to streamline this process.

## Setup

You need to have Node.js and NPM installed.

```
$ npm install --global github-spellcheck-cli
```

## Usage

The command is `github-spellcheck`. It takes the following options:

```
-h, --help                                       Print this usage guide.
-t, --token <token>                              GitHub personal access token. You only need to provide the token when you
                                                 start using github-spellcheck, and again if you have a new token.
-r, --repository <username/repository or URL>    The repository to spellcheck.
--branch <branch name>                           The name of the branch to commit corrections to.
--base <branch name>                             The name of the branch to create the pull request against.
-e, --extensions <extension> [<extension>] ...   Only spellcheck files with these extensions for spelling mistakes.
--include <glob> ...                             Only spellcheck files that match at least one of these globs.
--exclude <glob> ...                             Do not spellcheck files that match one of these globs.
```

## Whitelist

The whitelist is stored at `/path/to/global/npm/packages/github-spellcheck-cli/tmp/whitelist.txt`.

## GitHub personal access token

Instructions for generating a personal access token are [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/). The token should have the `repo` and `delete_repo` scopes.

## Development

Clone this repository, then run `npm install`.

You can run `node index.js` to start the CLI or `npm test` to run the tests.

### Linting

Run `npm run lint` to run ESLint or `npm run lint:fix` to automatically fix problems.
