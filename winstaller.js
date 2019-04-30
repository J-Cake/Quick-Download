// const winstaller = require('electron-winstaller');
// const path = require('path');

// resultPromise = winstaller.createWindowsInstaller({
//     appDirectory: './release-builds/Quick Downloader-win32-ia32/',
//     outputDirectory: '/release-builds/installers',
//     authors: 'Jacob Schneider, Joshua Brown',
//     exe: 'Quick Downloader.exe',
//     loadingGif: path.join(__dirname, 'src', 'res', 'Installer-backdrop.gif'),
//     iconUrl: path.join(__dirname, 'src', 'res', 'favicon.ico')
// });

// resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));

const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const msi = new MSICreator({
    appDirectory: path.join(__dirname, 'Quick Downloader-win32-ia32'),
    description: "We Download Things With Speed!",
    exe: "Quick Downloader.exe",
    name: "Quick Downloader",
    manufacturer: "Josh Brown, Jake Schneider",
    version: "1.0.0",
    outputDirectory: path.join(__dirname, "release-builds")
});

msi.create().then(() => {
    msi.compile();
});
