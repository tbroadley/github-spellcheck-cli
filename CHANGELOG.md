# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [7.1.5] - 2023-01-08
### Changed
- Updated README.md to clarify that the package doesn't currently work on Linux, and to suggest `npm install --location=global` as well as `--global` ([@Syed-Naufal-Mahmood](https://github.com/Syed-Naufal-Mahmood)).

### Fixed
- Upgraded json5 to fix a security issue.

## [7.1.4] - 2022-05-28
### Fixed
- Fixed an Octokit deprecation warning.

## [7.1.3] - 2022-05-28
### Fixed
- Upgraded packages due to security vulnerabilities.

## [7.1.2] - 2019-10-21
### Changed
- Upgraded to latest version of `@octokit/rest` due to deprecation warnings for the fork functionality [@smittey](https://github.com/smittey).

## [7.1.1] - 2018-10-19
### Fixed
- Attempt to connect to repository count is now accurate to the last retry [@adelsmee](https://github.com/adelsmee).

## [7.1.0] - 2018-07-04
### Added
- [Delete a newly-created fork](https://github.com/tbroadley/github-spellcheck-cli/pull/84) if a PR is not created or the changes are not pushed to the target repository, by [@madhavarshney](https://github.com/madhavarshney).
- Option to [disable automatic PR creation](https://github.com/tbroadley/github-spellcheck-cli/pull/83) by [@madhavarshney](https://github.com/madhavarshney).

## [7.0.0] - 2018-06-20
### Added
- Print the number of spelling mistakes left in the current file and the number of remaining files.

### Changed
- Fetch only the base branch for the PR instead of all branches in the repo.

### Fixed
- Increase the `stdout` buffer size when running Git commands to make sure that `git ls-files` doesn't overflow it when run on large repositories.
- Fix a bug where `github-spellcheck` crashes if the directory `~/.github-spellcheck` doesn't exist.
- Fix a bug where interrupting the program using Ctrl-C after the creation of a PR would still delete newly-created repos.
- Quit immediately after opening the PR in a browser on Mac OS.

## [6.0.0] - 2018-05-26
### Added
- Delete a newly-created fork on Ctrl-C interrupt.
- Allow specifying just the token on the command line. If you run `github-spellcheck -t TOKEN`, the token will be saved and the program will exit.
- When accepting or rejecting corrections, display the number of remaining instances of the current misspelling.

### Changed
- Shallow clone repositories to spellcheck.
- Print a newline at the end of the `.env` file.
- Determine whether the user has access to the given repo much more efficiently.
- Remove language mentioning temporary directories.

### Fixed
- Store GitHub API credentials in `~/.github-spellcheck`, instead of in whatever directory the tool is run in.

## [5.0.0] - 2018-05-23
### Changed
- Remove Nodegit dependency.
- Default to the given repo's default branch as the branch to base changes off of, instead of always using `master`.

## [4.1.0] - 2018-05-23
### Added
- Documentation spellchecking in CI via [Spellchecker CLI](https://github.com/tbroadley/spellchecker-cli).

### Changed
- Always fork the given repo, since the GitHub API will return the existing fork if one has already been created.
- Use Git commands instead of Nodegit.

### Fixed
- Use a synchronous spellchecking method instead of an asynchronous one, to avoid spurious spelling mistakes returned by the asynchronous one.

## [4.0.0] - 2017-12-23
### Added
- A progress bar for the automated spellchecking step.
- Spellchecking for links to anchors within the document (like [this link](#unreleased)).
- Ignore words in PascalCase, camelCase, and snake_case.
- Ignore words that contain a period if the last section of the word when split on periods isn't in the dictionary.
- Ignore words containing a pound symbol (`#`). This will ignore words like `Component#render`.

### Changed
- The text that is displayed when there is no suggestion for a mistake.
- When a file has no changes, print `No changes` instead of printing the entire file twice.

### Removed
- The `i` (ignore) command. You can still permanently whitelist a word with `w` or ignore it once with `n`.

## [3.0.3] - 2017-12-22
### Fixed
- Create a local branch corresponding to the original repo's base branch if such a branch doesn't already exist. This fixes an issue where, if the specified base branch wasn't the parent repository's default branch, the tool would fail.

## [3.0.2] - 2017-12-21
### Fixed
- Stop decoding HTML entities because doing so throws off the indices of spelling mistakes.

## [3.0.1] - 2017-12-21
### Added
- Descriptions of correction commands to README.md.

## [3.0.0] - 2017-12-20
### Added
- Now ignores code between `<code>` HTML tags.
- Now ignores GitHub usernames, e.g. `@tbroadley`.
- Now ignores Markdown image and URL references.

### Changed
- Decode HTML entities before spellchecking.
- Do an in-order traversal of the target repo's directory structure, instead of a level-order traversal (a.k.a. breadth-first search).

## [2.0.1] - 2017-12-19
### Changed
- Demo GIF in README.md. Bumped version so that NPM would update its link to the GIF.

## [2.0.0] - 2017-12-19
### Added
- All HTML tags, attributes, and entities to the blacklist.
- Now ignores link and image references as well as URLs.
- Now ignores Github emoji names :star: :+1:
- The repository URL can now be any URL that refers to something within the repository, e.g. `/blob/master/README.md` or `/pulls`.
- A count of misspellings left to correct.

### Changed
- Merge the latest from the source repository's base branch before checking for spelling mistakes.
- Store local clones and whitelist in `~/.github-spellcheck`.
- Search for contribution guidelines according to [GitHub's instructions](https://help.github.com/articles/setting-guidelines-for-repository-contributors/).
- If the target repository has a `PULL_REQUEST_TEMPLATE` file, open a PR creation page in the browser instead of automatically creating a PR.
- Generated commits now have messages that are pluralized according to the number of changes made and that comply with [Conventional Commits 1.0.0-beta.1](https://conventionalcommits.org/spec/v1.0.0-beta.1.html).
- The spelling mistake editing prompt now only accepts the exact single-letter command (e.g. `y` but not `yes`).
- The names of the columns in the spelling mistake editing prompt's help message.
- Colours for highlighting and deleting changed words.
- Diffs with spacing changes are highlighted correctly. For example, if "worldrecord" is replaced with "world record", the space inside "world record" will be highlighted as added, instead of the space after it.
- Create a pull request against the parent repository instead of the source. This only changes the tool's behaviour when the target repo is itself a fork. The PR will now be made against the target repo, rather than against the target repo's parent/grandparent/...

### Removed
- Local clone deletion when a new fork is deleted.
- Pushing the merged base branch to the fork.

## [1.1.4] - 2017-12-16
### Fixed
- Create PR against specified base branch instead of always creating it against `master`.

## [1.1.3] - 2017-12-16
### Changed
- Move bugfixes under Fixed headers in this document.

### Fixed
- Now checks if the temporary directory actually contains a Git repository before trying to interact with it.
- Handle case where a word is replaced with itself.

## [1.1.2] - 2017-12-16
### Added
- A test for `getMisspellings`.
- Exponential backoff while trying to clone the repository.

### Removed
- One-second gap between forking and cloning the fork.

## [1.1.1] - 2017-12-15
### Added
- Demo GIF in README.md.
- One-second gap between forking and cloning the fork.

### Changed
- Names of tests for `getMisspellings` and `formatPrompt`.

## [1.1.0] - 2017-12-15
### Added
- Quiet mode.

## [1.0.6] - 2017-12-14
### Fixed
- Typo in README.md.

## [1.0.5] - 2017-12-14
### Added
- Tests for the `formatPrompt` method.

### Changed
- Refactored code to remove `continue` statements.
- Moved call to `formatDiffs` into `addByUserSelection`.

## [1.0.4] - 2017-12-14
### Added
- MIT License.

## [1.0.3] - 2017-12-14
### Added
- Automatic deploys to the NPM registry from Travis.

## [1.0.2] - 2017-12-14
### Fixed
- Fixed a bug where the temporary directory into which the repository would be cloned was being created relative to the current working directory.

## [1.0.1] - 2017-12-14
### Added
- NPM status badge in README.

### Changed
- Location of status badges in README.

## 1.0.0 - 2017-12-14
### Added
- The core Github Spellcheck functionality. Hurray!

[Unreleased]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.5...HEAD
[7.1.5]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.4...v7.1.5
[7.1.4]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.3...v7.1.4
[7.1.3]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.2...v7.1.3
[7.1.2]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.1...v7.1.2
[7.1.1]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.1.0...v7.1.1
[7.1.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v7.0.0...v7.1.0
[7.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v6.0.0...v7.0.0
[6.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v5.0.0...v6.0.0
[5.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v4.1.0...v5.0.0
[4.1.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v3.0.3...v4.0.0
[3.0.3]: https://github.com/tbroadley/github-spellcheck-cli/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/tbroadley/github-spellcheck-cli/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/tbroadley/github-spellcheck-cli/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v2.0.1...v3.0.0
[2.0.1]: https://github.com/tbroadley/github-spellcheck-cli/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.1.4...v2.0.0
[1.1.4]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/tbroadley/github-spellcheck-cli/compare/v1.0.0...v1.0.1
