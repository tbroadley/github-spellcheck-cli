const chalk = require('chalk');
const _ = require('lodash');
const prompt = require('prompt-promise');

exports.respondToUserInput = async (promptText, responses) => {
  let invalidResponse = true;
  while (invalidResponse) {
    const response = await prompt(chalk.blue(promptText));

    for (let index = 0; index < responses.length; index += 1) {
      const { regex, responseFunction } = responses[index];
      if (regex.test(response)) {
        invalidResponse = false;
        await responseFunction();
        break;
      }
    }
  }
};
