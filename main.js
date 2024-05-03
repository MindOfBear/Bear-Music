const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let playerWindow = null;
let tray;
let loadingWindow = null;

function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true
        }
});

loadingWindow.loadFile('index.html');
loadingWindow.setMenu(null);
loadingWindow.on('closed', () => {
    loadingWindow = null;
});

}

function createWindow() {
    playerWindow = new BrowserWindow({
        show: false,
        width: 1000,
        height: 600,
        frame: true,
        transparent: false,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    playerWindow.on('closed', () => {
        playerWindow = null;
    });

    playerWindow.on(`close`, (event) => {
        if(!app.isQuiting){
            event.preventDefault();
            playerWindow.hide();
        }
    });


    tray = new Tray(path.join(__dirname, 'icon.png'));

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Player', click:  function(){
          playerWindow.show();
      } },
      {type: 'separator'},
      { label: 'Quit', click:  function(){
          app.isQuiting = true;
          app.quit();
      }}
    ]);
    tray.setToolTip('YouTube Music - Real Bears');
    tray.setContextMenu(contextMenu);
  }

const singleInstanceLock = app.requestSingleInstanceLock();

if(!singleInstanceLock){
    app.quit();
} else {
    app.on('second-instance', () => {
        if (playerWindow) {
            if (playerWindow.isMinimized()) playerWindow.restore();
            playerWindow.focus();
        }
    });

}

app.on('ready', () => {
    createLoadingWindow();
    createWindow();
    playerWindow.loadURL('http://music.youtube.com');
    playerWindow.setMenu(null);

    playerWindow.webContents.on('did-finish-load', () => {
        if (loadingWindow) {
            loadingWindow.close();
        }
        playerWindow.show();
    });
});

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
