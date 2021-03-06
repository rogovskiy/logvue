import fs from 'fs';
import type { DateTime } from 'luxon';
import { parseDate, parseJson, parsePlainText } from './parsers';
import { createLineMatcher } from './search';
import guessFormat from './wiz';

import type {
  LineT,
  FileEncodingT,
  JsonOptionsT,
  TextOptionsT,
  FilterT,
  CheckpointT,
} from '../types';

export type FileOptionsT = {
  encoding?: FileEncodingT;
  bufferSize?: number;
  numCheckpoints?: number;
  textFormat?: string;
  jsonOptions?: JsonOptionsT;
  textOptions?: TextOptionsT;
  dateFormat?: string;
};
type FileStatsT = {
  lineCount: number;
  fileSize: number;
  checkpoints: Array<CheckpointT>;
};
type SearchCheckpointT = {
  searchLineNo: number;
  lineNo: number;
  offset: number;
};
type LineOptionsT = { truncated?: boolean };
type HistogramPointT = {
  startTime: DateTime;
  endTime: DateTime;
  value: number;
};

type ProgressCallbackFn = (progress: number, count: number) => boolean;
type LineCallbackFn = (
  line: string,
  lineNo: number,
  offsetNumber: number,
  options?: LineOptionsT
) => boolean;
// type FileInfoT = { // eslint-disable-line
//   fileStats: { checkpoints: Array<CheckpointT> };
//   searchCheckpoints: Map<string, CheckpointT>;
// };

const DEFAULT_BUFFER = 500 * 1024;
const DEFAULT_CHECKPOINTS = 1000;

const readLinesFromBuffer = (
  buffer: Buffer,
  bufferEnd: number,
  encoding,
  fileOffset: number,
  truncatedLine: string | null,
  startLine: number,
  lineCallback
): [number, number, boolean] => {
  let offset = 0;
  let lineCounter = startLine;
  let stopped = false;
  // console.log("buffer", fileOffset)

  let index = 0;
  while (index < bufferEnd) {
    const b = buffer[index];
    if (b === 0xd || b === 0xa) {
      let line = buffer.toString(encoding, offset, index).trimEnd();
      let options: LineOptionsT | null = null;
      if (offset === 0 && truncatedLine) {
        // console.log("Truncation done", line.length, offset, index);
        line = truncatedLine;
        options = { truncated: true };
      }
      if (line.length > 0) {
        const continueLoop = lineCallback(
          line,
          lineCounter++, // eslint-disable-line
          offset + fileOffset,
          options
        );
        if (continueLoop === false) {
          stopped = true;
          break;
        }
      }
      offset = index + 1;
    }
    index += 1;
  }
  // if (offset === 0 && truncatedLine) {
  //     console.log("truncated");
  // }
  return [offset, lineCounter, stopped];
};

export const scanFile = async (
  filename: string,
  startingCheckpoint: CheckpointT | null,
  encoding: FileEncodingT,
  bufferSize: number,
  lineCallback: LineCallbackFn
): Promise<void> => {
  const buffer = Buffer.alloc(bufferSize);
  const fileHandle = await fs.promises.open(filename, 'r');
  // let fileRead = 0;
  try {
    let fileOffset = startingCheckpoint ? startingCheckpoint.offset : 0; // current position in file
    // console.log("starting ", startingCheckpoint)
    let lastLine = startingCheckpoint ? startingCheckpoint.lineNo : 0;
    let bufferOffset = 0; // fill buffer starting offset
    let bytesRead;
    let truncatedLine: string | null = null;
    let iterationStopped = false;
    // let truncationIncrement;
    do {
      // console.log("reading ", fileOffset, bufferOffset, buffer.length)
      if (buffer.length === bufferOffset) {
        if (truncatedLine == null) {
          truncatedLine = buffer.toString(encoding, 0, buffer.length);
          // truncationIncrement = 0;
        }
        bufferOffset = 0;
        // truncationIncrement++;
      }
      if (bufferOffset < 0) {
        console.error('Buffer offset is negative');
        break;
      }
      const readBytesPromise = new Promise((resolve, reject) => { // eslint-disable-line
        fs.read(
          fileHandle.fd,
          buffer,
          bufferOffset,
          buffer.length - bufferOffset,
          fileOffset,
          (err, _bytesRead, _buffer) => {
            if (err) {
              reject(err);
            } else {
              resolve(_bytesRead);
            }
          }
        );
      });
      // fileRead += 1;
      bytesRead = await readBytesPromise; // eslint-disable-line
      const bufferEnd = bytesRead + bufferOffset;
      // console.log("bytes read3 ", bytesRead)
      if (bytesRead === 0) {
        break;
      }
      const [unusedOffset, lastLineInBuffer, stopped] = readLinesFromBuffer(
        buffer,
        bufferEnd,
        encoding,
        fileOffset - bufferOffset,
        truncatedLine,
        lastLine,
        lineCallback
      );
      if (stopped) {
        iterationStopped = true;
        break;
      }
      lastLine = lastLineInBuffer;
      if (truncatedLine && unusedOffset !== 0) {
        // console.log("truncatedLine unset", truncationIncrement)
        // truncationIncrement = 0;
        truncatedLine = null;
      }
      buffer.copy(buffer, 0, unusedOffset, bufferEnd);
      bufferOffset = bufferEnd - unusedOffset;
      // console.log("oo", bufferOffset, bytesRead, unusedOffset);
      fileOffset += bytesRead;
    } while (bytesRead > 0);
    if (bufferOffset > 0 && !iterationStopped) {
      // last line
      // console.log("last line [" +  "...." + "]", bufferOffset, buffer.toString(encoding, 0, bufferOffset).length)
      lineCallback(
        buffer.toString(encoding, 0, bufferOffset),
        lastLine,
        fileOffset - bufferOffset
      );
    }
  } finally {
    await fileHandle.close();
    // console.log('Reads ' + fileRead)
  }
};

