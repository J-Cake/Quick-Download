const {app, BrowserWindow, ipcMain} = require('electron');
const fs = require('fs');

let mainWindow;

let serverIsUp = false;

// fs.watchFile('./signal.txt', (current, previous) => {
// 	// console.log("signal");
// 	serverIsUp = true;
// 	mainWindow.webContents.send('getPage');
// });

async function createWindow () {
	mainWindow = new BrowserWindow({width: 720, height: 360, frame: false});

	if (serverIsUp)
		mainWindow.loadURL('http://localhost:3000');
	else
		mainWindow.loadFile('./public/loading.html');

	mainWindow.webContents.openDevTools();

	mainWindow.on('closed', function () {
		mainWindow = null;
	});

	mainWindow.setTitle("Quick Downloader");

	console.log("ready");
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