const tmp = require('../tempfile');
const fs = require('fs');
const os = require('os');
const path = require('path');

expected.extend({
	doesFileExist(fileName) {
		return {
			pass: fs.existsSync(path.join(os.tmpdir(), fileName))
		}
	}
});

test("create the temporary file", done => {
	expect(new tmp.TmpFile('tempfile.tmp')).doesFileExist('tempfile.tmp');
});