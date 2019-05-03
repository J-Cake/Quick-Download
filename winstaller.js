console.log(process.env);

const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const msi = new MSICreator({
    appDirectory: path.join(__dirname, './release-builds', 'Quick Downloader-win32-ia32'),
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