export const openFile = async (
  filename: string,
  lineBufferSize: number,
  options: FileOptionsT,
  progressCallback?: ProgressCallbackFn
): Promise<{ lines: Array<LineT>; fileStats: FileStatsT }> => {
  const { encoding, bufferSize, numCheckpoints } = options;

  const lines: LineT[] = [];
  const lineCount = 0;

  const fileStat = await fs.promises.stat(filename);

  let lastUpdate = 0;
  let lastCheckpointUpdate = 0;
  const totalLength = fileStat.size;
  const updateFrequency = totalLength / 300;
  const checkpointFrequency =
    totalLength / (numCheckpoints || DEFAULT_CHECKPOINTS);
  const result: {
    lineCount: number;
    fileSize: number;
    checkpoints: CheckpointT[];
  } = { lineCount: 0, fileSize: totalLength, checkpoints: [] };

  await scanFile(
    filename,
    null,
    encoding || 'utf-8',
    bufferSize || DEFAULT_BUFFER,
    (line, lineNo, offset, _options) => {
      if (lines.length < lineBufferSize) {
        lines.push({ line, lineNo, offset });
      }
      if (progressCallback && offset - lastUpdate > updateFrequency) {
        progressCallback((100 * offset) / totalLength, lineCount);
        lastUpdate = offset;
        // console.log("line count", lines.length)
      }
      if (offset - lastCheckpointUpdate > checkpointFrequency) {
        result.checkpoints.push({ lineNo, offset });
        lastCheckpointUpdate = offset;
      }
      result.lineCount += 1;
      return true;
    }
  );
  if (progressCallback) {
    progressCallback(0, lineCount); // done
  }
  return { lines, fileStats: result };
};

const createLineParser = (options) => {
  let lineParser = (l) => l;
  if (options.textFormat === 'json' && options.jsonOptions) {
    const jo = options.jsonOptions;
    if (jo != null) {
      lineParser = (lineObject) => parseJson(lineObject, jo);
    }
  } else {
    const to = options.textOptions;
    if (to != null) {
      lineParser = (lineObject) =>
        parsePlainText(lineObject, to, options.dateFormat);
    }
  }
  return lineParser;
};

const locateClosestOffsetToLine = <T>(
  checkpoints: Array<T>,
  line,
  mapper: (line: T) => number
): T | null => {
  let closest: T | null = null;
  for (let idx = 0; idx < checkpoints.length; idx++) { // eslint-disable-line
    const cp = checkpoints[idx];
    if (mapper(cp) < line) {
      closest = cp;
    } else {
      break;
    }
  }
  return closest;
};

