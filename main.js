const {app, BrowserWindow, ipcMain, dialog} = require('electron');
let mainWindow;

let withFrame = false;

async function createWindow () {
	mainWindow = new BrowserWindow({minWidth: 720, minHeight: 360, width: 720, height: 360, titleBarStyle:"hidden", frame: withFrame, nodeIntegration: true, icon: "./build/favicon.ico", webPreferences: {webSecurity: false}});

	mainWindow.loadFile('./public/loading.html');

	mainWindow.webContents.openDevTools();
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

app.setAppUserModelId(process.execPath);

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

ipcMain.on('pickDir', e => {
	e.returnValue = dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory']
	});
	if(e.returnValue){
		e.returnValue = e.returnValue[0];
	}
});
ipcMain.on('confirmClear', e => {
	dialog.showMessageBox({type: 'info', buttons: ['OK', 'Cancel'], message: "Are you sure you want to reset to default settings? Doing this will erase download history. But don't worry, things you have downloaded are safe."}, // "Confirm delete", "Are you sure you want to reset to default settings? Doing this will erase download history. But don't worry, things you have downloaded are safe."
		// [{"url":"https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_30mb.mp4","name":"Sample Video (Big Buck Bunny)"},{"url":"https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt","name":"Word List"},{"url":"https://brownserver.ddns.net/HighSierra.iso","name":"Mac OS High Sierra"}]
		value => e.returnValue = !value
	);
});