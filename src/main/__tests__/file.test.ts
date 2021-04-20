import {
  scanFile,
  openFile,
  loadBuffer,
  searchScan,
  searchBuffer,
} from '../file';

import type { FileOptionsT } from '../file';

const testFilePath = (filename) => {
  return `${__dirname.replace('/lib', '/src')}/${filename}`;
};

test('scan small file', async () => {
  const lines: string[] = [];
  await scanFile(
    testFilePath('sample.txt'),
    null,
    'utf-8',
    1000,
    (line, _lineNo, _offset) => {
      lines.push(line);
      return true;
    }
  );
  expect(lines).toStrictEqual(['one', 'two  two', 'three', 'four']);
});

test('openFile small file', async () => {
  let numberNotifies = 0;
  const result = await openFile(
    testFilePath('sample.txt'),
    10,
    { encoding: 'utf-8' },
    () => {
      numberNotifies += 1;
    }
  );
  expect(result.fileStats.lineCount).toBe(4);
  expect(result.lines).toStrictEqual([
    { line: 'one', offset: 0, lineNo: 0 },
    { line: 'two  two', offset: 4, lineNo: 1 },
    { line: 'three', offset: 13, lineNo: 2 },
    { line: 'four', offset: 19, lineNo: 3 },
  ]);
  expect(numberNotifies).toBe(4);
});

test.each`
  bufferSize
  ${1}
  ${4}
  ${100}
`('openFile larger file (buffer: $bufferSize KB)', async ({ bufferSize }) => {
  const result = await openFile(testFilePath('larger_file.html'), 500, {
    encoding: 'utf-8',
    bufferSize: bufferSize * 1024,
  });
  expect(result.fileStats.lineCount).toBe(5944); // non-empty lines
  expect(result.lines.slice(0, 4)).toStrictEqual([
    { line: '<!DOCTYPE html>', offset: 0, lineNo: 0 },
    { line: '<html>', offset: 17, lineNo: 1 },
    { line: '<head>', offset: 25, lineNo: 2 },
    {
      line:
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
      offset: 37,
      lineNo: 3,
    },
  ]);
  expect(result.lines.length).toEqual(500);
  expect(result.lines[499]).toStrictEqual({
    line: '    <div class="docstring indention">',
    offset: 23958,
    lineNo: 499,
  });
});

test('loadBuffer small', async () => {
  let numberNotifies = 0;
  // const result = await openFile(__dirname + "/sample.txt", 10, { encoding: "utf-8" }, (p) => {
  // numberNotifies++;
  // })

  const buffer = await loadBuffer(
    testFilePath('sample.txt'),
    2,
    10,
    [],
    {},
    () => {
      numberNotifies += 1;
    }
  );

  expect(buffer.lines.length).toBe(2);
  expect(buffer.lines).toStrictEqual([
    { line: 'three', offset: 13, lineNo: 2 },
    { line: 'four', offset: 19, lineNo: 3 },
  ]);
  expect(numberNotifies).toBe(4);
});

test('loadBuffer larger file without checkpoints', async () => {
  let numberNotifies = 0;
  // const result = await openFile(__dirname + "/sample.txt", 10, { encoding: "utf-8" }, (p) => {
  //     // numberNotifies++;
  //     console.log("progress ", p)
  // })

  const buffer = await loadBuffer(
    testFilePath('larger_file.html'),
    5900,
    50,
    [],
    {},
    () => {
      numberNotifies += 1;
    }
  );

  expect(buffer.lines.length).toBe(44);
  expect(buffer.lines.slice(0, 3)).toStrictEqual([
    {
      line: '  <span class="lead-duration duration">000ms</span>',
      offset: 1262105,
      lineNo: 5900,
    },
    { line: '  </div>', offset: 1262160, lineNo: 5901 },
    { line: '      </div>', offset: 1262234, lineNo: 5902 },
  ]);
  expect(buffer.lines[buffer.lines.length - 1]).toStrictEqual({
    line: '</html>',
    offset: 1263930,
    lineNo: 5943,
  });
  expect(numberNotifies).toBe(199);
});

