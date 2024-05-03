const electron = require('electron');
const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let playerWindow;
let tray;

function createWindow() {
    playerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    playerWindow.loadURL('http://music.youtube.com');
    playerWindow.setMenu(null);

    
    playerWindow.on('closed', () => {
      playerWindow = null;
    });
  
    
    tray = new Tray(path.join(__dirname, 'icon.png'));

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click:  function(){
          playerWindow.show();
      } },
      { label: 'Quit', click:  function(){
          app.isQuiting = true;
          app.quit();
      } }
    ]);
    
    
    tray.setToolTip('YouTube Music');
    tray.setContextMenu(contextMenu);


  
  
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
