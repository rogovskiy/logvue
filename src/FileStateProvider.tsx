import React, { useContext, createContext, useReducer } from "react";

import { parseLineSpec } from "./utils";

const DEFAULT_OPTIONS = {
  showLineNumber: false,
  showTimestamp: "short",
  textFormat: "json",
  jsonOptions: { message: "message", timestamp: "@timestamp" },
  textOptions: { timestampPattern: null, extractKeyValue: true },
  encoding: "utf8",
  bufferSize: 1000,
};

const initialState = {
  file: {
    path: null,
    fileSize: null,
    currentLine: 0, // top line of the viewable area
    lineCount: 0,
  },
  filter: {
    query: "",
  },
  activeLine: null,
  filterView: {
    showBookmarks: true,
    showSearchResults: true,
  },
  filterResultCount: 0,
  selectedLines: [],
  options: DEFAULT_OPTIONS,
};

const FileContext = createContext(initialState);
const { Provider } = FileContext;

const reducer = (state, action) => {
  console.log("dispatch", action);
  switch (action.type) {
    case "file-opened":
      return {
        ...initialState,
        file: {
          ...state.file,
          lineCount: action.lineCount,
        },
      };
    case "goto":
      const lineNo = parseLineSpec(action.lineSpec, state.file.lineCount, state.file.currentLine);
      if (action.activate) {
        return {
          ...state,
          activeLine: action.activate,
          file: { ...state.file, currentLine: lineNo },
        };
      } else {
        return {
          ...state,
          file: { ...state.file, currentLine: lineNo },
        };
      }
    case "activate-line":
      return {
        ...state,
        activeLine: action.lineNo,
      };
    case "file-loaded":
      return {
        ...initialState,
        file: { path: action.path, fileSize: action.fileSize, currentLine: 0 },
      };
    case "update-options":
      return {
        ...state,
        options: { ...state.options, ...action.updates },
      };
    case "set-filter":
      return {
        ...state,
        filter: action.filter,
        filterResultCount: 0,
      };
    case "search-scan":
      return {
        ...state,
        filterResultCount: action.filterResultCount,
      };
    case "update-filter-view": {
      return {
        ...state,
        filterView: action.filterView,
      };
    }
    case "select-line":
      let newSelectedLines;
      if (action.selected) {
        newSelectedLines = state.selectedLines.concat([action.line]).sort((a, b) => a.lineNo - b.lineNo);
      } else {
        newSelectedLines = state.selectedLines.filter((l) => l.lineNo !== action.line.lineNo);
      }
      return {
        ...state,
        selectedLines: newSelectedLines,
      };
    default:
      throw new Error();
  }
};

const FileStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

const useFileContext = () => {
  return useContext(FileContext);
};

export { FileStateProvider, useFileContext, FileContext };
