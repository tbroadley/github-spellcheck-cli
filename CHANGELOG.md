# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2017-12-28

### Added

- Add a large number of unit and end-to-end tests.
- Add development instructions to [README.md](./README.md).
- Add support for the following [retext](https://github.com/retextjs/retext) plugins:
  - [`retext-indefinite-article`](https://github.com/retextjs/retext-indefinite-article)
  - [`retext-repeated-words`](https://github.com/retextjs/retext-repeated-words)
  - [`retext-syntax-mentions`](https://github.com/retextjs/retext-syntax-mentions)
  - [`retext-syntax-urls`](https://github.com/retextjs/retext-syntax-urls)

### Changed

- Skip checking the personal dictionary (if one is provided).

## [1.0.1] - 2017-12-28

### Fixed

- Added a shebang to [index.js](./index.js).

[Unreleased]: https://github.com/tbroadley/spellchecker-cli/compare/v2.0.0...HEAD
[2.0.0]:      https://github.com/tbroadley/spellchecker-cli/compare/v1.0.1...v2.0.0
[1.0.1]:      https://github.com/tbroadley/spellchecker-cli/compare/v1.0.0...v1.0.1
