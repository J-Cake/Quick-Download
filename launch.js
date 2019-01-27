const { exec }= require('child_process');
const { ping } = require('./ping.js');
const { writeFileSync } = require('fs');

const electron = exec('electron .');
let server;

let nextDatum = false; // when set to true, the next stdout item from the server will cause the loading phase to end.
let loaded = false;

const kill = () => {
	if (server)
		server.kill();
	else
		server = null;
};

electron.stdout.on('data', data => {
	if (data.trim().includes("ready")) {
		if (loaded)
			signal();
	}

	process.stdout.write(data);
});

electron.on('end', kill);
electron.on('exit', kill);
electron.stdout.on('end', kill);
electron.stdout.on('exit', kill);

ping({address: "localhost", port: 3000, attempts: 1}, (opts, result) => {
	if (isNaN(result.avg)) {
		if (server !== null) {
			server = exec('npm start');
			server.stdout.on('data', e => {
				if (e.trim().indexOf(`Starting the development server...`) > -1)
					nextDatum = true;
				if (nextDatum)
					nextDatum = signal() || false;
				process.stdout.write(e);
			});
		} else {
			process.exit(0);
		}
	} else {
		loaded = true;
		signal();
	}
});

const signal = () => (void writeFileSync('./signal.txt', 'server\'s up\n')) || (void electron.stdin.end());