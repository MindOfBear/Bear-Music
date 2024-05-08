const { app, BrowserWindow, session, Tray, Menu } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const path = require('path');

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInSession(session.defaultSession);
});



let playerWindow = null;
let tray;
let loadingWindow = null;
adBlockerInitialized = false;

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
    var path = require("path");
    var fs = require("fs");
    var initPath = path.join(app.getPath("userData"), "init.json");
    var data;
    try {
        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
    } catch (e) {}
    playerWindow = new BrowserWindow(
        (data && data.bounds ? { 
            ...data.bounds, 
            show: false, 
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        } : {
            show: false,
            width: 1000,
            frame: true,
            height: 600,
            transparent: false,
            icon: path.join(__dirname, 'icon.png'),
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    );
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
        var data = {
            bounds: playerWindow.getBounds()
        };
        fs.writeFileSync(initPath, JSON.stringify(data));
          app.isQuiting = true;
          playerWindow.destroy();
          app.quit();

      }}
    ]);
    tray.setToolTip('YouTube Music - Real Bears');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        playerWindow.show();
    });
}

const singleInstanceLock = app.requestSingleInstanceLock(); 

if(!singleInstanceLock){
    app.quit();
} else {
    app.on('second-instance', () => {
        if (playerWindow) {
            if (playerWindow.isMinimized()) playerWindow.restore();
            playerWindow.show();
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
