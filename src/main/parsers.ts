const parseJson = (lineObject: LineT, jsonOptions: JsonOptionsT): LineT => {
  try {
    const parsed = JSON.parse(lineObject.line);
    parsed._message = parsed[jsonOptions.message] || lineObject.line;
    parsed._ts = parsed[jsonOptions.timestamp] || null;
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
const parsePlainText = (
  lineObject: LineT,
  textOptions: TextOptionsT
): LineT => {
  const parsed = {};
  if (textOptions.extractKeyValue) {
    for (const m of lineObject.line.matchAll(KEY_VALUE_RE)) {  // eslint-disable-line
      const [, key, value] = m;
      parsed[key] = value;
    }
  }
  if (textOptions.timestampPattern) {
    // /^(.{25})/
    const ts = lineObject.line.match(textOptions.timestampPattern);
    if (ts) {
      parsed._message = lineObject.line
        .replace(textOptions.timestampPattern, '')
        .trimLeft();
      parsed._ts = ts[0]; // eslint-disable-line
    } else {
      parsed._message = lineObject.line;
    }
  } else {
    parsed._message = lineObject.line;
  }
  return {
    ...lineObject,
    ...parsed,
  };
};

module.exports = { parseJson, parsePlainText };
