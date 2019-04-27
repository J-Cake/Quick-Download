const winstaller = require('electron-winstaller');
const path = require('path');

resultPromise = winstaller.createWindowsInstaller({
    appDirectory: './release-builds/Quick Downloader-win32-ia32/',
    outputDirectory: '/release-builds/installers',
    authors: 'Jacob Schneider, Joshua Brown',
    exe: 'Quick Downloader.exe',
    loadingGif: path.join(__dirname, 'src', 'res', 'Installer-backdrop.gif'),
    iconUrl: path.join(__dirname, 'src', 'res', 'favicon.ico')
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));