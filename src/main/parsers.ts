import { DateTime } from 'luxon';
import type { LineT, JsonOptionsT, TextOptionsT } from '../types';

export const parseDate = (
  dateStr: string,
  dateFormat: string | null
): DateTime | null => {
  if (!dateStr) {
    return null;
  }
  let parsed: DateTime;
  if (dateFormat) {
    if (dateFormat === 'ISO') {
      parsed = DateTime.fromISO(dateStr.trim());
    } else if (dateFormat === 'RFC822') {
      parsed = DateTime.fromRFC2822(dateStr.trim());
    } else if (dateFormat === 'Unix') {
      parsed = DateTime.fromSeconds(parseInt(dateStr.trim(), 10));
    } else if (dateFormat === 'Millis') {
      parsed = DateTime.fromMillis(parseInt(dateStr.trim(), 10));
    } else {
      parsed = DateTime.fromFormat(dateStr.trim(), dateFormat);
    }
  } else {
    parsed = DateTime.fromISO(dateStr.trim());
  }
  return parsed && parsed.isValid ? parsed : null;
};

export const parseJson = (
  lineObject: LineT,
  jsonOptions: JsonOptionsT
): LineT => {
  try {
    const parsed = JSON.parse(lineObject.line);
    parsed._message = parsed[jsonOptions.message] || lineObject.line;
    parsed._ts = parsed[jsonOptions.timestamp] || null; // decided not parse dates early due to performance concerns
    return {
      ...parsed,
      ...lineObject,
    };
  } catch (e) {
    return {
      ...lineObject,
      _message: lineObject.line,
    };
  }
};

const KEY_VALUE_RE = /([a-z0-9]+)=([a-z0-9]+)/g;
export const parsePlainText = (
  lineObject: LineT,
  textOptions: TextOptionsT,
  dateFormat: string
): LineT => {
  const parsed = {};
  if (textOptions.extractKeyValue) {
    for (const m of lineObject.line.matchAll(KEY_VALUE_RE)) {  // eslint-disable-line
      const [, key, value] = m;
      parsed[key] = value;
    }
  }
  /* eslint-disable */
  if (textOptions.timestampPattern) {
    // /^(.{25})/
    const re = new RegExp(textOptions.timestampPattern);
    const ts = lineObject.line.match(re);
    if (ts) {
      const timestamp = ts.length > 1 ? ts[1] : ts[0];
      if (parseDate(timestamp, dateFormat)) {
        parsed['_ts'] = timestamp;
        parsed['_message'] = lineObject.line
          .replace(re, '')
          .trimLeft();
      } else {
        parsed['_message'] = lineObject.line;
      }
    } else {
      parsed['_message'] = lineObject.line;
    }
  } else {
    parsed['_message'] = lineObject.line;
  }
  /* eslint-enable */
  return {
    ...lineObject,
    ...parsed,
  };
};
