const {app, BrowserWindow, ipcMain, dialog,Menu} = require('electron');
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
	});
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
	createMenu();
}

app.setAppUserModelId(process.execPath);

app.on('ready',createWindow);

function createMenu(){
	const template = [
		{
			label: 'Quick Downloader',
			submenu: [
				{
					label: 'About Quick Downloader',
					click() {
						/* TODO: Figure out a way to call the about function */
					}
				}
			]
		},
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'pasteandmatchstyle' },
				{ role: 'delete' },
				{ role: 'selectall' }
			]
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forcereload' },
				{ role: 'toggledevtools' },
				{ type: 'separator' },
				{ role: 'resetzoom' },
				{ role: 'zoomin' },
				{ role: 'zoomout' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{
			role: 'window',
			submenu: [
				{ role: 'minimize' },
				{ role: 'close' }
			]
		},
		{
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click () { require('electron').shell.openExternal('https://electronjs.org') }
				}
			]
		}
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

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