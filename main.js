const {app, BrowserWindow, ipcMain} = require('electron');
let mainWindow;

let withFrame = false;

async function createWindow () {
	mainWindow = new BrowserWindow({width: 720, height: 360, frame: withFrame, nodeIntegration: true, icon: "./build/favicon.ico"});

	mainWindow.loadFile('./public/loading.html');

	mainWindow.setMenu(null);

	// mainWindow.webContents.openDevTools();
	mainWindow.frame = withFrame;

	mainWindow.setTitle("Quick Downloader");

	ipcMain.on('withFrame', e => {
		withFrame = true;
			mainWindow.close();
		createWindow();
	});
	ipcMain.on('noFrame', e => {
		withFrame = false;
			mainWindow.close();
		createWindow();
	})

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

ipcMain.on('minimise', e => {try {mainWindow.minimize()} catch(e) {}});
ipcMain.on('minimise', e => {try {mainWindow.maximize()} catch(e) {}});
ipcMain.on('minimise', e => {try {mainWindow.restore()} catch(e) {}});
ipcMain.on('minimise', e => {try {mainWindow.close()} catch(e) {}});