export type LineT = {
  line: string;
  offset: number;
  lineNo: number;
  options?: any;
  [x: string]: any;
};
export type JsonOptionsT = { timestamp: string; message: string };
export type TextOptionsT = {
  extractKeyValue?: boolean;
  timestampPattern?: string | RegExp;
};
export type FileEncodingT = 'utf-8' | 'utf8';
export type ShowTimestampOptionT = 'short' | 'long' | 'none';
