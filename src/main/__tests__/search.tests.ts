import { createLineMatcher } from '../search';

describe('search', () => {
  it('matches based on regex syntax', () => {
    const lineMatcher = createLineMatcher({ query: 'a.*c', matchCase: true });
    expect(lineMatcher({ line: 'hello abbc bye' })).toBe(true);
    expect(lineMatcher({ line: 'Hello a*c' })).toBe(true);
  });
  it('matches string case sensitive', () => {
    const lineMatcher = createLineMatcher({ query: 'abc', matchCase: true });
    expect(lineMatcher({ line: 'Hello Abc' })).toBe(false);
    expect(lineMatcher({ line: 'Hello abc' })).toBe(true);
  });
  it('matches string case insensitive', () => {
    const lineMatcher = createLineMatcher({ query: 'abc', matchCase: false });
    expect(lineMatcher({ line: 'Hello Abc' })).toBe(true);
    expect(lineMatcher({ line: 'Hello abc' })).toBe(true);
  });
  it('always return false if query is invalid regex', () => {
    const lineMatcher = createLineMatcher({ query: '*', matchCase: false });
    expect(lineMatcher({ line: 'Hello Abc' })).toBe(false);
    expect(lineMatcher({ line: '*' })).toBe(false);
  });
});
