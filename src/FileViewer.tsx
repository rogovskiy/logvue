import React, { useEffect, useState, useCallback, useRef } from "react";
import MainLines from "./MainLines";
import SearchLines from "./SearchLines";
import FilterControls from "./FilterControls";

import SplitPane from "react-split-pane";
import Pane from "react-split-pane";

import { useFileContext } from "./FileStateProvider";

import { ipcRenderer} from 'electron';

const FileViewer = () => {
  const { state: fileState, dispatch } = useFileContext();
  const { file, options } = fileState;

  const [heights, setHeights] = useState({ resizer: "75%", main: -1, search: -1 });
  const mainRef = useRef();
  const searchRef = useRef();
  const interval = useRef(null);

  console.log("file view render");

  useEffect(() => {
    const scanFile = async () => {
      const newBuffer = await ipcRenderer.invoke("open-file", file.path, options.bufferSize, {
        encoding: options.encoding,
      });
      dispatch({ type: "file-opened", lineCount: newBuffer.lineCount });
    };
    scanFile();
  }, [file.path, dispatch, options.encoding, options.bufferSize]);

  const updateHeights = useCallback(
    (optionalResizer) => {
      const searchPane = searchRef.current ? searchRef.current.parentElement.parentElement.parentElement : -1;
      // search lines area gets squished if there are no results
      const searchAndFilter = searchRef.current ? searchRef.current.parentElement.parentElement : -1;
      const newHeights = {
        main: mainRef.current ? mainRef.current.parentElement.clientHeight : -1,
        search: searchRef.current
          ? searchPane.clientHeight - searchAndFilter.clientHeight + searchRef.current.parentElement.clientHeight
          : -1,
        resizer: optionalResizer || heights.resizer,
      };
      if (heights.main !== newHeights.main || heights.search !== newHeights.search) {
        console.log("check height", newHeights);
        setHeights(newHeights); // TODO use functional setState()
      }
    },
    [mainRef, searchRef, setHeights, heights]
  );

  useEffect(() => {
    interval.current = setInterval(updateHeights, 1000);
    return () => {
      clearInterval(interval.current);
    };
  }, [updateHeights, interval]);

  const panelsResized = (sizes) => {
    updateHeights(sizes[0]);
  };

  return (
    <div className="FullHeight" style={{ top: "45px" }}>
      <SplitPane
        split="horizontal"
        onResizeEnd={panelsResized}
        onResizeStart={() => {
          const currentInterval = interval.current;
          if (currentInterval) clearInterval(currentInterval);
        }}
      >
        <Pane initialSize={heights.resizer}>
          <MainLines ref={mainRef} height={heights.main} />
        </Pane>
        <Pane>
          <div>
            <FilterControls />
            <div>
              {" "}
              {/* extra div is needed for correct height calculation */}
              <SearchLines ref={searchRef} height={heights.search} />
            </div>
          </div>
        </Pane>
      </SplitPane>
    </div>
  );
};

export default FileViewer;
