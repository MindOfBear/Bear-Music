const {BrowserWindow} = require('electron');

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: true,
        autoHideMenuBar: true,
        transparent: true,
        alwaysOnTop: true,
        minimizable: false,
        maximizable: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    aboutWindow.loadFile('pages/aboutPage/about.html');

    aboutWindow.on('closed', () => {
        aboutWindow = null;
    });

    return aboutWindow;
}

module.exports = createAboutWindow;