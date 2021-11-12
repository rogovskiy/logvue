import React, { useEffect, useState } from 'react';

import FileViewer from './FileViewer';
import Menu from './Menu';
import FileOpenModal from './FileOpenModal';

import { useFileContext } from './FileStateProvider';

const App = () => {
  const { state: fileState } = useFileContext();
  const { file, parserOptions } = fileState;
  const [initState, setInitState] = useState({
    initModalShown: false,
    initDone: false,
  });

  useEffect(() => {
    if (file.path) {
      setInitState({ initModalShown: true, initDone: false });
    }
  }, [file.path]);

  const openFileWithSettings = (_settings) => {
    // TODO update settings
    setInitState({ ...initState, initModalShown: false, initDone: true });
  };

  console.log('app render');

  return (
    <div>
      <Menu />
      {initState.initModalShown && (
        <FileOpenModal
          show
          onClose={openFileWithSettings}
          file={file.path}
          parserOptions={parserOptions}
        />
      )}
      {initState.initDone && <FileViewer />}
    </div>
  );
};

export default App;
