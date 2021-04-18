/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  ipcMain,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

import fs from 'fs';
import os from 'os';
import throttle from 'lodash.throttle';

import { loadBuffer, openFile, searchScan, searchBuffer } from './main/file';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const registerShortcuts = (win) => {
  globalShortcut.register('CommandOrControl+O', () => {
    win.webContents.send('shortcut', 'file-open');
  });
  globalShortcut.register('CommandOrControl+G', () => {
    win.webContents.send('shortcut', 'go-to-line');
  });
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  registerShortcuts(mainWindow);

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

const fileInfo = {};

ipcMain.handle('show-file-open', async (event, arg) => {
  const options = {
    title: 'Open a log file',
    // defaultPath: '/path/to/something/',
    buttonLabel: 'Open',
    /* filters: [
          { name: 'xml', extensions: ['xml'] }
        ], */
    // properties: ['showHiddenFiles'],
    // message: 'This message will only be shown on macOS'
  };
  const result = await dialog.showOpenDialog(options);
  console.log('Dialog closed', new Date());
  if (result.canceled) {
    return null;
  }
  const path = result.filePaths[0];
  console.log('Stat', new Date());
  const stat = await fs.promises.stat(path);
  console.log('Return', new Date());
  return { path, fileSize: stat.size, modTime: stat.mtime };
});

ipcMain.handle(
  'open-file',
  async (event, filename, lineBufferSize, options) => {
    const throttledProgress = throttle((p) => {
      event.sender.send('progress', p);
    }, 200);
    const results = await openFile(
      filename,
      lineBufferSize,
      options,
      throttledProgress
    );
    fileInfo[filename] = {
      lineCount: results.fileStats.lineCount,
      fileStats: results.fileStats,
      searchCheckpoints: {},
    };
    return {
      lines: results.lines, // not used
      lineCount: results.fileStats.lineCount,
      offset: 0,
    };
  }
);

ipcMain.handle(
  'load-buffer',
  async (event, filename, start, lineBufferSize, options) => {
    const throttledProgress = throttle((p) => {
      event.sender.send(`progress-${filename}`, p);
    }, 200);
    if (start !== 0 && !fileInfo[filename]) {
      throw new Error(
        'Buffer loading happened too fast before file scan is over'
      );
    }
    const checkpoints =
      start === 0 ? [] : fileInfo[filename].fileStats.checkpoints;
    const results = await loadBuffer(
      filename,
      start,
      lineBufferSize,
      checkpoints,
      options,
      throttledProgress
    );
    return results;
  }
);

ipcMain.handle('search-scan', async (event, filename, filter, options) => {
  const throttledProgress = throttle((p, c) => {
    event.sender.send('search-progress', p, c);
  }, 200);
  const result = await searchScan(filename, filter, options, throttledProgress); // { resultsCount: 0, checkpoints: [] };
  fileInfo[filename].searchCheckpoints[filter.query] = result.checkpoints;
  return { resultCount: result.resultsCount };
});

ipcMain.handle(
  'search-buffer',
  async (event, filename, filter, startLine, lineBufferSize, options) => {
    const throttledProgress = throttle((p) => {
      event.sender.send('search-progress', p);
    }, 200);
    if (startLine !== 0 && !fileInfo[filename]) {
      throw new Error(
        'Buffer loading happened too fast before file scan is over'
      );
    }

    return await searchBuffer(
      filename,
      filter,
      startLine,
      lineBufferSize,
      fileInfo[filename].searchCheckpoints[filter.query],
      options,
      throttledProgress
    ); // { lines : LineT};
  }
);
