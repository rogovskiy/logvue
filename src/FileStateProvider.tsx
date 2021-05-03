import React, { useContext, createContext, useReducer } from 'react';

import { parseLineSpec } from './utils';
import type {
  LineT,
  ShowTimestampOptionT,
  FilterT,
  ParserOptionsT,
} from './types';

export type StateT = {
  file: {
    path: string | null;
    fileSize: number | null;
    currentLine: number;
    lineCount: number;
  };
  filter: FilterT;
  activeLine: number | null;
  filterView: {
    showBookmarks: boolean;
    showSearchResults: boolean;
  };
  filterResultCount: number;
  selectedLines: LineT[];
  viewOptions: ViewerOptionsT;
  parserOptions: ParserOptionsT;
};

export type ViewerOptionsT = {
  showLineNumber: boolean;
  showTimestamp: ShowTimestampOptionT;
  showHistogram: boolean;
};

const DEFAULT_VIEW_OPTIONS: ViewerOptionsT = {
  showLineNumber: false,
  showTimestamp: 'short',
  showHistogram: true,
};

const DEFAULT_PARSER_OPTIONS: ParserOptionsT = {
  textFormat: 'json',
  jsonOptions: { message: 'message', timestamp: '@timestamp' },
  textOptions: { extractKeyValue: true, timestampPattern: '^(.{25})' },
  encoding: 'utf-8',
  bufferSize: 1000,
  dateFormat: 'ISO',
};

const initialState: StateT = {
  file: {
    path: null,
    fileSize: null,
    currentLine: 0, // top line of the viewable area
    lineCount: 0,
  },
  filter: {
    query: '',
    matchCase: false,
  },
  activeLine: null,
  filterView: {
    showBookmarks: true,
    showSearchResults: true,
  },
  filterResultCount: 0,
  selectedLines: [],
  viewOptions: DEFAULT_VIEW_OPTIONS,
  parserOptions: DEFAULT_PARSER_OPTIONS,
};

const FileContext = createContext<{
  state: StateT;
  dispatch: React.Dispatch<any>;
}>({
  state: initialState,
  dispatch: () => null,
});
const { Provider } = FileContext;

const reducer = (state: StateT, action: any): StateT => {
  console.log('dispatch', action);
  switch (action.type) {
    case 'file-opened':
      return {
        ...initialState,
        parserOptions: state.parserOptions,
        viewOptions: state.viewOptions,
        file: {
          ...state.file,
          lineCount: action.lineCount,
        },
      };
    case 'goto': {
      const lineNo = parseLineSpec(
        action.lineSpec,
        state.file.lineCount,
        state.file.currentLine
      );
      if (action.activate) {
        return {
          ...state,
          activeLine: action.activate,
          file: { ...state.file, currentLine: lineNo },
        };
      }
      return {
        ...state,
        file: { ...state.file, currentLine: lineNo },
      };
    }
    case 'activate-line':
      return {
        ...state,
        activeLine: action.lineNo,
      };
    case 'file-loaded':
      return {
        ...initialState,
        file: {
          path: action.path,
          fileSize: action.fileSize,
          currentLine: 0,
          lineCount: 0,
        },
      };
    case 'update-view-options':
      return {
        ...state,
        viewOptions: { ...state.viewOptions, ...action.updates },
      };
    case 'update-parser-options':
      console.log('NEEW', {
        ...state,
        parserOptions: { ...state.parserOptions, ...action.updates },
      });
      return {
        ...state,
        parserOptions: { ...state.parserOptions, ...action.updates },
      };
    case 'set-filter':
      return {
        ...state,
        filter: action.filter,
        filterResultCount: 0,
      };
    case 'search-scan':
      return {
        ...state,
        filterResultCount: action.filterResultCount,
      };
    case 'update-filter-view': {
      return {
        ...state,
        filterView: action.filterView,
      };
    }
    case 'select-line': {
      let newSelectedLines;
      if (action.selected) {
        newSelectedLines = state.selectedLines
          .concat([action.line])
          .sort((a, b) => a.lineNo - b.lineNo);
      } else {
        newSelectedLines = state.selectedLines.filter(
          (l) => l.lineNo !== action.line.lineNo
        );
      }
      return {
        ...state,
        selectedLines: newSelectedLines,
      };
    }
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
