const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');

function create() {
	fs.mkdirSync('./build');
	console.log('--- cleared workspace ---');
}

if (fs.existsSync('./build')) {
	const removeDirCmd = os.platform() === 'win32' ? "rmdir /s /q " : "rm -rf ";
	const theDir = './build';

	childProcess.exec(removeDirCmd + '"' + theDir + '"', function (err) {
		if (err) console.error(err);
	}).on('end', () => create());
} else {
	create();
}