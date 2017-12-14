const chalk = require('chalk');
const _ = require('lodash');
const prompt = require('prompt-promise');

async function promptWithColour(promptText) {
  return prompt(chalk.blue(promptText));
}

exports.prompt = promptWithColour;

exports.respondToUserInput = async (promptText, responses) => {
  let invalidResponse = true;
  while (invalidResponse) {
    const response = await promptWithColour(promptText);

    for (let index = 0; index < responses.length; index += 1) {
      const { regex, responseFunction, promptAgain } = responses[index];
      if (regex.test(response)) {
        invalidResponse = promptAgain;
        await responseFunction();
        break;
      }
    }
  }
};
