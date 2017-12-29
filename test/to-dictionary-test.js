const chai = require('chai');

const { toDictionary } = require('../lib/to-dictionary');

chai.should();

const fileWithNoMessages = { messages: [] };

function buildVfile(actuals) {
  return {
    messages: actuals.map(actual => ({ actual })),
  };
}

describe('toDictionary', () => {
  it('returns an empty string when passed an empty array', () => {
    toDictionary([]).should.equal('');
  });

  it('returns an empty string when passed a list of vfiles with no messages', () => {
    toDictionary([
      fileWithNoMessages,
      fileWithNoMessages,
      fileWithNoMessages,
    ]).should.equal('');
  });

  it('returns a sorted list of messages', () => {
    toDictionary([
      buildVfile(['c', 'e']),
      buildVfile(['b']),
      buildVfile(['a', 'd']),
    ]).should.equal(['a', 'b', 'c', 'd', 'e'].join('\n'));
  });

  it('returns a deduplicated list of messages', () => {
    toDictionary([
      buildVfile(['a', 'b']),
      buildVfile(['b', 'c']),
      buildVfile(['c', 'a']),
    ]).should.equal(['a', 'b', 'c'].join('\n'));
  });
});
