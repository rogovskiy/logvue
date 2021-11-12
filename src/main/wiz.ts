import { SuggestionT } from '../types';

const jsonOptions = (lines: string[]): SuggestionT => {
  const fields = new Map<string, string[]>();
  lines.forEach((l) => {
    try {
      const obj = JSON.parse(l);
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(obj)) {
        const values = fields[key] || [];
        values.push(value);
        fields[key] = values;
      }
    } catch (e) {
      // ignore
    }
  });

  const messageCandidates = ['message', 'msg', '@message'];
  const timestampCandidates = ['ts', '@timestamp', 'timestamp', 'time'];

  const messageField = messageCandidates.find((c) => fields[c]);
  const timeStampField = timestampCandidates.find((c) => fields[c]);

  return {
    textFormat: 'json',
    jsonOptions: {
      message: messageField || null,
      timestamp: timeStampField || null,
      fields: Object.keys(fields),
    },
  };
};

const textOptions = (_lines: string[]): SuggestionT => {
  return { textFormat: 'text', textOptions: {} };
};

const guessFormat = (subset: string[]) => {
  let errors = 0;
  subset.forEach((l) => {
    try {
      JSON.parse(l);
    } catch (e) {
      errors += 1;
    }
  });
  if ((100 * errors) / subset.length < 40) {
    return jsonOptions(subset);
  }
  return textOptions(subset);
};

export default guessFormat;
