import * as parsers from '../parsers';

describe('JSON Parsing', () => {
  it('pareses JSON object and remaps _message and _ts', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: JSON.stringify({
        message: 'Hello world',
        timestamp: '2021-03-18T03:59:52.017Z',
      }),
    };
    const parsed = parsers.parseJson(lineObject, {
      message: 'message',
      timestamp: 'timestamp',
    });
    // console.log(parsed)
    expect(parsed._message).toBe('Hello world');
    expect(parsed.lineNo).toBe(12);
    expect(parsed.timestamp).toBe('2021-03-18T03:59:52.017Z');
  });
  it('if unable to parse JSON renders JSON text', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: JSON.stringify({
        message: 'Hello world',
        timestamp: '2021-03-18T03:59:52.017Z',
      }).substring(0, 25),
    };
    const parsed = parsers.parseJson(lineObject, {
      message: 'message',
      timestamp: 'timestamp',
    });
    // console.log(parsed)
    expect(parsed._message).toBe(lineObject.line);
    expect(parsed.lineNo).toBe(12);
    expect(parsed.timestamp).toBeUndefined();
  });
  it('if unable to find mapping for _message renders JSON text', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: JSON.stringify({
        message: 'Hello world',
        timestamp: '2021-03-18T03:59:52.017Z',
      }),
    };
    const parsed = parsers.parseJson(lineObject, {
      message: 'message_name',
      timestamp: 'timestamp',
    });
    // console.log(parsed)
    expect(parsed._message).toBe(lineObject.line);
    expect(parsed.lineNo).toBe(12);
    expect(parsed.timestamp).toBe('2021-03-18T03:59:52.017Z');
  });
});

describe('Text Parsing', () => {
  it('simplest case returns the same line', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: 'Hello world',
    };
    const parsed = parsers.parsePlainText(lineObject, {});
    expect(parsed._message).toBe('Hello world');
  });

  it('extract key value pairs', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: 'Hello world time=12sec cpu=21',
    };
    const parsed = parsers.parsePlainText(lineObject, {
      extractKeyValue: true,
    });
    expect(parsed._message).toBe(lineObject.line);
    expect(parsed.time).toBe('12sec');
    expect(parsed.cpu).toBe('21');
  });

  it('extract timestamp', () => {
    const lineObject = {
      lineNo: 12,
      offset: 25,
      line: '2021-03-18T03:59:52.017Z Hello world time=12sec cpu=21',
    };
    const parsed = parsers.parsePlainText(lineObject, {
      timestampPattern: /^.{24}/,
      extractKeyValue: true,
    });
    expect(parsed._message).toBe('Hello world time=12sec cpu=21');
    expect(parsed.time).toBe('12sec');
    expect(parsed.cpu).toBe('21');
    expect(parsed._ts).toBe('2021-03-18T03:59:52.017Z');
  });
});
