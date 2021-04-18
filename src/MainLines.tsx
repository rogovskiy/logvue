import React, { useCallback } from "react";

import { useFileContext } from "./FileStateProvider";
import Lines from "./Lines";

import { ipcRenderer} from 'electron';

const MainLines = React.forwardRef(({ height }, ref) => {
  const { state: fileState, dispatch } = useFileContext();
  const { options, file } = fileState;

  const loadLines = useCallback(
    async (start, bufferSize) => {
      return await ipcRenderer.invoke("load-buffer", file.path, start, bufferSize, {
        textFormat: options.textFormat,
        jsonOptions: options.jsonOptions,
        textOptions: options.textOptions,
        encoding: options.encoding,
      }); // { lines, offset }
    },
    [file.path, options]
  );
  const gotoLine = useCallback(
    (lineSpec) => {
      dispatch({ type: "goto", lineSpec });
    },
    [dispatch]
  );
  const activateLine = useCallback(
    (line) => {
      dispatch({ type: "activate-line", lineNo: line.lineNo });
    },
    [dispatch]
  );
  // useCallback is necessary on all passed in functions to prevent re-rendering <Lines> without need
  return (
    <Lines
      ref2={ref}
      id={file.path}
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
