const detailOptions = require('./core/discordOptions');
const initializeAdBlocker = require('./core/adblocker');
const { app, BrowserWindow, session, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');

const singleInstanceLock = app.requestSingleInstanceLock(); 
const DiscordRPC = require('discord-rpc');
DiscordRPC.register('1238433985567391807');
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

async function setRichPresence(playerWindowTitle){
    let randomDetail = detailOptions[Math.floor(Math.random() * detailOptions.length)];
    if (!rpc || !playerWindow) {
        return;
    }
    await rpc.setActivity({
        details: randomDetail,
        state: playerWindowTitle,
        startTimestamp: new Date(),
        largeImageKey: 'lgimage',
        largeImageText: 'What a bear! 🐻',
        smallImageKey: 'image',
        smallImageText: 'Stop hovering around... 🤔',
        instance: false,
    });
}

rpc.login({ clientId: '1238433985567391807' }).catch(console.error);

let fs = require("fs");
const createAboutWindow = require('./pages/aboutPage/aboutWindow');
let initPath = path.join(app.getPath("userData"), "init.json");
let playerWindow = null;
let tray;
let loadingWindow = null;
let isMenuVisible = false;

let data = {};
try {
    data = JSON.parse(fs.readFileSync(initPath, 'utf8')); // prelevate app data from file
} catch (e) {
    fs.writeFileSync(initPath, JSON.stringify(data));
}

function createLoadingWindow() { // creating loading window (splash screen)
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
    loadingWindow.loadFile('pages/loadingPage/loading.html');
    loadingWindow.setMenu(null);
    loadingWindow.on('closed', () => {
        loadingWindow = null;
    });
}

function createWindow() { // creating the main window
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
      { label: 'Bear Music', enabled: false},
      {type: 'separator'},
      { 
        label: 'About' , click: ()=>{
        createAboutWindow();
        }
      },
      { label: 'Quit', click:  function(){
        try {
            data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
        } catch (e) {
            // handle error
        }
        data.lastURL = playerWindow.webContents.getURL();
        data.bounds = playerWindow.getBounds();
        data.OldMan = true;
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

if(!singleInstanceLock){ // check if the app is already running
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
                checked: data.rememberPage,
                click: (menuItem) => {
                    let data;
                    try{
                        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
                    } catch (e) {
                       
                    }
                    data.rememberPage = menuItem.checked;
                    fs.writeFileSync(initPath, JSON.stringify(data));
                }
            },
            {
                label: 'Refresh Player',
                click: () => {
                    playerWindow.reload();
                }

            },
            {
                label: 'Discord Reconnect',
                click: () => {
                    rpc.login({ clientId: '1238433985567391807' }).catch(console.error);
                }

            },
        ]
    }
]);

app.on('ready', async () => { 
    createLoadingWindow();
    createWindow();
    try {
        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
        if (data.OldMan === true){
            await initializeAdBlocker(fetch, session)
        }
        let rememberPage = data.rememberPage !== undefined ? data.rememberPage : false;
        let defaultURL = 'http://music.youtube.com';
        let urlToLoad = defaultURL;
        if (rememberPage == true) { // if remember page setting is enabled, load the last page
            urlToLoad = data.lastURL || defaultURL;
            playerWindow.loadURL(urlToLoad);
        } else if (rememberPage == false){ // if remember page setting is disabled, load the default page
            urlToLoad == defaultURL;
            playerWindow.loadURL(urlToLoad);
        }
        playerWindow.loadURL(urlToLoad);
    } catch (error) {

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

    playerWindow.on('page-title-updated', (event, title) => {
        let parsedTitle = title.replace(' - YouTube Music', '🎵');
        if (parsedTitle == 'YouTube Music') {
            parsedTitle = 'Nothing playing... 🥱';
        }
        setRichPresence(parsedTitle);
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
