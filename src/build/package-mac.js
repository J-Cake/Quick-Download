const packager = require('electron-packager');

async function bundleElectronApp(options) {
    const appPaths = await packager(options);
    console.log(`Electron app bundles created:\n${appPaths.join("\n")}`)
}

bundleElectronApp({
    dir: '.',
    overwrite: true,
    platform: "darwin",
    arch: "x64",
    asar: true,
    prune: true,
    name: "Quick Downloader",
    out: "release-builds",
    icon: "./src/assets/images/logo_mac.icns",
    extendInfo: './src/assets/build/extendedInfo.plist'
});
