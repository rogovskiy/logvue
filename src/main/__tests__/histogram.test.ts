import * as fs from 'fs';
import fetch from 'node-fetch';

import { openFile, getFileHistogram, FileOptionsT } from '../file';

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

describe('getFileHistogram', () => {
  beforeAll(async () => {
    await downloadFile(
      'https://raw.githubusercontent.com/logpai/loghub/master/Hadoop/Hadoop_2k.log',
      testFilePath('Hadoop_2k.log')
    );
    await downloadFile(
      'https://raw.githubusercontent.com/logpai/loghub/master/Proxifier/Proxifier_2k.log',
      testFilePath('Proxifier_2k.log')
    );
  });

  it('returns file histogram data if timestamps can be extracted', async () => {
    const testFile = testFilePath('Hadoop_2k.log');
    const options: FileOptionsT = {
      encoding: 'utf-8',
      bufferSize: 1000,
      textFormat: 'text',
      textOptions: {
        timestampPattern: '^(.{23})',
      },
      dateFormat: 'yyyy-MM-dd HH:mm:ss,SSS',
    };

    const { fileStats } = await openFile(testFile, 10, options);

    const histogram = await getFileHistogram(
      testFile,
      fileStats.checkpoints,
      10,
      options
    );
    expect(histogram).not.toBe(null);
    expect(histogram!.length).toBe(10);
    const values = histogram!.map((h) => Math.round(h.value));
    expect(values).toStrictEqual([
      283,
      178,
      281,
      104,
      155,
      235,
      190,
      190,
      190,
      190,
    ]);
  });

  it('test proxifier infinite loop', async () => {
    const testFile = testFilePath('Proxifier_2k.log');
    const options: FileOptionsT = {
      encoding: 'utf-8',
      bufferSize: 1000,
      textFormat: 'text',
      textOptions: {
        timestampPattern: '^(.{16})',
      },
      dateFormat: '[MM.dd HH:mm:ss]',
    };

    const { fileStats } = await openFile(testFile, 10, options);

    const histogram = await getFileHistogram(
      testFile,
      fileStats.checkpoints,
      10,
      options
    );
    expect(histogram).toBe(null); // Proxifier log file lines are out of time order
  });
});
