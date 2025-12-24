const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// --- FIX: Handle ESM/CJS interoperability ---
const serveExport = require('electron-serve');
const serve = serveExport.default || serveExport; 

const appServe = app.isPackaged ? serve({ directory: path.join(__dirname, '../out') }) : null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 1200, 
    title: "MESOELFY_OS",
    icon: path.join(__dirname, '../app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true // Keep true, we will handle Referer via session
    }
  });

  win.setMenuBarVisibility(false);

  if (app.isPackaged) {
    appServe(win).then(() => {
      win.loadURL('app://-');
    });
  } else {
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  // --- YOUTUBE 153 FIX ---
  // Intercept requests to YouTube and inject valid 'Referer' AND 'Origin' headers.
  // This tricks YouTube into thinking the video is playing on the hosted site, bypassing 'file://' restrictions.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.google.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://mesoelfy.github.io/';
      details.requestHeaders['Origin'] = 'https://mesoelfy.github.io';
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
