const HTTP = require('http');
const FS = require('fs');

const server = HTTP.createServer((req, res) => {
	res.writeHead(200);
	res.write(fs.readFileSync('./download.py'))
});