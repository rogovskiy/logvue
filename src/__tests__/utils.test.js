import { mergeLines } from '../utils';

describe('merge search lines and marks', () => {
  const marks = [
    { lineNo: 1, text: 'one' },
    { lineNo: 2, text: 'two' },
    { lineNo: 3, text: 'three' },
    { lineNo: 4, text: 'four' },
    { lineNo: 199, text: '199' },
    { lineNo: 300, text: '300' },
  ];
  const searchResult = [
    { lineNo: 2, text: 'two', searchLine: 0 },
    { lineNo: 3, text: 'three', searchLine: 1 },
    { lineNo: 10, text: 'ten', searchLine: 2 },
    { lineNo: 12, text: 'twelve', searchLine: 3 },
    { lineNo: 20, text: 'twenty', searchLine: 4 },
    { lineNo: 200, text: 'two hundred', searchLine: 5 },
  ];

  it('includes marked lines before the search result in the first buffer', () => {
    const buffer = searchResult.slice(0, 3);
    const merged = mergeLines(buffer, marks, searchResult.length);

    expect(merged.map((l) => l.lineNo)).toStrictEqual([1, 2, 3, 4, 10]);
    expect(merged.map((l) => l.searchLine)).toStrictEqual([0, 0, 1, 1, 2]);
  });
  it('includes only search lines if there are no marker matches', () => {
    const buffer = searchResult.slice(2, 5);
    const merged = mergeLines(buffer, marks, searchResult.length);

    expect(merged.map((l) => l.lineNo)).toStrictEqual([10, 12, 20]);
  });
  it('includes only search lines if there are no marker matches 2', () => {
    const buffer = searchResult.slice(1, 4);
    const merged = mergeLines(buffer, marks, searchResult.length);

    expect(merged.map((l) => l.lineNo)).toStrictEqual([3, 4, 10, 12]);
  });
  it('includes search lines and marks after the search results in the last buffer', () => {
    const buffer = searchResult.slice(3, 7);
    const merged = mergeLines(buffer, marks, searchResult.length);

    expect(merged.map((l) => l.lineNo)).toStrictEqual([12, 20, 199, 200, 300]);
  });
  it('sets the closest search line number on the marks', () => {
    const buffer = searchResult.slice(3, 7);
    const merged = mergeLines(buffer, marks, searchResult.length);

    expect(merged.map((l) => l.lineNo)).toStrictEqual([12, 20, 199, 200, 300]);
    expect(merged.map((l) => l.searchLine)).toStrictEqual([3, 4, 4, 5, 5]);
  });
});
