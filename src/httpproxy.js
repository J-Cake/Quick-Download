// import pac from "node-pac-resolver";
// import * as url from 'url';

const pac = window.getModule('pac-resolver');
const url = window.getModule('url');


export default class HTTPProxy {
	constructor (props) {
		this.hostname = props.hostname;
		this.auth = props.auth;
	}

	async resolveProxy() {
		if (this.pacScript) {
			const response = (await pac(this.pacScript))(this.urlRequested, url.parse(this.urlRequested).hostname);

			if (response.split(" ")[0] === "DIRECT") {
				this.proxyHost = "";
				this.proxyPort = "";
			} else {
				const res = "http://" + response.split(" ")[1];
				const {host, port} = url.parse(res);
				this.proxyHost = host;
				this.proxyPort = port;
			}
		}
	}

	get awaiting() {
		return !!(this.proxyHost && this.proxyPort);
	}

	get method() {
		return this.usesCredentials ? "credentials" : "pac";
	}

	get hostname() {
		if (this.proxyHost)
			return this.proxyHost !== 1 ? this.proxyHost : 1;
		else
			return 0;
	}

	get port() {
		if (this.proxyPort)
			return this.proxyPort !== 1 ? this.proxyPort : 1;
		else
			return 0;
	}

	get auth() {
		return this.credentials;
	}

	get protocol() {
		return this.proxyHost.split("://")[0] || "";
	}
}
