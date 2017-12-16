const chalk = require('chalk');
const _ = require('lodash');
const prompt = require('prompt-promise');

async function promptWithColour(promptText) {
  return prompt(chalk.blue(promptText));
}

exports.prompt = promptWithColour;

function getColumnWidth(header, commands, columnFunction) {
  return _(commands).map(columnFunction).concat([header]).map(_.size)
    .max();
}

const HELP_COMMAND = {
  command: 'help',
  description: 'Print this usage guide.',
};

function formatRow(cells, widths, padding) {
  return _(cells)
    .map((cell, index) => _.padEnd(cell, widths[index]))
    .join(_.repeat(' ', padding));
}

function printHelp(commands) {
  const COLUMN_HEADERS = [
    'Abbreviation',
    'Command',
    'Description',
  ];
  const COLUMN_FUNCTIONS = [
    ({ command }) => command.slice(0, 1),
    'command',
    'description',
  ];
  const COLUMN_PADDING = 3;

  const columnWidths = _.map(
    COLUMN_HEADERS,
    (header, index) => getColumnWidth(header, commands, COLUMN_FUNCTIONS[index])
  );

  const { command: exampleCommand } = _.first(commands);
  console.log('Any prefix of a command will match that command. ' +
              `For example, "${exampleCommand.slice(0, 1)}" will match "${exampleCommand}".`);
  console.log();

  console.log(formatRow(COLUMN_HEADERS, columnWidths, COLUMN_PADDING));

  _(commands).concat([HELP_COMMAND]).forEach((command) => {
    console.log(formatRow(_.map(COLUMN_FUNCTIONS, colFun => (typeof colFun === 'string' ? command[colFun] : colFun(command))), columnWidths, COLUMN_PADDING));
  });
}

function formatPrompt(promptText, commands) {
  return [
    promptText,
    `${_(commands).map('command').concat(['help']).join(', ')}: `,
  ].join(' ');
}

exports.formatPrompt = formatPrompt;

exports.respondToUserInput = async (promptText, commands) => {
  const fullPromptText = formatPrompt(promptText, commands);
  let invalidResponse = true;
  while (invalidResponse) {
    // eslint-disable-next-line no-await-in-loop
    const response = await promptWithColour(fullPromptText);

    if (response === '' || _.startsWith('help', response)) {
      printHelp(commands);
    } else {
      for (let index = 0; index < commands.length; index += 1) {
        const { command, responseFunction } = commands[index];
        if (_.startsWith(command, response)) {
          invalidResponse = false;
          // eslint-disable-next-line no-await-in-loop
          await responseFunction();
          break;
        }
      }
    }
  }
};
