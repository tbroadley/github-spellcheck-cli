const { gitNoPathArgs: git } = require('./git');
const promiseRetry = require('promise-retry');

exports.cloneWithRetry = (url, clonePath) => promiseRetry(
  (retry, number) => git(`clone "${url}" "${clonePath}"`).catch((error) => {
    console.log(`Failed to clone. Trying again... (Attempt ${number} of 3)`);
    retry(error);
  }),
  {
    retries: 3,
  }
);
