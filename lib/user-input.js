const chalk = require('chalk');
const _ = require('lodash');
const prompt = require('prompt-promise');

function promptWithColour(promptText) {
  return prompt(chalk.blue(promptText));
}

exports.prompt = promptWithColour;

function getColumnWidth(header, commands, columnFunction) {
  return _(commands).map(columnFunction).concat([header]).map(_.size)
    .max();
}

const HELP_COMMAND = {
  command: 'h',
  meaning: 'help',
  description: 'Print this usage guide.',
};

function formatRow(cells, widths, padding) {
  return _(cells)
    .map((cell, index) => _.padEnd(cell, widths[index]))
    .join(_.repeat(' ', padding));
}

function printHelp(commands) {
  const COLUMN_HEADERS = [
    'Command',
    'Meaning',
    'Description',
  ];
  const COLUMN_FUNCTIONS = [
    'command',
    'meaning',
    'description',
  ];
  const COLUMN_PADDING = 3;

  const columnWidths = _.map(
    COLUMN_HEADERS,
    (header, index) => getColumnWidth(header, commands, COLUMN_FUNCTIONS[index])
  );

  console.log(formatRow(COLUMN_HEADERS, columnWidths, COLUMN_PADDING));

  _(commands).concat([HELP_COMMAND]).forEach((command) => {
    console.log(formatRow(_.map(COLUMN_FUNCTIONS, colFun => (typeof colFun === 'string' ? command[colFun] : colFun(command))), columnWidths, COLUMN_PADDING));
  });
}

function formatPrompt(promptText, commands = []) {
  return [
    promptText,
    `${_(commands).concat([HELP_COMMAND]).map('command').join(', ')}: `,
  ].join(' ');
}

exports.formatPrompt = formatPrompt;

exports.respondToUserInput = async (promptText, commands) => {
  const fullPromptText = formatPrompt(promptText, commands);
  let invalidResponse = true;
  while (invalidResponse) {
    // eslint-disable-next-line no-await-in-loop
    const response = await promptWithColour(fullPromptText);
    const matchingCommand = _.find(commands, { command: _.trim(response) });
    if (matchingCommand) {
      invalidResponse = false;
      // eslint-disable-next-line no-await-in-loop
      await matchingCommand.responseFunction();
    } else {
      printHelp(commands);
    }
  }
};
