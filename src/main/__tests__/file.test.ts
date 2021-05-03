import fetch from 'node-fetch';
import * as fs from 'fs';
import {
  scanFile,
  openFile,
  loadBuffer,
  searchScan,
  searchBuffer,
} from '../file';

import type { FileOptionsT } from '../file';

const DEFAULT_PARSER_OPTIONS: FileOptionsT = {};

const testFilePath = (filename) => {
  return `${__dirname}/${filename}`;
};

const downloadFile = async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
};

beforeAll(async () => {
  await downloadFile(
    'https://raw.githubusercontent.com/logpai/loghub/master/Proxifier/Proxifier_2k.log',
    testFilePath('Proxifier_2k.log')
  );
  console.log('Downloaded test file Proxifier_2k.log');
});

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
    DEFAULT_PARSER_OPTIONS,
    () => {
      numberNotifies += 1;
      return false;
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
  const result = await openFile(testFilePath('Proxifier_2k.log'), 500, {
    ...DEFAULT_PARSER_OPTIONS,
    bufferSize: bufferSize * 1024,
  });
  expect(result.fileStats.lineCount).toBe(2000); // non-empty lines
  expect(result.lines.slice(0, 4)).toStrictEqual([
    {
      line:
        '[10.30 16:49:06] chrome.exe - proxy.cse.cuhk.edu.hk:5070 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 0,
      lineNo: 0,
    },
    {
      line:
        '[10.30 16:49:06] chrome.exe - proxy.cse.cuhk.edu.hk:5070 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 109,
      lineNo: 1,
    },
    {
      line:
        '[10.30 16:49:06] chrome.exe - proxy.cse.cuhk.edu.hk:5070 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 218,
      lineNo: 2,
    },
    {
      line:
        '[10.30 16:49:07] chrome.exe - proxy.cse.cuhk.edu.hk:5070 close, 0 bytes sent, 0 bytes received, lifetime 00:01',
      offset: 327,
      lineNo: 3,
    },
  ]);
  expect(result.lines.length).toEqual(500);
  expect(result.lines[499]).toStrictEqual({
    line:
      '[10.30 18:10:27] chrome.exe - proxy.cse.cuhk.edu.hk:5070 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
    offset: 58470,
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
    DEFAULT_PARSER_OPTIONS,
    () => {
      numberNotifies += 1;
      return false;
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

  const buffer = await loadBuffer(
    testFilePath('Proxifier_2k.log'),
    1975,
    50,
    [],
    DEFAULT_PARSER_OPTIONS,
    () => {
      numberNotifies += 1;
      return false;
    }
  );

  expect(buffer.lines.length).toBe(25);
  expect(buffer.lines.slice(0, 3)).toStrictEqual([
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - s1.bdstatic.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234218,
      lineNo: 1975,
    },
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - t12.baidu.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234323,
      lineNo: 1976,
    },
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - t12.baidu.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234426,
      lineNo: 1977,
    },
  ]);
  expect(buffer.lines[buffer.lines.length - 1]).toStrictEqual({
    line:
      '[07.27 10:23:42] chrome.exe *64 - t12.baidu.com:80 close, 0 bytes sent, 0 bytes received, lifetime 00:17',
    offset: 236858,
    lineNo: 1999,
  });
  expect(numberNotifies).toBe(182);
});

test('loadBuffer larger file with checkpoints', async () => {
  let numberNotifies = 0;
  const result = await openFile(
    testFilePath('Proxifier_2k.log'),
    10,
    DEFAULT_PARSER_OPTIONS
  );

  const buffer = await loadBuffer(
    testFilePath('Proxifier_2k.log'),
    1975,
    50,
    result.fileStats.checkpoints,
    DEFAULT_PARSER_OPTIONS,
    () => {
      // TODO add checkpoints
      numberNotifies += 1;
      return false;
    }
  );

  expect(buffer.lines.length).toBe(25);
  expect(buffer.lines.slice(0, 3)).toStrictEqual([
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - s1.bdstatic.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234218,
      lineNo: 1975,
    },
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - t12.baidu.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234323,
      lineNo: 1976,
    },
    {
      line:
        '[07.27 10:22:39] chrome.exe *64 - t12.baidu.com:80 open through proxy proxy.cse.cuhk.edu.hk:5070 HTTPS',
      offset: 234426,
      lineNo: 1977,
    },
  ]);
  expect(buffer.lines[buffer.lines.length - 1]).toStrictEqual({
    line:
      '[07.27 10:23:42] chrome.exe *64 - t12.baidu.com:80 close, 0 bytes sent, 0 bytes received, lifetime 00:17',
    offset: 236858,
    lineNo: 1999,
  });
  expect(numberNotifies).toBe(29);
});

test('search scan string in a small file', async () => {
  const { resultsCount } = await searchScan(
    testFilePath('sample.txt'),
    { query: 'tw', matchCase: true },
    DEFAULT_PARSER_OPTIONS,
    () => false
  );
  expect(resultsCount).toBe(1);

  const { resultsCount: resultsCount2 } = await searchScan(
    testFilePath('sample.txt'),
    { query: 't', matchCase: true },
    DEFAULT_PARSER_OPTIONS,
    () => false
  );
  expect(resultsCount2).toBe(2);
});

test('search string in a small file using start line', async () => {
  const { lines } = await searchBuffer(
    testFilePath('sample.txt'),
    { query: 'tw', matchCase: true },
    2,
    1000,
    [],
    DEFAULT_PARSER_OPTIONS,
    () => false
  );
  expect(lines).toStrictEqual([]);
});

test('buffered search', async () => {
  // for i in {0..1000}; do echo aaa $i; echo bbb $i; echo ccc $i;  done > src/__tests__/search_test.txt
  const testFile = testFilePath('search_test.txt');
  const options: FileOptionsT = {
    ...DEFAULT_PARSER_OPTIONS,
    bufferSize: 100,
  };
  const searchQuery = { query: 'aaa', matchCase: true };

  await openFile(testFile, 10, options);
  // console.log("file open", result);

  const searchResult = await searchScan(
    testFile,
    searchQuery,
    options,
    () => false
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
    () => false
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
    () => false
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
    () => false
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
