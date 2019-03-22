const fs = require('fs');
const path = require('path');
const buildLoc = path.join(__dirname, 'build');

fs.unlinkSync(path.join(buildLoc, "ping.js"));
fs.unlinkSync(path.join(buildLoc, "loading.html"));

const pkg = JSON.parse(fs.readFileSync(path.join(buildLoc, 'package.json'), 'utf8'));

pkg.main = "./main.js";

fs.writeFileSync(path.join(buildLoc, 'package.json'), JSON.stringify(pkg));