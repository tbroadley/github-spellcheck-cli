const { formatPrompt } = require('../lib/user-input');

describe('formatPrompt', () => {
  it('returns "help" when passed no parameters', () => {
    formatPrompt().should.equal(' help: ');
  });

  it('returns the prompt text and "help" when passed one parameter', () => {
    formatPrompt('Enter something?').should.equal('Enter something? help: ');
  });

  it('returns the prompt text and "help" when commands is empty', () => {
    formatPrompt('What will you do?', []).should.equal('What will you do? help: ');
  });

  it('returns the correct prompt when commands has one element', () => {
    formatPrompt('What will you do?', [
      { command: 'fight' },
      { command: 'flee' },
      { command: 'stand and deliver' },
    ]).should.equal('What will you do? fight, flee, stand and deliver, help: ');
  });
});
