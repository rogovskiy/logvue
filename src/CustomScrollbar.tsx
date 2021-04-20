import React, { useRef } from 'react';

type CustomScrollbarProps = {
  height: number;
  handleSize: number;
  lineCount: number;
  currentLine: number;
  gotoLine: any;
};
const CustomScrollbar = ({
  height,
  handleSize,
  lineCount,
  currentLine,
  gotoLine,
}: CustomScrollbarProps) => {
  const bar = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const position = (currentLine * (height - handleSize)) / lineCount;

  const handleColor = '#e0e1e2';

  const setNewPosition = (newPosition) => {
    const scaledValue = Math.round(
      (lineCount * newPosition) / (height - handleSize)
    );
    // console.log("scrolled ", scaledValue.toString())
    gotoLine(scaledValue.toString());
  };

  const handleClick = (e) => {
    const y = e.clientY;
    const { top } = bar.current!.getBoundingClientRect();
    setNewPosition(y - top);
  };

  const handleWheel = (e) => {
    let newPosition = position + e.deltaY;
    if (newPosition < 0) {
      newPosition = 0;
    }
    if (newPosition >= height) {
      newPosition = height;
    }
    setNewPosition(newPosition);
  };

  const startDrag = (startDragEvent) => {
    if (!handle.current) {
      return;
    }
    const y = startDragEvent.clientY;
    // TODO the handle jumps a bit down when it is released after drag.
    handle.current.style.backgroundColor = 'gray';
    const mouseMoveHandler = (e) => {
      // move the handle visually
      // display tooltip in the future
      const newPosition = position + (e.clientY - y);
      let adjustedPos =
        newPosition < height - handleSize ? newPosition : height - handleSize;
      if (adjustedPos < 0) {
        adjustedPos = 0;
      }

      handle.current!.style.top = `${adjustedPos}px`;
    };
    const mouseUpHandler = (e) => {
      const newPosition = position + (e.clientY - y);
      let adjustedPos =
        newPosition < height - handleSize ? newPosition : height - handleSize;
      if (adjustedPos < 0) {
        adjustedPos = 0;
      }
      setNewPosition(adjustedPos);

      handle.current!.style.backgroundColor = handleColor;
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const adjustedPos =
    position < height - handleSize ? position : height - handleSize;

  const barStyle: React.CSSProperties = {
    float: 'right',
    width: '0.7em',
    backgroundColor: '#f0f0f0',
    height: `${height}px`,
  };
  const handleStyle: React.CSSProperties = {
    borderRadius: '0.2em',
    cursor: 'pointer',
    position: 'relative',
    top: `${adjustedPos}px`,
    height: `${handleSize}px`,
    backgroundColor: handleColor,
  };

  return (
    <div // eslint-disable-line
      ref={bar}
      style={barStyle}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={startDrag}
    >
      <div ref={handle} style={handleStyle}>
        &nbsp;
      </div>
    </div>
  );
};

export default CustomScrollbar;
