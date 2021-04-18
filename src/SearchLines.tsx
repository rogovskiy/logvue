import React, { useState, useCallback, useEffect } from "react";

import { useFileContext } from "./FileStateProvider";
import Lines from "./Lines";
import { parseLineSpec, mergeLines } from "./utils.js";

import { ipcRenderer} from 'electron';

const SearchLines = React.forwardRef(({ height }, ref) => {
  const { state: fileState, dispatch } = useFileContext();
  const { options, file, filter, filterView, selectedLines } = fileState;
  const [searchLine, setSearchLine] = useState(0);
  const [cache, setCache] = useState(null);

  console.log("Search line ", filter.query, searchLine);

  const handleLineClick = (line) => {
    dispatch({ type: "goto", lineSpec: line.lineNo - 5, activate: line.lineNo });
  };

  useEffect(() => {
    const scan = async () => {
      if (!filter.query.trim()) {
        return;
      }
      const scanResults = await ipcRenderer.invoke("search-scan", file.path, filter, {
        textFormat: options.textFormat,
        jsonOptions: options.jsonOptions,
        textOptions: options.textOptions,
        encoding: options.encoding,
      }); // { resultCount }
      dispatch({ type: "search-scan", filterResultCount: scanResults.resultCount });
    };
    scan();
  }, [
    file.path,
    filter,
    options.textFormat,
    options.jsonOptions,
    options.encoding,
    options.textOptions,
    dispatch,
    filterView.showBookmarks,
  ]);

  const loadLines = useCallback(
    async (start, bufferSize) => {
      console.log("RERE", fileState.filterResultCount);
      if (!filterView.showSearchResults) {
        return {
          lines: [...selectedLines].splice(start, Math.min(bufferSize, selectedLines.length)),
          offset: start,
        };
      }
      let lines;
      const extraLine = start > 0 ? 1 : 0;
      if (!filter.query.trim() || fileState.filterResultCount === 0) {
        lines = [];
      } else {
        if (
          cache &&
          cache.file === file.path &&
          cache.filter === filter &&
          cache.start === start - extraLine &&
          cache.bufferSize === bufferSize
        ) {
          console.log("using search cache");
          lines = cache.lines;
        } else {
          console.log("loading buffer ", filter.query, start, bufferSize);
          const expectedBufferSize = Math.min(bufferSize, fileState.filterResultCount - start + extraLine); // on the last page we only need to scan until we find all remaining matches
          const { lines: loadedLines } = await ipcRenderer.invoke(
            "search-buffer",
            file.path,
            filter,
            start - extraLine,
            expectedBufferSize,
            {
              textFormat: options.textFormat,
              jsonOptions: options.jsonOptions,
              textOptions: options.textOptions,
              encoding: options.encoding,
            }
          );
          lines = loadedLines;
          setCache({
            lines: loadedLines,
            file: file.path,
            filter: filter,
            start: start - extraLine,
            bufferSize: bufferSize,
          });
        }
      }
      if (filterView.showBookmarks) {
        const merged = mergeLines(lines, selectedLines, fileState.filterResultCount);
        return {
          lines: merged.slice(extraLine, merged.length),
          offset: start,
        };
      } else {
        return { lines: lines.slice(extraLine, lines.length), offset: start };
      }
    },
    [file.path, filter, filterView, selectedLines, fileState.filterResultCount, options, cache, setCache]
  );

  const gotoLine = useCallback(
    (lineSpec) => {
      const lineNo = parseLineSpec(lineSpec, fileState.filterResultCount, searchLine);
      setSearchLine(lineNo);
    },
    [setSearchLine, fileState.filterResultCount, searchLine]
  );

  // useCallback is necessary on all passed in functions to prevent re-rendering <Lines> without need
  return (
    <Lines
      ref2={ref}
      id={
        "search:" +
        filter.query +
        "-" +
        filterView.showBookmarks +
        "-" +
        filterView.showSearchResults +
        "-" +
        selectedLines.length
      }
      height={height}
      loadLines={loadLines}
      currentLine={searchLine}
      gotoLine={gotoLine}
      lineCount={
        filterView.showSearchResults
          ? Math.max(fileState.filterResultCount, selectedLines.length)
          : filterView.showBookmarks
          ? selectedLines.length
          : 0
      }
      onLineClick={handleLineClick}
    />
  );
});

export default SearchLines;
