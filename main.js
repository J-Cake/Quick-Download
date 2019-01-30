const {app, BrowserWindow, ipcMain} = require('electron');
let mainWindow;

async function createWindow () {
	mainWindow = new BrowserWindow({width: 720, height: 360, frame: false, nodeIntegration: true, icon: "./build/favicon.ico"});

		mainWindow.loadFile('./public/loading.html');

	mainWindow.webContents.openDevTools();

	mainWindow.on('closed', function () {
		mainWindow = null;
	});

	mainWindow.setTitle("Quick Downloader");

}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow();
	}
});

ipcMain.on('minimise', e => mainWindow.minimize());
ipcMain.on('maximize', e => mainWindow.maximize());
ipcMain.on('restore', e => mainWindow.restore());
ipcMain.on('close', e => mainWindow.close());