exports.fileWithNoMessages = { source: 'retext-spell', messages: [] };

exports.buildVfile = actuals => ({
  messages: actuals.map(actual => ({ source: 'retext-spell', actual })),
});
