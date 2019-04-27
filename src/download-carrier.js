import Download from './Download';
import DownloadDisplayComp, {status} from './components/downloadCompDisplay';
import React from "react";

const events = window.require('events');

Date.prototype.print = function() {
	return `${this.getUTCHours() || 0}h:${this.getUTCMinutes() || 0}m:${this.getUTCSeconds() || 0}s`;
};

export default class DownloadCarrier extends events.EventEmitter {
	constructor(url, name, headers) {
		super();
		this.url = url;
		this.name = name;
		this.customHeaders = (typeof headers === "string") ? DownloadCarrier.JSONparse(headers) : headers;
		if(this.download){
			this.download.constructor(); // retry download, need to reset everything
		} else {
			this.download = new Download();
		}
		this.headersExpanded = false;

		this.status = 3;

		this.done = false;

		this.stats = {};
		this.last_update = 0;
		this.functions = {
			cancel: this.cancel.bind(this),
			remove: this.remove.bind(this),
			retry: this.retry.bind(this),
			toggleHeaders: () => this.toggleHeaders()
		};

		if (window.localStorage.proxySettings === "auth") {
			this.proxyOptions = {
				hostname: window.localStorage.proxyHost,
				port: window.localStorage.proxyPort,
				auth: (window.localStorage.proxyRequiresCredentials === "true") ? {
					username: window.localStorage.proxyUsername,
					password: window.localStorage.proxyPassword,
				} : false,
			};
		}
	}
	static JSONparse(str){
		str = str || "{}";
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return JSON.parse(str);
	}

	render(key) {
		return <DownloadDisplayComp key={key} status={this.status} functions={this.functions} content={this.prettyProps()}/>
	}

	cancel() {
		if (this.download)
			this.download.cancel();
		this.emit('cancel');
	}

	remove() {
		this.emit('remove');
	}
	retry(){
		this.emit('retry');
	}
	async initiateDownload() {
		this.emit("init");
		this.download.on('update', info => this.update(info));
		this.download.on('error', err => this.error(err));
		await this.download.init(this.url, this.name, window.localStorage.saveLocation, Number(window.localStorage.partsToCreate), this.customHeaders, this.proxyOptions || false);
	}
	async startDownload() {
		await this.download.beginDownload();
	}

	prettyProps(filter) {
		const props = {
			percentage: Number(parseFloat(this.stats.percentage || 0).toFixed(7)),
			progress: `${DownloadCarrier.calculateSize(this.stats.progress || 0)} / ${DownloadCarrier.calculateSize(this.stats.size || 0)}`,
			size: DownloadCarrier.calculateSize(this.stats.size || 0),
			speed: `${DownloadCarrier.calculateSize(this.stats.speed || 0)}/s`,
			eta: `${new Date(this.stats.eta || Date.now()).toLocaleString()} (${new Date(this.stats.eta - Date.now()).print()})` || 0,
			elapsedTime: this.stats.elapsedTime || 0,
			parts: `${this.stats.chunks_done || 0} / ${this.stats.total_chunks || 0}`,
			path: this.stats.path || "",
			url: this.url || "",
			headers: this.customHeaders || "",
			headersExpanded: this.headersExpanded || false,
			error: this.stats.error || "None",
		};

		if (filter) {
			const returnProps = {};

			for (let i in filter) {
				if (i in props) {
					returnProps[i] = props[i];
				}
			}

			return returnProps;
		}
		return props;
	}

	toggleHeaders() {
		this.headersExpanded = !this.headersExpanded;
	}

	update(info) {
		this.stats = Object.assign({}, this.stats, info);
		if (Date.now() - this.last_update > 800 || info.done) {
			this.last_update = Date.now();
			this.emit("update", this.stats);
		}
	}

	error(err) {
		this.emit("error", err);
	}

	static calculateSize(bytes) {
		let output = bytes;
		let steps = 0;

		let units = [];

		if (window.localStorage.getItem('preferredUnit') === "bin") {
			units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];

			while (output > 1024) {
				output /= 1024;
				steps++;
			}
		} else if (window.localStorage.getItem('preferredUnit') === "dec") {
			units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

			while (output > 1000) {
				output /= 1000;
				steps++;
			}
		}

		return parseFloat(output).toFixed(2) + " " + units[steps];
	}
}