const { Clone } = require('nodegit');
const promiseRetry = require('promise-retry');

exports.cloneWithRetry = async (url, clonePath, githubCredentialsOptions) => promiseRetry(
  (retry, number) => Clone(url, clonePath, {
    fetchOpts: githubCredentialsOptions,
  }).catch((error) => {
    console.log(`Failed to clone ${url}. Trying again... (Attempt ${number} of 3)`);
    retry(error);
  }),
  {
    retries: 3,
  }
);
