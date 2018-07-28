const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const map = require('lodash/map');
const pick = require('lodash/pick');
const toString = require('lodash/toString');
const yaml = require('js-yaml');
const visit = require('unist-util-visit');

function stringify(toStringify) {
  if (isArray(toStringify)) {
    return map(toStringify, stringify).join('\n');
  } else if (isObject(toStringify)) {
    return map(toStringify, (value, key) => `${key}\n${stringify(value)}`).join('\n');
  } else {
    return toString(toStringify);
  }
}

function attacher(options) {
  return (tree, file) => {
    visit(tree, 'yaml', (node) => {
      let parsedFrontmatter;

      try {
        parsedFrontmatter = yaml.safeLoad(node.value);
      } catch (e) {
        printError(`Failed to parse YAML frontmatter, ignoring it. Error: ${e}`);
        parsedFrontmatter = {};
      }

      const filteredFrontmatter = pick(parsedFrontmatter, options || []);
      node.value = stringify(filteredFrontmatter);
      node.type = 'text';
    });
  };
}

exports.frontmatterFilter = attacher;
