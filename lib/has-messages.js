const constant = require('lodash/constant');
const sumBy = require('lodash/sumBy');

exports.hasMessages = (vfiles, filterMessages = constant(true)) => {
  const messageCount = sumBy(vfiles, file => file.messages.filter(filterMessages).length);
  return messageCount > 0;
};
