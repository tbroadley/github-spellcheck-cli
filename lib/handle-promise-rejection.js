const chalk = require('chalk');

exports.h = async promise => {
  let result;
  try {
    result = await promise;
  } catch (error) {
    console.error(chalk.red(error));
    process.exit(1);
  }
  return result;
};
