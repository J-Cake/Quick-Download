const { exec }= require('child_process');
const { ping } = require('./ping.js');

exec('electron .').stdout.pipe(process.stdout);

ping({address: "localhost", port: 3000, attempts: 1}, (opts, result) => {
	if (isNaN(result.avg)) {
		console.log("Starting Server");
		exec('npm start').stdout.pipe(process.stdout);
	} else {
		console.log("Server Already Running");
	}
});