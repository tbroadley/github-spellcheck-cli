const fs = require('fs');

exports.genJsonReport = (path, vfiles) => {
  const json = JSON.stringify(vfiles, null, 4);

  fs.writeFileSync(path, json);
  console.log('Generated report: ' + path);
};
