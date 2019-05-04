// import * as fs from 'fs';
// import * as os from 'os';
// import * as path from 'path';

const electron = window.require('electron');
const remote = electron.remote;

const fs = window.require('fs');
const os = window.require('os');
const path = window.require('path');

class TmpFile {
	constructor(name, parentPath) {
		this.path = path.join(parentPath || os.tmpdir(), 'qdtmp_' + name  + '.quickdTMP');
		this.file = fs.createWriteStream(this.path, "utf8");
	}

	async write(content) {
		const file = this.file;
		return new Promise(function (resolve, reject) {
			try {
				file.write(content);
			} catch (err) {
				console.log(err);
				reject({success: false, err})
			}

			resolve({success: true});

		})
	}
	exists(){
		return fs.existsSync(this.path);
	}
	writeSync(content) {
		this.file.write(content);
	}

	async delete() {
		let that = this;
		return new Promise(function (resolve, reject) {
			fs.unlink(that.path, err => {
				if (err)
					reject({success: false, err});
				resolve({success: true});
			});
		});
	}

	deleteSync() {
		fs.unlinkSync(this.path);
	}

	async read() {
		return new Promise(function (resolve, reject) {
			fs.readFile(this.path, 'utf8', (content, err) => {
				if (err)
					reject({success: false, err});
				resolve({success: true, content});
			})
		});
	}
	readSync() {
		let cont;
		cont = fs.readFileSync(this.path, 'utf8');
		return cont
	}
}

class TmpDir {
	constructor(name, path) {
		this.path = path.join(path || os.tmpdir(), name);

		this.children = [];
	}

	insertFileSync(name) {
		if (this.children.filter(i => i.name === name).length <= 0 || fs.existsSync(path.join(this.path, name))) {
			this.children.push(new TmpFile(name, this.path));
			return this.children[this.children.length - 1];
		} else {
			throw new Error("The file already exists");
		}
	}

	async insertDir(name) {
		if (this.children.filter(i => i.name === name).length <= 0 || fs.existsSync(path.join(this.path, name))) {
			this.children.push(new TmpDir(name, this.path));
			return this.children[this.children.length - 1];
		} else {
			throw new Error("The file already exists");
		}
	}

	insertDirSycn(name) {
		if (this.children.filter(i => i.name === name).length <= 0 || fs.existsSync(path.join(this.path, name))) {
			this.children.push(new TmpDir(name, this.path));
			return this.children[this.children.length - 1];
		} else {
			throw new Error("The file already exists");
		}
	}

	async insertFile(name) {
		if (this.children.filter(i => i.name === name).length <= 0 || fs.existsSync(path.join(this.path, name))) {
			this.children.push(new TmpFile(name, this.path));
			return this.children[this.children.length - 1];
		} else {
			throw new Error("The file already exists");
		}
	}

	deleteFileSync(name) {
		let file = this.children.filter(i => i.name === name);
		file[0].delete();
		delete file[0];
	}

	async deleteFile(name) {
		let file = this.children.filter(i => i.name === name);
		file[0].deleteMe();
		delete file[0];
	}

	deleteDirSync(name) {
		let file = this.children.filter(i => i.name === name);
		file[0].deleteMe();
		delete file[0];
	}

	async deleteDir(name) {
		let file = this.children.filter(i => i.name === name);
		file[0].delete();
		delete file[0];
	}

	async deleteMe() {
		await this.empty();
		return new Promise(function (resolve, reject){
			fs.rmdir(this.path, err => {
				if (err)
					reject(err);
				resolve({success: true});
			})
		});
	}

	async empty() {
		this.children.map(async i => {
			if (i instanceof TmpDir) {
				await this.deleteDir(i.name);
			} else if (i instanceof TmpFile) {
				await this.deleteFile(i.name);
			}
		})
	}

	emptySync() {
		this.children.map(i => {
			if (i instanceof TmpDir) {
				this.deleteDirSync(i.name);
			} else if (i instanceof TmpFile) {
				this.deleteFileSync(i.name);
			}
			return i;
		})
	}

	getFiles() {
		return this.children.filter(i => i instanceof TmpFile);
	}
	getDirs() {
		return this.children.filter(i => i instanceof TmpDir);
	}
	getContent() {
		return this.children;
	}
}

export {
	TmpFile,
	TmpDir
}