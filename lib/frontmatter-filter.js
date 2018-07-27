const pick = require('lodash/pick');
const yaml = require('js-yaml');
const visit = require('unist-util-visit');

function attacher(options) {
  return (tree, file) => {
    visit(tree, 'yaml', (node) => {
      console.log(node);
      console.log(node.value);

      let parsedYaml;

      try {
        parsedYaml = yaml.safeLoad(node.value);
      } catch (e) {
        printError(`Failed to parse YAML frontmatter, ignoring it. Error: ${e}`);
        parsedYaml = {};
      }

      node.value = yaml.dump(pick(parsedYaml, options || []));
    });
  };
}

exports.frontmatterFilter = attacher;
