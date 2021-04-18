import React from "react";

import FileViewer from "./FileViewer";
import Menu from "./Menu";

import { useFileContext } from "./FileStateProvider";

const App = () => {
  const { state: fileState } = useFileContext();
  const { file } = fileState;
  const fileSelected = file.path !== null;

  console.log("app render");

  return (
    <div>
      <Menu />
      {fileSelected && <FileViewer file={file.path} />}
    </div>
  );
};

export default App;
