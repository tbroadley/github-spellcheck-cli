# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased (3.0)]
### Added
- Now ignores code between `<code>` HTML tags.
- Now ignores GitHub usernames, e.g. `@tbroadley`.

## [Unreleased]

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

[Unreleased (3.0)]: https://github.com/tbroadley/github-spellcheck-cli/compare/HEAD...3.0
[Unreleased]: https://github.com/tbroadley/github-spellcheck-cli/compare/v2.0.0...HEAD
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
