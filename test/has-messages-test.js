const chai = require('chai');

const { hasMessages } = require('../lib/has-messages');

chai.should();

const { fileWithNoMessages, buildVfile } = require('./helpers/vfile');

describe('hasMessages', () => {
  it('returns false when passed an empty array', () => {
    hasMessages([]).should.equal(false);
  });

  it('returns false when passed an array of files with no messages', () => {
    hasMessages([
      fileWithNoMessages,
      fileWithNoMessages,
      fileWithNoMessages,
    ]).should.equal(false);
  });

  it('returns true when passed an array containing one file with a message', () => {
    hasMessages([
      fileWithNoMessages,
      buildVfile(['a']),
    ]).should.equal(true);
  });

  it('filters messages using the given function', () => {
    hasMessages([
      buildVfile(['a', 'b', 'c']),
    ], message => message.source === 'asdf').should.equal(false);
  });
});
