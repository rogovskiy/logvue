import guessFormat from '../wiz';

describe('guessing file settings', () => {
  describe('json', () => {
    it('guesses JSON format', () => {
      const suggestion = guessFormat([
        JSON.stringify({ a: 'aaa', b: 'bbb1' }),
        JSON.stringify({ a: 'aaa2', b: 'bbb2' }),
        JSON.stringify({ a: 'aaa3', b: 'bbb3' }),
        JSON.stringify({ a: 'aaa4', b: 'bbb4' }),
        JSON.stringify({ a: 'aaa5', b: 'bbb4' }),
      ]);
      expect(suggestion.textFormat).toBe('json');
      expect(suggestion.jsonOptions).not.toBe(null);
      expect(suggestion.jsonOptions?.fields).toStrictEqual(['a', 'b']);
    });

    it('guesses JSON format even if there is some noise', () => {
      const suggestion = guessFormat([
        JSON.stringify({ a: 'aaa', b: 'bbb1' }),
        JSON.stringify({ a: 'aaa2', b: 'bbb2' }),
        JSON.stringify({ a: 'aaa3', b: 'bbb3' }),
        'blah',
        JSON.stringify({ a: 'aaa5', b: 'bbb4' }),
      ]);
      expect(suggestion.textFormat).toBe('json');
      expect(suggestion.jsonOptions).not.toBe(null);
      expect(suggestion.jsonOptions?.fields).toStrictEqual(['a' , 'b']);
    });
  });

  describe('text', () => {
    it('guesses text format', () => {
      const suggestion = guessFormat(['aaa', 'bbb', 'ccc', 'dddd']);
      expect(suggestion.textFormat).toBe('text');
    });
  });
});
