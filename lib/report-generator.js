const { genJsonReport } = require('./report-types/json-report');
const { genJunitReport } = require('./report-types/junit-report');

exports.generateReports = (reports, vfiles) => {
  reports.forEach((report) => {
    if (report.endsWith('.json')) {
      genJsonReport(report, vfiles);
    } else if (report.endsWith('junit.xml')) {
      genJunitReport(report, vfiles);
    }
  });
};
