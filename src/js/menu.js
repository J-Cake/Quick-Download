const remote = require('electron').remote;
const webContents = remote.getCurrentWebContents();
const currentWindow = remote.getCurrentWindow();

module.exports = [{
    label: "Quick Downloader",
    content: [{
        label: "About Quick Downloader",
        content() {
            changeMenu(Menus.ABOUT);
        }
    }, {
        label: "Check for updates...",
        content() {
            checkUpdate(true);
        }
    }, {content: "separator"}, {
        label: "Exit",
        content() {
            window.close();
        },
        shortcut: "ctrl+w"
    }]
}, {
    label: "File",
    content: [{
        label: "New Download",
        content() {
            changeMenu(Menus.NEW_DOWNLOAD);
        },
        shortcut: "ctrl+n"
    }, {
        label: "Settings",
        content() {
            changeMenu(Menus.SETTINGS);
        }
    }]
}, {
    label: "View",
    content: [{
        label: "Reload",
        content() {
            window.location.reload(true);
        }
    }, {
        label: "Open Developer Tools",
        content() {
            webContents.openDevTools();
        },
        shortcut: "ctrl+shift+i"
    }]
}, {
    label: "Window",
    content: [{
        label: "Toggle Full Screen",
        content() {
            currentWindow.setFullScreen(!currentWindow.isFullScreen());
        },
        shortcut: "f11"
    }, {
        label: "Minimise",
        content() {
            currentWindow.minimize();
        }
    }, {
        label: "Maximise / Restore",
        content() {
            if (currentWindow.isMaximized())
                currentWindow.restore();
            else
                currentWindow.maximize();
        }
    }, {
        label: "Close",
        content() {
            currentWindow.close();
        }
    }]
}, {
    label: "Help",
    content: [{
        label: "Contact Developers",
        content() {
            changeMenu(Menus.CONTACT);
        }
    }, {
        label: "Learn More, Contribute and Docs",
        content() {
            remote.shell.openExternal('https://github.com/jbis9051/quick_download')
        }
    }, {
        label: "About",
        content() {
            changeMenu(Menus.ABOUT);
        }
    }]
}];
