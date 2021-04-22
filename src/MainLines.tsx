import React, { useCallback } from 'react';

import { ipcRenderer } from 'electron';
import { useFileContext } from './FileStateProvider';
import Lines from './Lines';

type MainLinesProps = {
  height: number;
};

const MainLines = React.forwardRef<any, MainLinesProps>(({ height }, ref) => {
  const { state: fileState, dispatch } = useFileContext();
  const { parserOptions, file } = fileState;

  const loadLines = useCallback(
    async (start, bufferSize) => {
      return ipcRenderer.invoke(
        'load-buffer',
        file.path,
        start,
        bufferSize,
        parserOptions
      ); // { lines, offset }
    },
    [file.path, parserOptions]
  );
  const gotoLine = useCallback(
    (lineSpec) => {
      dispatch({ type: 'goto', lineSpec });
    },
    [dispatch]
  );
  const activateLine = useCallback(
    (line) => {
      dispatch({ type: 'activate-line', lineNo: line.lineNo });
    },
    [dispatch]
  );
  // useCallback is necessary on all passed in functions to prevent re-rendering <Lines> without need
  return (
    <Lines
      ref2={ref}
      id={file.path!}
      height={height}
      loadLines={loadLines}
      currentLine={file.currentLine}
      gotoLine={gotoLine}
      lineCount={file.lineCount}
      onLineClick={activateLine}
    />
  );
});

export default MainLines;
