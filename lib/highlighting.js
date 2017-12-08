const chalk = require('chalk');
const _ = require('lodash');

exports.highlightDiff = diff => {
  return diff
    .replace(/^\+(?!\+\+ ).*$/gm, chalk.green('$&'))
    .replace(/^-(?!-- ).*$/gm, chalk.red('$&'));
};
