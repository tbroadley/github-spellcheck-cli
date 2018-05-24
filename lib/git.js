const { exec: execWithCallback } = require('child_process');
const path = require('path');
const promisify = require('es6-promisify');

const exec = promisify(execWithCallback, { multiArgs: true });

function gitPathArgs(repoPath) {
  return `--work-tree="${repoPath}" --git-dir="${path.join(repoPath, '.git')}"`;
}

exports.git = (repoPath, command) => exec(`git ${gitPathArgs(repoPath)} ${command}`)
  .then(([stdout, stderr, error]) => {
    if (error) throw error;
    return [stdout, stderr];
  });

exports.gitNoPathArgs = command => exec(`git ${command}`)
  .then(([stdout, stderr, error]) => {
    if (error) throw error;
    return [stdout, stderr];
  });