export const loadBuffer = async (
  filename: string,
  start: number,
  lineBufferSize: number,
  checkpoints: CheckpointT[],
  options: FileOptionsT,
  progressCallback: ProgressCallbackFn
): Promise<{ lines: LineT[]; offset: number }> => {
  const { encoding, bufferSize } = options;

  const lines: LineT[] = [];

  let lastUpdate = 0;

  let startingCheckpoint = { lineNo: 0, offset: 0 };
  if (checkpoints) {
    startingCheckpoint = locateClosestOffsetToLine(
      checkpoints,
      start,
      (cp) => cp.lineNo
    ) || { lineNo: 0, offset: 0 };
  }
  const updateFrequency =
    (start + lineBufferSize - startingCheckpoint.lineNo) / 200;
  // console.log("Starting checkpoint ", startingCheckpoint);
  // console.log(" need to read ", start, start + lineBufferSize - startingCheckpoint.lineNo)
  const lineParser = createLineParser(options);

  await scanFile(
    filename,
    startingCheckpoint,
    encoding || 'utf-8',
    bufferSize || DEFAULT_BUFFER,
    (line, lineNo, offset, _options) => {
      if (lineNo >= start) {
        let lineObject = { line, lineNo, offset };
        if (lineParser) {
          lineObject = lineParser(lineObject);
        }
        lines.push(lineObject);
      }
      if (lines.length >= lineBufferSize) {
        progressCallback(0, 0);
        return false;
      }
      if (progressCallback) {
        if (lineNo - lastUpdate > updateFrequency) {
          progressCallback(
            (100 * (lineNo - startingCheckpoint.lineNo)) /
              (start + lineBufferSize - startingCheckpoint.lineNo),
            0
          );
          lastUpdate = lineNo;
        }
      }
      return true;
    }
  );
  progressCallback(0, 0); // done
  return { lines, offset: start };
};

// returns a buffer of lines starting the given line number
export const searchBuffer = async (
  filename: string,
  search: FilterT,
  startLineNo: number,
  lineBufferSize: number,
  checkpoints: SearchCheckpointT[],
  options: FileOptionsT,
  progressCallback: ProgressCallbackFn
): Promise<{ lines: LineT[] }> => {
  const { encoding, bufferSize } = options;

  const lines: LineT[] = [];
  const lineParser = createLineParser(options);

  let startingCheckpoint = { lineNo: 0, offset: 0, searchLineNo: 0 };
  if (checkpoints) {
    startingCheckpoint = locateClosestOffsetToLine(
      checkpoints,
      startLineNo,
      (cp) => cp.searchLineNo
    ) || { lineNo: 0, offset: 0, searchLineNo: 0 };
  }

  let lastUpdate = 0;
  const updateFrequency = lineBufferSize / 200;
  let toBeSkipped = startLineNo - startingCheckpoint.searchLineNo;
  const lineMatcher = createLineMatcher(search);

  await scanFile(
    filename,
    startingCheckpoint,
    encoding || 'utf-8',
    bufferSize || DEFAULT_BUFFER,
    (line, lineNo, offset, _options) => {
      let lineObject = {
        line,
        lineNo,
        offset,
        searchLine: startLineNo + lines.length,
      };
      if (lineParser) {
        lineObject = lineParser(lineObject);
      }
      if (!lineMatcher(lineObject)) {
        return true;
      }
      if (toBeSkipped > 0) {
        toBeSkipped -= 1;
        return true;
      }
      if (lines.length < lineBufferSize) {
        lines.push(lineObject);
      }
      if (lines.length >= lineBufferSize) {
        progressCallback(0, 0);
        return false;
      }
      if (progressCallback) {
        if (lines.length - lastUpdate > updateFrequency) {
          progressCallback((100 * lines.length) / lineBufferSize, 0);
          lastUpdate = lines.length;
        }
      }
      return true;
    }
  );
  if (progressCallback) {
    progressCallback(0, 0); // done
  }
  return { lines };
};

// returns a buffer of lines starting the given line number
export const searchScan = async (
  filename: string,
  search: FilterT,
  options: FileOptionsT,
  progressCallback: ProgressCallbackFn
): Promise<{ resultsCount: number; checkpoints: SearchCheckpointT[] }> => {
  const { encoding, bufferSize, numCheckpoints } = options;

  const fileStat = await fs.promises.stat(filename);

  const lineParser = createLineParser(options);

  let lastUpdate = 0;
  let lastCheckpointUpdate = 0;
  const totalLength = fileStat.size;
  const updateFrequency = totalLength / 300;
  const checkpointFrequency =
    totalLength / (numCheckpoints || DEFAULT_CHECKPOINTS);
  const result: { resultsCount: number; checkpoints: SearchCheckpointT[] } = {
    resultsCount: 0,
    checkpoints: [],
  };
  const lineMatcher = createLineMatcher(search);

  await scanFile(
    filename,
    null,
    encoding || 'utf-8',
    bufferSize || DEFAULT_BUFFER,
    (line, lineNo, offset, _options) => {
      if (progressCallback && offset - lastUpdate > updateFrequency) {
        const cancelled: boolean = progressCallback(
          (100 * offset) / totalLength,
          result.resultsCount
        );
        lastUpdate = offset;
        if (cancelled) {
          return false;
        }
      }
      if (offset - lastCheckpointUpdate > checkpointFrequency) {
        result.checkpoints.push({
          lineNo,
          offset,
          searchLineNo: result.resultsCount,
        });
        lastCheckpointUpdate = offset;
      }
      let lineObject = { line, lineNo, offset };
      if (lineParser) {
        lineObject = lineParser(lineObject);
      }
      if (!lineMatcher(lineObject)) {
        return true;
      }
      result.resultsCount += 1;
      return true;
    }
  );
  if (progressCallback) {
    progressCallback(0, result.resultsCount); // done
  }
  return result;
};

