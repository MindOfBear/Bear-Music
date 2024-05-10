const { app, gloabalShortcut,BrowserWindow, session, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const initializeAdBlocker = require('./core/adblocker');
const singleInstanceLock = app.requestSingleInstanceLock(); 

let fs = require("fs");
let initPath = path.join(app.getPath("userData"), "init.json");
let playerWindow = null;
let tray;
let loadingWindow = null;
let isMenuVisible = false;

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
    let data;
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
      { label: 'Music - Real Bears', enabled: false},
      {type: 'separator'},
      { label: 'Quit', click:  function(){
        var data = {
            ...data,
            bounds: playerWindow.getBounds(),
            lastURL: playerWindow.webContents.getURL(),
        };
        fs.writeFileSync(initPath, JSON.stringify(data));
          globalShortcut.unregisterAll();
          app.isQuiting = true;
          playerWindow.destroy();
          app.quit();

      }}
    ]);
    tray.setToolTip('Music - Real Bears');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        playerWindow.show();
    });
}


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

const playerMenu = Menu.buildFromTemplate([
    {
        label: '🎵 Player - Real Bears',
        enabled: false,
    },
    { type: 'separator' },
    {
        label: 'Settings',
        submenu: [
            {
                label: 'Remember page',
                type: 'checkbox',
                checked: 'true',
                click: (menuItem) => {
                    let data;
                    try{
                        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
                    } catch (e) {

                    }
                    data.rememberPage = menuItem.checked;
                    fs.writeFileSync(initPath, JSON.stringify(data));
                    console.log(data);
                }
            },
            {
                label: 'Refresh Player',
                click: () => {
                    playerWindow.reload();
                }

            },
        ]
    }
]);

app.on('ready', async () => { 
    createLoadingWindow();
    createWindow();
    await initializeAdBlocker(fetch, session);
    let data;
    try {
        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
        const rememberPage = data.rememberPage;
        const defaultURL = 'http://music.youtube.com';
        const urlToLoad = defaultURL;
        if (rememberPage == true) {
            urlToLoad = data.lastURL || defaultURL;
            console.log("True: ", urlToLoad);
            playerWindow.loadURL(urlToLoad);
        } else if (rememberPage == false){
            urlToLoad = defaultURL;
            console.log("False: ", urlToLoad);
            playerWindow.loadURL(urlToLoad);
        }
        console.log(urlToLoad);
        playerWindow.loadURL(urlToLoad);
    } catch (error) {
        console.error(error);
    }

    playerWindow.setMenu(null);
    globalShortcut.register('CONTROL+SHIFT+T', () => {
        isMenuVisible = !isMenuVisible;
        playerWindow.setMenu(isMenuVisible ? playerMenu : null);
    });

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
