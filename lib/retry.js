const { gitNoPathArgs: git } = require('./git');
const promiseRetry = require('promise-retry');

exports.cloneWithRetry = (url, clonePath) => promiseRetry(
  (retry, number) => {
    const cloneOptions = '--depth 1';
    return git(`clone ${cloneOptions} "${url}" "${clonePath}"`).catch((error) => {
      console.log(`Failed to clone. Trying again... (Attempt ${number} of 3)`);
      retry(error);
    });
  },
  {
    retries: 3,
  }
);
