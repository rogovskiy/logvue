/* eslint no-continue: off */
export const parseLineSpec = (spec, lineCount, currentLine) => {
  let result;
  if (spec[0] === '+') {
    result = currentLine + parseInt(spec.substring(1), 10);
  } else if (spec[0] === '-') {
    result = currentLine - parseInt(spec.substring(1), 10);
  } else {
    result = parseInt(spec, 10);
  }
  if (result < 0) {
    result = 0;
  }
  if (lineCount > 0 && result >= lineCount) {
    result = lineCount - 1;
  }
  return result;
};

export const mergeLines = (search, marks, searchCount) => {
  if (search.length === 0) {
    return marks;
  }
  if (marks.length === 0) {
    return search;
  }
  const marksFirst = search[0].searchLine === 0 ? 0 : search[0].lineNo;
  const marksEnd =
    search[search.length - 1].searchLine === searchCount - 1
      ? marks[marks.length - 1].lineNo
      : search[search.length - 1].lineNo;
  const result = [];
  let mi = 0;
  let si = 0;
  // console.log("mark  ", marksFirst, marksEnd, search)

  while (mi < marks.length || si < search.length) {
    const markLine = mi < marks.length ? marks[mi] : null;
    const searchLine = si < search.length ? search[si] : null;
    // console.log("indx ", mi, si)
    if (markLine && markLine.lineNo < marksFirst) {
      mi += 1;
      continue;
    }
    if (markLine && markLine.lineNo > marksEnd) {
      mi = marks.length;
      continue;
    }
    if (searchLine === null && markLine === null) {
      break;
    }
    if (
      searchLine == null ||
      (markLine && markLine.lineNo < searchLine.lineNo)
    ) {
      // console.log("mi ", mi, si)
      result.push({
        ...markLine,
        searchLine: search[si > 0 ? si - 1 : 0].searchLine,
      });
      mi += 1;
    } else {
      result.push(searchLine);
      if (markLine && markLine.lineNo === searchLine.lineNo) {
        mi += 1;
      }
      si += 1;
    }
  }
  return result;
};
