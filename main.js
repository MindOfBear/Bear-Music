const { app, BrowserWindow } = require('electron');
const path = require('path');

let playerWindow;

function createWindow() {
    playerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    playerWindow.loadURL('http://music.youtube.com');
    playerWindow.setMenu(null);

    
    playerWindow.on('closed', () => {
      playerWindow = null;
    });
  }

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (playerWindow === null) {
        createWindow();
    }
});