const readLineAfOffset = (
  fileHandle,
  buffer,
  ch: CheckpointT,
  options
): LineT | null => {
  // const readBytesPromise = new Promise<number>((resolve, reject) => { // eslint-disable-line
  //   fs.read(
  //     fileHandle.fd,
  //     buffer,
  //     0,
  //     buffer.length,
  //     ch.offset,
  //     (err, _bytesRead, _buffer) => {
  //       console.log("CALLBACK")
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(_bytesRead);
  //       }
  //     }
  //   );
  // });
  // console.log("WWW", ch.lineNo, ch.offset, buffer.length);
  const bytesRead = fs.readSync(
    fileHandle.fd,
    buffer,
    0,
    buffer.length,
    ch.offset
  );
  // console.log("BUTES read ", bytesRead);
  let firstLine: LineT | null = null;
  readLinesFromBuffer(
    buffer,
    bytesRead,
    options.encoding,
    ch.offset,
    null,
    ch.lineNo,
    (line) => {
      firstLine = line;
      return false;
    }
  );
  return firstLine;
};

const makeHistogram = (data, numberOfBuckets): HistogramPointT[] | null => {
  const start = data[0];
  const end = data[data.length - 1];
  if (!start.ts || !end.ts) {
    return null; // no time available
  }
  if (data.length < numberOfBuckets) {
    return null; // too few data points
  }
  const totalTime = end.ts.diff(start.ts, 'seconds');
  if (totalTime < 0) {
    // start time > end time , this shouldn't happend but it does sometimes
    return null;
  }
  const interval = totalTime / numberOfBuckets;
  let dataIndex = 1;
  let nextTime = start.ts.plus(interval, 'seconds');
  const histogram: HistogramPointT[] = [];
  let startLineCount = 0;
  // console.log(data.map( d => (d.lineNo)));
  while (dataIndex < data.length) {
    const current = data[dataIndex];
    const prev = data[dataIndex - 1];
    if (current.ts >= nextTime && prev.ts) {
      const endAdjustment =
        ((current.lineNo - prev.lineNo) * nextTime.diff(prev.ts, 'seconds')) /
        current.ts.diff(prev.ts, 'seconds');
      const endLineCount = prev.lineNo + endAdjustment;
      const diff = endLineCount - startLineCount;
      histogram.push({
        startTime: nextTime.minus(interval, 'seconds'),
        endTime: nextTime,
        value: diff,
      });
      while (current.ts >= nextTime) {
        nextTime = nextTime.plus(interval, 'seconds'); // not always the desired number of bars unfortunately
      }
      startLineCount = endLineCount;
      // console.log("next time", nextTime.toISO());
    }
    dataIndex += 1;
  }
  return histogram;
};

export const getFileHistogram = async (
  filename: string,
  checkpoints: CheckpointT[],
  numberOfBuckets: number,
  options: FileOptionsT
): Promise<HistogramPointT[] | null> => {
  const fileHandle = await fs.promises.open(filename, 'r');
  const buffer = Buffer.alloc(options.bufferSize || DEFAULT_BUFFER);
  const lineParser = createLineParser(options);
  let dateFormat: string | null = null;
  if (options.textFormat === 'text' && options.textOptions) {
    dateFormat = options.dateFormat || null;
  }
  if (options.textFormat === 'json' && options.jsonOptions) {
    dateFormat = options.dateFormat || null;
  }
  try {
    const data: LineT[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const ch of checkpoints) {
      // eslint-disable-next-line no-await-in-loop
      const maybeLine = readLineAfOffset(fileHandle, buffer, ch, options);
      if (maybeLine) {
        const parsedLine = lineParser({ line: maybeLine });
        const withTimestamp = {
          ...parsedLine,
          ts: parseDate(parsedLine._ts, dateFormat),
          lineNo: ch.lineNo,
        };
        data.push(withTimestamp);
      }
    }
    return makeHistogram(data, numberOfBuckets);
  } finally {
    await fileHandle.close();
  }
};
