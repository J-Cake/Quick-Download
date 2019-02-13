module.exports = {
	target: 'electron-renderer',
	resolve: {
		modules: [
			"../node_modules/"
		]
	},
	exclude(file) {
		if (file.startsWith(__dirname + '/node_modules/mousetrap')) {
			return false;
		}
		return file.startsWith(__dirname + '/node_modules');
	},
	compilerOptions: {
		moduleResolution: "node"
	}
};