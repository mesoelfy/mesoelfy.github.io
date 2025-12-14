const { app, BrowserWindow } = require('electron');
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
