export type LineT = {
  line: string;
  offset: number;
  lineNo: number;
  ts?: Date;
  options?: any;
  [x: string]: any;
};
export type JsonOptionsT = {
  timestamp: string;
  message: string;
};
export type TextOptionsT = {
  extractKeyValue?: boolean;
  timestampPattern?: string;
};
export type FileEncodingT = 'utf-8' | 'latin1';
export type ShowTimestampOptionT = 'short' | 'long' | 'none';

export type FilterT = {
  query: string;
  matchCase: boolean;
};
export type CheckpointT = { lineNo: number; offset: number };

// this is used in UI only
export type ParserOptionsT = {
  textFormat: 'json' | 'text';
  jsonOptions: JsonOptionsT;
  textOptions: TextOptionsT;
  encoding: FileEncodingT;
  dateFormat: string;
  bufferSize: number;
  numCheckpoints?: number;
};