test('loadBuffer larger file with checkpoints', async () => {
  let numberNotifies = 0;
  const result = await openFile(testFilePath('larger_file.html'), 10, {
    encoding: 'utf-8',
  });

  const buffer = await loadBuffer(
    testFilePath('larger_file.html'),
    5900,
    50,
    result.fileStats.checkpoints,
    {},
    () => {
      // TODO add checkpoints
      numberNotifies += 1;
    }
  );

  expect(buffer.lines.length).toBe(44);
  expect(buffer.lines.slice(0, 3)).toStrictEqual([
    {
      line: '  <span class="lead-duration duration">000ms</span>',
      offset: 1262105,
      lineNo: 5900,
    },
    { line: '  </div>', offset: 1262160, lineNo: 5901 },
    { line: '      </div>', offset: 1262234, lineNo: 5902 },
  ]);
  expect(buffer.lines[buffer.lines.length - 1]).toStrictEqual({
    line: '</html>',
    offset: 1263930,
    lineNo: 5943,
  });
  expect(numberNotifies).toBe(53);
});

test('search scan string in a small file', async () => {
  const { resultsCount } = await searchScan(
    testFilePath('sample.txt'),
    { query: 'tw' },
    { encoding: 'utf-8' },
    () => {}
  );
  expect(resultsCount).toBe(1);

  const { resultsCount: resultsCount2 } = await searchScan(
    testFilePath('sample.txt'),
    { query: 't' },
    { encoding: 'utf-8' },
    () => {}
  );
  expect(resultsCount2).toBe(2);
});

test('search string in a small file using start line', async () => {
  const { lines } = await searchBuffer(
    testFilePath('sample.txt'),
    { query: 'tw' },
    2,
    1000,
    [],
    { encoding: 'utf-8' },
    () => {}
  );
  expect(lines).toStrictEqual([]);
});

test('buffered search', async () => {
  // for i in {0..1000}; do echo aaa $i; echo bbb $i; echo ccc $i;  done > src/__tests__/search_test.txt
  const testFile = testFilePath('search_test.txt');
  const options: FileOptionsT = { encoding: 'utf8', bufferSize: 100 };
  const searchQuery = { query: 'aaa' };

  await openFile(testFile, 10, options);
  // console.log("file open", result);

  const searchResult = await searchScan(
    testFile,
    searchQuery,
    options,
    () => {}
  );
  // console.log("search scan", searchResult);

  expect(searchResult.resultsCount).toBe(1001);

  const buffer = await searchBuffer(
    testFile,
    searchQuery,
    0,
    100,
    searchResult.checkpoints,
    options,
    () => {}
  );
  // console.log("buffer", buffer);
  expect(buffer.lines.length).toBe(100);
  expect(buffer.lines[0]).toStrictEqual({
    line: 'aaa 0',
    lineNo: 0,
    offset: 0,
    searchLine: 0,
  });
  expect(buffer.lines[99]).toStrictEqual({
    line: 'aaa 99',
    lineNo: 297,
    offset: 2049,
    searchLine: 99,
  });

  const buffer2 = await searchBuffer(
    testFile,
    searchQuery,
    20,
    10,
    searchResult.checkpoints,
    options,
    () => {}
  );
  // console.log("buffer2", buffer2);
  expect(buffer2.lines.length).toBe(10);
  expect(buffer2.lines[0]).toStrictEqual({
    line: 'aaa 20',
    lineNo: 60,
    offset: 390,
    searchLine: 20,
  });
  expect(buffer2.lines[9]).toStrictEqual({
    line: 'aaa 29',
    lineNo: 87,
    offset: 579,
    searchLine: 29,
  });

  const buffer3 = await searchBuffer(
    testFile,
    searchQuery,
    20,
    10,
    [],
    options,
    () => {}
  );
  // console.log("buffer3", buffer3);
  expect(buffer3.lines.length).toBe(10);
  expect(buffer3.lines[0]).toStrictEqual({
    line: 'aaa 20',
    lineNo: 60,
    offset: 390,
    searchLine: 20,
  });
  expect(buffer3.lines[9]).toStrictEqual({
    line: 'aaa 29',
    lineNo: 87,
    offset: 579,
    searchLine: 29,
  });
});
