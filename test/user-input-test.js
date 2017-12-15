const { formatPrompt } = require('../lib/user-input');

describe('formatPrompt', () => {
  it('returns an empty string when passed no parameters', () => {
    formatPrompt().should.equal(' help: ');
  });

  it('returns just the prompt text when passed one parameter', () => {
    formatPrompt('Enter something?').should.equal('Enter something? help: ');
  });

  it('returns just the prompt text when commands is empty', () => {
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
