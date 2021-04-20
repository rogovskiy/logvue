import React, { FunctionComponent } from 'react';
import throttle from 'lodash.throttle';
import CustomScrollbar from './CustomScrollbar';
import LineSelector from './LineSelector';

import { FileContext } from './FileStateProvider';

import type { LineT, ShowTimestampOptionT } from './types';

const HANDLE_SIZE = 20; // TODO this needs to be dynamic
const EMPTY_BUFFER = { lines: null, offset: 0 };

type LineBufferProps = {
  tableRef: React.RefObject<HTMLTableElement>;
  height: number;
  lines: LineT[] | null;
  showTimestamp: ShowTimestampOptionT;
  showLineNumber: boolean;
  selectedLines: LineT[];
  onLineClick: any;
  dispatch: React.Dispatch<any>;
  activeLine: number | null;
  lineCount: number;
};

const LineBuffer: FunctionComponent<LineBufferProps> = React.memo(
  ({
    tableRef,
    height,
    lines,
    showTimestamp,
    showLineNumber,
    selectedLines,
    onLineClick,
    dispatch,
    activeLine,
    lineCount,
  }) => {
    const formatTimestamp = (value) => {
      if (showTimestamp === 'short' && value) {
        const d = new Date(value).toISOString();
        return d.substring(11, 23);
      }
      return value;
    };

    const isLineSelected = (l) => {
      return !!selectedLines.find((o) => o.lineNo === l.lineNo);
    };

    const toggleLine = (line, selected) => {
      dispatch({ type: 'select-line', line, selected });
    };

    console.log('LINEBUFFER RENDER ');
    const colspan = showLineNumber ? 4 : 3;
    const lastLine = lines ? lines[lines.length - 1] : null;
    const lastLineNo = lastLine // eslint-disable-line
      ? lastLine.searchLine
        ? lastLine.searchLine
        : lastLine.lineNo
      : null;
    console.log('last line', lastLine, lastLineNo, lineCount);
    return (
      <div style={{ height: `${height}px`, overflowY: 'hidden' }}>
        <table
          ref={tableRef}
          width="100%"
          style={{ borderCollapse: 'separate', borderSpacing: '0 1px' }}
        >
          <tbody>
            {lines &&
              lines.map((l) => (
                <tr
                  key={l.lineNo}
                  onClick={() => onLineClick(l)}
                  className={activeLine === l.lineNo ? 'selected' : ''}
                >
                  <td className="rowheading">
                    <LineSelector
                      size={19}
                      selected={isLineSelected(l)}
                      onChange={(selected) => toggleLine(l, selected)}
                    />
                  </td>
                  {showLineNumber && <td className="rowheading">{l.lineNo}</td>}
                  {showTimestamp !== 'none' && (
                    <td className="rowheading">{formatTimestamp(l._ts)}</td>
                  )}
                  <td style={{ whiteSpace: 'pre', width: '100%' }}>
                    {l._message}
                  </td>
                </tr>
              ))}
            {lines && lastLineNo === lineCount - 1 && (
              <tr>
                <td
                  className="rowheading"
                  style={{ textAlign: 'center' }}
                  colSpan={colspan}
                >
                  End of file
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  },
  (a, b) => {
    // console.log("MEMO", a.height === b.height, a.lines === b.lines, a.showTimestamp === b.showTimestamp, a.showLineNumber === b.showLineNumber, a.selectedLines === b.selectedLines);
    const same =
      a.height === b.height &&
      a.lines === b.lines &&
      a.showTimestamp === b.showTimestamp &&
      a.showLineNumber === b.showLineNumber &&
      a.selectedLines === b.selectedLines &&
      a.activeLine === b.activeLine;
    return same;
  }
);

type LinesProps = {
  id: string;
  gotoLine: any;
  currentLine: number;
  height: number;
  lineCount: number;
  ref2: React.ForwardedRef<any>;
  loadLines: any;
  onLineClick: any;
};
type LinesState = {
  buffer: {
    lines: LineT[] | null;
    offset: number;
  };
};
declare global {
  interface Window {
    focused?: string;
  }
}

// Renders a scrollable buffer of lines. This component uses DOM events to allow scrolling within the buffer without leveraging of
// the React functionality. The buffer refresh is handled by React render.
// const RefLines = React.forwardRef((props, ref) => {
class Lines extends React.Component<LinesProps, LinesState> {
  private tableRef = React.createRef<HTMLTableElement>();

  constructor(props) {
    super(props);

    console.log('CONST', this.props.id, props);
    console.log('===========');
    console.log('===========');
    console.log('===========');
    console.log('===========');
    console.log('===========');
    console.log('===========');
    console.log('===========');

    this.state = {
      buffer: EMPTY_BUFFER,
    };

    this.handleKeys = this.handleKeys.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.repositionTheScroll = this.repositionTheScroll.bind(this);
    this.throttledLoadBuffer = this.throttledLoadBuffer.bind(this);
    this.ensureBuffersLoaded = this.ensureBuffersLoaded.bind(this);

    this.gotoLine = this.gotoLine.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  gotoLine = (lineSpec) => {
    this.props.gotoLine(lineSpec);
  };

  dispatch = (action) => {
    this.context.dispatch(action);
  };

  handleKeys = (e) => {
    if (e._myCustomBubbleStopper) {
      return;
    }
    if (window.focused !== this.props.id) {
      return;
    }
    const pageSize = 20;
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      this.gotoLine('0');
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      this.gotoLine(Number.MAX_SAFE_INTEGER.toString());
    } else if (e.key === 'ArrowUp') {
      this.gotoLine('-1');
    } else if (e.key === 'ArrowDown') {
      this.gotoLine('+1');
    } else if (e.key === 'PageDown') {
      this.gotoLine(`+${pageSize}`);
    } else if (e.key === 'PageUp') {
      this.gotoLine(`-${pageSize}`);
    }
  };

  handleWheel = (event) => {
    // console.log("wheel", event.deltaY, this.props.currentLine, this.props.lineCount)
    const element = this.props.ref2 as React.MutableRefObject<any>;
    const rect = element.current.getBoundingClientRect();
    // console.log("EV ", event.clientX, event.clientY, rect)
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      // console.log("wheeling in ", id)
      const deltaLines = event.deltaY;
      if (deltaLines >= -0.5 && deltaLines <= 0.5) return;
      let deltaLinesSpec;
      if (deltaLines > 0) {
        deltaLinesSpec = `+${deltaLines}`;
      } else {
        deltaLinesSpec = `${deltaLines}`;
      }
      window.focused = this.props.id;
      this.gotoLine(deltaLinesSpec);
    }
  };

  componentDidMount() {
    console.log('DID MOUNT', this.props.id);
    document.addEventListener('keydown', this.handleKeys);
    document.addEventListener('wheel', this.handleWheel);

    this.ensureBuffersLoaded(this.props.currentLine);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeys);
    document.removeEventListener('wheel', this.handleWheel);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const updated =
      nextProps.id !== this.props.id ||
      nextProps.height !== this.props.height ||
      nextProps.lineCount !== this.props.lineCount ||
      nextState.buffer !== this.state.buffer ||
      nextProps.currentLine !== this.props.currentLine;

    if (!updated && nextProps.currentLine !== this.props.currentLine) {
      this.ensureBuffersLoaded(nextProps.currentLine);
      // if (nextProps.currentLine < offset) {
      //   return;
      // }
      setTimeout(() => {
        this.repositionTheScroll();
      }, 0);
    }
    console.log('should update', this.props.id, updated);
    return updated;
  }

  componentDidUpdate(prevProps, _prevState) {
    console.log('didUpdate', this.props.id);
    let selectionChangedInSearch = false;
    if (this.props.id.indexOf('search') === 0) {
      // when selected lines change we don't need to refresh
      const beforeId = prevProps.id.substring(0, prevProps.id.lastIndexOf('-'));
      const afterId = this.props.id.substring(
        0,
        this.props.id.lastIndexOf('-')
      );
      selectionChangedInSearch = beforeId === afterId;
    }
    if (
      prevProps.id !== this.props.id ||
      prevProps.loadLines !== this.props.loadLines
    ) {
      console.log('Source changed, restart', this.props.id);
      this.setState({ buffer: EMPTY_BUFFER }); // eslint-disable-line
      if (!selectionChangedInSearch) {
        this.gotoLine(0);
      }
    }
    this.ensureBuffersLoaded(this.props.currentLine);

    const { offset } = this.state.buffer;
    if (this.props.currentLine < offset) {
      return; // this is a misque , when setCurrentLine useEffect triggers we have bad render attempt
    }
    setTimeout(() => {
      this.repositionTheScroll();
    }, 0);
  }

  repositionTheScroll() {
    if (!this.tableRef.current || !this.tableRef.current.parentElement) {
      return;
    }
    const { lines, offset } = this.state.buffer;

    const bufferOffset = this.props.currentLine - offset;
    const rows = this.tableRef.current.getElementsByTagName('tr');
    // console.log("rows", rows.length)
    if (!rows || bufferOffset >= rows.length) return;
    // console.log("Offset", bufferOffset, rows[bufferOffset].offsetTop);
    // in the bottom of the view when we set scrollTo to the value too high , the browser ignores it
    const originalScrollTop = this.tableRef.current.parentElement.scrollTop;
    // console.log("Orig", originalScrollTop);
    let adjustment = 0;
    do {
      // if (adjustment > 0) {
      //   debugger;
      // }
      const rowOffset = rows[bufferOffset - adjustment++].offsetTop; // eslint-disable-line
      if (rowOffset === originalScrollTop) {
        break;
      }
      this.tableRef.current.parentElement.scrollTop = rowOffset;
      // console.log("updated ", this.tableRef.current.parentElement.scrollTop)
    } while (
      this.tableRef.current.parentElement.scrollTop === originalScrollTop &&
      bufferOffset > adjustment
    );
    if (adjustment > 1) {
      // this is the bottom of the file
      console.log('bottom of the file adjustment', adjustment - 1);
      // debugger;
      this.gotoLine(`-${adjustment - 1}`);
      const lastBlock =
        this.props.currentLine + lines!.length >= this.props.lineCount;
      if (!lastBlock) {
        console.log(
          'bottom of the buffer, need to move',
          this.props.currentLine
        );
        this.throttledLoadBuffer(this.props.currentLine, 0.1);
      }
    }
  }

  ensureBuffersLoaded = (currentLine) => {
    if (currentLine < 0) {
      throw new Error('Negative line number');
    }
    const { lines, offset } = this.state.buffer;
    const scanComplated = this.props.lineCount > 0;
    const bufferNotLoaded = lines === null;
    const isInBuffer = (lineNo) => {
      return lineNo >= offset && lineNo < offset + lines!.length;
    };

    // const scrollToBottomOfBuffer = () => {
    //   const pageSize = 20;
    //   gotoLine(offset + lines.length - pageSize).toString());
    // };
    // const scrollToTopOfBuffer = () => {
    //   gotoLine(offset.toString());
    // };

    // only loading the buffer when the scan is complete
    if (scanComplated && (bufferNotLoaded || !isInBuffer(currentLine))) {
      console.log(
        'currentLine is not in buffer',
        currentLine,
        offset,
        lines ? lines.length : 0
      );
      // if (currentLine >= offset + lines.length) {
      //   scrollToBottomOfBuffer();
      // } else {
      //   scrollToTopOfBuffer();
      // }
      this.throttledLoadBuffer(currentLine, 0.5);
    }
  };

  throttledLoadBuffer = throttle(async (lineNo, overlap) => {
    const { bufferSize } = this.context.state.options;
    const start = Math.max(0, lineNo - bufferSize * overlap);
    console.log(`Loading buffer from ${start}`);
    const results = await this.props.loadLines(start, bufferSize);
    console.log(`Loading buffer from ${start} done`);
    this.setState({ buffer: results });
    this.gotoLine(lineNo);
  }, 500);

  render() {
    console.log(
      'Lines Render ',
      this.props.id,
      'line=',
      this.props.currentLine
    );
    const { lines } = this.state.buffer;
    const { options } = this.context.state;
    const { showLineNumber, showTimestamp } = options;

    return (
      <div // eslint-disable-line
        ref={this.props.ref2}
        onClick={() => {
          window.focused = this.props.id;
        }}
      >
        <CustomScrollbar
          height={this.props.height}
          handleSize={HANDLE_SIZE}
          lineCount={this.props.lineCount}
          currentLine={this.props.currentLine}
          gotoLine={this.gotoLine}
        />
        <LineBuffer
          dispatch={this.context.dispatch}
          tableRef={this.tableRef}
          height={this.props.height}
          lines={lines}
          showTimestamp={showTimestamp}
          showLineNumber={showLineNumber}
          selectedLines={this.context.state.selectedLines}
          onLineClick={this.props.onLineClick}
          lineCount={this.props.lineCount}
          activeLine={this.context.state.activeLine}
        />
      </div>
    );
  }
}

Lines.contextType = FileContext;

export default Lines;
