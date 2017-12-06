const { getMisspellings } = require('./lib/spellcheck');

const document = 'The quikc (brown) foxx jumps ovr teh lazy dgo...';
getMisspellings(document)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
