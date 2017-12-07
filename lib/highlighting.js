const chalk = require('chalk');
const _ = require('lodash');

exports.highlightDiff = diff => {
  return diff
    .replace(/^\+(?!\+\+ ).*$/gm, chalk.green('$&'))
    // .replace(chalk.green(`+++ ${relativePath}`), `+++ ${relativePath}`)
    .replace(/^-(?!-- ).*$/gm, chalk.red('$&'))
    // .replace(chalk.red(`--- ${relativePath}`), `--- ${relativePath}`)
};
