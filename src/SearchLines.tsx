import React, { useState, useCallback, useEffect } from 'react';

import { ipcRenderer } from 'electron';
import { useFileContext } from './FileStateProvider';
import Lines from './Lines';
import { parseLineSpec, mergeLines } from './utils';

import type { LineT } from './types';

type SearchLinesProps = {
  height: number;
};
type CacheT = {
  file: string;
  filter: any;
  start: number;
  bufferSize: number;
  lines: LineT[];
};

const SearchLines = React.forwardRef<any, SearchLinesProps>(
  ({ height }, ref) => {
    const { state: fileState, dispatch } = useFileContext();
    const {
      parserOptions,
      file,
      filter,
      filterView,
      selectedLines,
    } = fileState;
    const [searchLine, setSearchLine] = useState(0);
    const [cache, setCache] = useState<CacheT | null>(null);

    console.log('Search line ', filter.query, searchLine);

    const handleLineClick = (line) => {
      dispatch({
        type: 'goto',
        lineSpec: line.lineNo - 5,
        activate: line.lineNo,
      });
    };

    useEffect(() => {
      const scan = async () => {
        if (!filter.query.trim()) {
          return;
        }
        const scanResults = await ipcRenderer.invoke(
          'search-scan',
          file.path,
          filter,
          parserOptions
        ); // { resultCount }
        dispatch({
          type: 'search-scan',
          filterResultCount: scanResults.resultCount,
        });
      };
      scan();
    }, [file.path, filter, parserOptions, dispatch, filterView.showBookmarks]);

    const loadLines = useCallback(
      async (start, bufferSize) => {
        console.log('RERE', fileState.filterResultCount);
        if (!filterView.showSearchResults) {
          return {
            lines: [...selectedLines].splice(
              start,
              Math.min(bufferSize, selectedLines.length)
            ),
            offset: start,
          };
        }
        let lines: LineT[];
        const extraLine = start > 0 ? 1 : 0;
        if (!filter.query.trim() || fileState.filterResultCount === 0) {
          lines = [];
        } else if (
          cache &&
          cache.file === file.path &&
          cache.filter === filter &&
          cache.start === start - extraLine &&
          cache.bufferSize === bufferSize
        ) {
          console.log('using search cache');
          lines = cache.lines;
        } else {
          console.log('loading buffer ', filter.query, start, bufferSize);
          const expectedBufferSize = Math.min(
            bufferSize,
            fileState.filterResultCount - start + extraLine
          ); // on the last page we only need to scan until we find all remaining matches
          const { lines: loadedLines } = await ipcRenderer.invoke(
            'search-buffer',
            file.path,
            filter,
            start - extraLine,
            expectedBufferSize,
            parserOptions
          );
          lines = loadedLines;
          setCache({
            lines: loadedLines,
            file: file.path!,
            filter,
            start: start - extraLine,
            bufferSize,
          });
        }
        if (filterView.showBookmarks) {
          const merged = mergeLines(
            lines,
            selectedLines,
            fileState.filterResultCount
          );
          return {
            lines: merged.slice(extraLine, merged.length),
            offset: start,
          };
        }
        return { lines: lines.slice(extraLine, lines.length), offset: start };
      },
      [
        file.path,
        filter,
        filterView,
        selectedLines,
        fileState.filterResultCount,
        parserOptions,
        cache,
        setCache,
      ]
    );

    const gotoLine = useCallback(
      (lineSpec) => {
        const lineNo = parseLineSpec(
          lineSpec,
          fileState.filterResultCount,
          searchLine
        );
        setSearchLine(lineNo);
      },
      [setSearchLine, fileState.filterResultCount, searchLine]
    );

    // useCallback is necessary on all passed in functions to prevent re-rendering <Lines> without need
    const filterQueryId = `${filter.query}-${filter.matchCase}`;
    const filterViewId = `${filterView.showBookmarks}-${filterView.showSearchResults}`;
    return (
      <Lines
        ref2={ref}
        id={`search:${filterQueryId}-${filterViewId}-${selectedLines.length}`}
        height={height}
        loadLines={loadLines}
        currentLine={searchLine}
        gotoLine={gotoLine}
        lineCount={
        filterView.showSearchResults // eslint-disable-line
            ? Math.max(fileState.filterResultCount, selectedLines.length)
            : filterView.showBookmarks
            ? selectedLines.length
            : 0
        }
        onLineClick={handleLineClick}
      />
    );
  }
);

export default SearchLines;
