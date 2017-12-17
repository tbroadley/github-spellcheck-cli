const { formatPrompt } = require('../lib/user-input');

describe('formatPrompt', () => {
  it('returns "help" when passed no parameters', () => {
    formatPrompt().should.equal(' h: ');
  });

  it('returns the prompt text and "help" when passed one parameter', () => {
    formatPrompt('Enter something?').should.equal('Enter something? h: ');
  });

  it('returns the prompt text and "help" when commands is empty', () => {
    formatPrompt('What will you do?', []).should.equal('What will you do? h: ');
  });

  it('returns the correct prompt when commands has one element', () => {
    formatPrompt('What will you do?', [
      { command: 'a' },
      { command: 'b' },
      { command: 'c' },
    ]).should.equal('What will you do? a, b, c, h: ');
  });
});
