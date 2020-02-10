const { genJsonReport } = require('./report-types/json-report.js');
const { genJunitReport } = require('./report-types/junit-report.js');

exports.generateReports = (reports, vfiles) => {
  reports.forEach((report) => {
    if (report.endsWith('.json')) {
      genJsonReport(report, vfiles);
    } else if (report.endsWith('junit.xml')) {
      genJunitReport(report, vfiles);
    }
  });
};
