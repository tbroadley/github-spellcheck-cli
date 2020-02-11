const builder = require('junit-report-builder');

exports.genJunitReport = (path, vfiles) => {
  const suite = builder.testSuite().name('spellchecker');

  vfiles.forEach((file) => {
    file.messages.forEach((error) => {
      const testCase = suite.testCase()
        .className(error.ruleId)
        .name(error.name);
      testCase.failure(error.message, error.ruleId);
    });
  });

  builder.writeTo(path);
  console.log(`Generated report: ${path}`);
};
