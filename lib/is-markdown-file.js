const path = require('path');

exports.isMarkdownFile = filePath => ['.md', '.markdown'].includes(path.extname(filePath).toLowerCase());
