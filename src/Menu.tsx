import React, { useState, useEffect, useCallback } from 'react';
import { Progress, Icon, Menu } from 'semantic-ui-react';

import { ipcRenderer } from 'electron';
import { useFileContext } from './FileStateProvider';
import GoToLineModal from './GoToLineModal';
import SettingsModal from './SettingsModal';

const timestampFormats = ['none', 'short', 'full'];

/* eslint-disable */
const fileSizeSI = (size: number) => {
  const e = (Math.log(size) / Math.log(1e3)) | 0;
  return `${+(size / Math.pow(1e3, e)).toFixed(2)} ${'kMGTPEZY'[e - 1] || ''}B`;
};
/* eslint-enable */

const MyMenu = () => {
  const [progress, setProgress] = useState(0);
  const [gotoShown, setGoToShown] = useState(false);
  const [settingsShown, setSettingsShown] = useState(false);

  const { state: fileState, dispatch } = useFileContext();
  const { file, viewOptions, parserOptions } = fileState;
  const fileSelected = file.path !== null;

  const chooseFile = useCallback(async () => {
    const info = await ipcRenderer.invoke('show-file-open');
    console.log('back in renderer', new Date());
    if (info) {
      const { path, fileSize /* , modTime */ } = info;
      dispatch({ type: 'file-loaded', path, fileSize });
      document.title = path.substring(
        1 + Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
      );
    }
  }, [dispatch]);

  const showGoToLineDialog = useCallback(() => {
    setGoToShown(true);
  }, [setGoToShown]);

  const handleShortcuts = useCallback(
    (_e, shortcut) => {
      if (shortcut === 'go-to-line' && fileSelected) {
        showGoToLineDialog();
      } else if (shortcut === 'file-open') {
        chooseFile();
      }
    },
    [showGoToLineDialog, chooseFile, fileSelected]
  );

  useEffect(() => {
    ipcRenderer.on('shortcut', handleShortcuts);
    return () => {
      ipcRenderer.removeListener('shortcut', handleShortcuts);
    };
  }, [handleShortcuts]);

  const handleGoToLine = (lineSpec) => {
    if (lineSpec) {
      dispatch({ type: 'goto', lineSpec });
    }
    setGoToShown(false);
  };

  useEffect(() => {
    const progressListener = (_event, inProgress: number) => {
      setProgress(inProgress);
    };
    ipcRenderer.on('progress', progressListener);
    return () => {
      ipcRenderer.removeListener('progress', progressListener);
    };
  }, [setProgress]);

  const updateViewOptions = (updates) => {
    dispatch({ type: 'update-view-options', updates });
  };

  const updateParserOptions = (updates) => {
    dispatch({ type: 'update-parser-options', updates });
  };

  const nextTimestampFormat = () => {
    const current = timestampFormats.indexOf(viewOptions.showTimestamp);
    updateViewOptions({
      showTimestamp: timestampFormats[(current + 1) % timestampFormats.length],
    });
  };

  const handleSettings = (newSettings) => {
    if (newSettings) {
      dispatch({ type: 'update-parser-options', updates: newSettings });
    }
    setSettingsShown(false);
  };

  return (
    <div>
      <GoToLineModal show={gotoShown} onClose={handleGoToLine} />
      <SettingsModal show={settingsShown} onClose={handleSettings} />
      <Menu style={{ marginBottom: 0 }}>
        <Menu.Item onClick={chooseFile}>
          <Icon name="folder open outline" /> Open
        </Menu.Item>
        {fileSelected && (
          <Menu.Item style={{ padding: '5px' }}>
            <Menu compact className="mini">
              <Menu.Item
                active={parserOptions.textFormat !== 'json'}
                onClick={() => updateParserOptions({ textFormat: 'text' })}
              >
                <Icon name="file alternate outline" /> Text
              </Menu.Item>
              <Menu.Item
                active={parserOptions.textFormat === 'json'}
                onClick={() => updateParserOptions({ textFormat: 'json' })}
              >
                <Icon name="code" />
                JSON
              </Menu.Item>
            </Menu>
            &nbsp;
            <Menu compact className="mini">
              <Menu.Item
                title="Show line numbers"
                active={viewOptions.showLineNumber}
                onClick={() =>
                  updateViewOptions({
                    showLineNumber: !viewOptions.showLineNumber,
                  })
                }
              >
                <Icon name="list ol" />
              </Menu.Item>
              <Menu.Item
                title="Show timestamps"
                active={viewOptions.showTimestamp !== 'none'}
                onClick={nextTimestampFormat}
              >
                <Icon name="clock outline" />
              </Menu.Item>
              <Menu.Item
                title="Show histogram"
                active={viewOptions.showHistogram}
                onClick={() =>
                  updateViewOptions({
                    showHistogram: !viewOptions.showHistogram,
                  })
                }
              >
                <Icon name="chart bar" />
              </Menu.Item>
            </Menu>
          </Menu.Item>
        )}
        {fileSelected && (
          <Menu.Item style={{ padding: '5px' }} onClick={showGoToLineDialog}>
            <Icon name="share" /> Jump To
          </Menu.Item>
        )}
        <Menu.Menu position="right">
          {fileSelected && (
            <Menu.Item>
              <Icon name="info" />
              {fileSizeSI(file.fileSize || 0)}
            </Menu.Item>
          )}
          <Menu.Item onClick={() => setSettingsShown(true)}>
            <Icon name="cog" /> Settings
          </Menu.Item>
        </Menu.Menu>
      </Menu>
      {progress > 0 && <Progress percent={progress} attached="bottom" />}
    </div>
  );
};

export default MyMenu;
