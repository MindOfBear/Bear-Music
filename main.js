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
