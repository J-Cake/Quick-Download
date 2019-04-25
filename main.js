const os = require('os');
const {app, BrowserWindow, ipcMain, dialog, Menu} = require('electron');
let mainWindow;

const mainFile = require('./index_file.js');

const disableFramePermanently = false;

let withFrame = false;
const path = require('path');

async function createWindow() {
	mainWindow = new BrowserWindow({
		minWidth: 720,
		minHeight: 360,
		width: 720,
		height: 360,
		titleBarStyle: "hidden",
		nodeIntegration: true,
		frame: os.platform() !== "win32",
		icon: "./build/favicon.ico",
		webPreferences: {webSecurity: false}
	});

	mainWindow.loadFile(path.join(__dirname, mainFile));

	mainWindow.frame = withFrame;
	mainWindow.setTitle("Quick Downloader");
	if (!disableFramePermanently) {
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

		mainWindow.on('closed', function () {
			mainWindow = null;
		});
	}

	createMenu();
}

app.setAppUserModelId(process.execPath);

app.on('ready', createWindow);

function createMenu() {
	 // mainWindow.toggleDevTools();
	let template = [{
		label: 'Quick Downloader',
		submenu: [{
			label: 'About Quick Downloader',
			async click() {
				if (mainWindow === null) {
					await createWindow();
				}
				mainWindow.webContents.send("menu-about");
			},
		},
			{
				label: 'Check for updates...',
				click() {
					/* TODO */
				}
			},
			{type: 'separator'},
			{
				label: 'Preferences...',
				click() {
					mainWindow.webContents.send("menu-settings");
				}
			},
			{role: 'services'},
			{type: 'separator'},
			{role: 'services'},
			{role: 'hide'},
			{role: 'hideothers'},
			{type: 'separator'},
			{role: 'Quit'}
		]
	},
		{
			label: 'File',
			submenu: [{
				label: 'New Download...',
				async click() {
					if (mainWindow === null) {
						await createWindow();
					}
					mainWindow.webContents.send("menu-new_download");
				}
			}]
		},

		{
			label: 'Edit',
			submenu: [
				{role: 'undo'},
				{role: 'redo'},
				{type: 'separator'},
				{role: 'cut'},
				{role: 'copy'},
				{role: 'paste'},
				{role: 'delete'},
				{role: 'selectall'}
			]
		},

		{
			label: 'View',
			submenu: [{
				label: "Theme",
				submenu: [
					{label: "Dark", type: "radio", checked: true}, {label: "Light", type: "radio", enabled: false}
				]
			},
				{role: 'reload'},
				{role: 'forcereload'},
				{role: 'toggledevtools'},
				{type: 'separator'},
				{role: 'resetzoom'},
				{role: 'zoomin'},
				{role: 'zoomout'},
				{type: 'separator'},
				{role: 'togglefullscreen'},
			]
		},
		{
			role: 'window',
			submenu: [
				{role: 'minimize'},
				{role: 'close'}
			]
		},
		{
			label: 'Help',
			submenu: [{
				label: 'Contact Developers',
				async click() {
					if (mainWindow === null) {
						await createWindow();
					}
					mainWindow.webContents.send("menu-contact")
				}
			},
				{
					label: 'Learn More',
					click() {
						app.shell.openExternal('https://github.com/jbis9051/quick_download')
					}
				},
				{
					label: 'Contribute',
					click() {
						app.shell.openExternal('https://github.com/jbis9051/quick_download')
					}
				},
				{
					label: "About",
					async click() {
						if (mainWindow === null) {
							await createWindow();
						}
						mainWindow.webContents.send("menu-about")
					}
				},
				{
					label: "Docs",
					click() {
						app.shell.openExternal('https://github.com/jbis9051/quick_download')
					}
				}
			]
		}
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	// mainWindow.setMenu(Menu.buildFromTemplate(template));
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

ipcMain.on('minimise', e => {
	try {
		mainWindow.minimize()
	} catch (e) {
	}
});
ipcMain.on('minimise', e => {
	try {
		mainWindow.maximize()
	} catch (e) {
	}
});
ipcMain.on('minimise', e => {
	try {
		mainWindow.restore()
	} catch (e) {
	}
});
ipcMain.on('minimise', e => {
	try {
		mainWindow.close()
	} catch (e) {
	}
});

ipcMain.on('pickDir', e => {
	e.returnValue = dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory']
	});
	if (e.returnValue) {
		e.returnValue = e.returnValue[0];
	}
});

ipcMain.on('openURL', (e,url) => {
	app.shell.openExternal(url);
});
ipcMain.on('toggledevtools', (e,url) => {
	 mainWindow.toggleDevTools();
});
ipcMain.on('version', e => {
	e.returnValue = app.getVersion();
});

ipcMain.on('confirmClear', e => {
	dialog.showMessageBox({
			type: 'info',
			buttons: ['OK', 'Cancel'],
			message: "Are you sure you want to reset to default settings? Doing this will erase download history. But don't worry, things you have downloaded are safe."
		}, // "Confirm delete", "Are you sure you want to reset to default settings? Doing this will erase download history. But don't worry, things you have downloaded are safe."
		// [{"url":"https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_30mb.mp4","name":"Sample Video (Big Buck Bunny)"},{"url":"https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt","name":"Word List"},{"url":"https://brownserver.ddns.net/HighSierra.iso","name":"Mac OS High Sierra"}]
		value => e.returnValue = !value
	);
});