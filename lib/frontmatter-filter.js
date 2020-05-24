const yaml = require('js-yaml');
const toml = require('toml');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const map = require('lodash/map');
const pick = require('lodash/pick');
const toString = require('lodash/toString');
const visit = require('unist-util-visit');

const { printError } = require('./print-error');

function stringify(toStringify) {
  if (isArray(toStringify)) {
    return map(toStringify, stringify).join('\n');
  }
  if (isObject(toStringify)) {
    return map(toStringify, (value, key) => `${key}\n${stringify(value)}`).join('\n');
  }
  return toString(toStringify);
}

function attacher(options) {
  return (tree) => {
    visit(tree, 'yaml', (node) => {
      let parsedFrontmatter;

      try {
        parsedFrontmatter = yaml.safeLoad(node.value);
      } catch (e) {
        printError(`Failed to parse YAML frontmatter, ignoring it. Error: ${e}`);
        parsedFrontmatter = {};
      }

      const filteredFrontmatter = pick(parsedFrontmatter, options || []);

      /* eslint-disable no-param-reassign */
      node.value = stringify(filteredFrontmatter);
      node.type = 'text';
      /* eslint-enable no-param-reassign */
    });
    visit(tree, 'toml', (node) => {
      let parsedFrontmatter;

      try {
        parsedFrontmatter = toml.parse(node.value);
        
      } catch (e) {
        printError(`Failed to parse TOML frontmatter, ignoring it. Error: ${e}`);
        parsedFrontmatter = {};
      }

      const filteredFrontmatter = pick(parsedFrontmatter, options || []);

      /* eslint-disable no-param-reassign */
      node.value = stringify(filteredFrontmatter);
      node.type = 'text';
      /* eslint-enable no-param-reassign */
    });
  };
}

exports.frontmatterFilter = attacher;
