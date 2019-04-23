import Download from './Download';
import DownloadDisplayComp from './components/downloadCompDisplay';
import React from "react";

Date.prototype.print = function() {
	return `${this.getUTCHours() || 0}h:${this.getUTCMinutes() || 0}m:${this.getUTCSeconds() || 0}s`;
};

export default class DownloadCarrier {
	constructor(url, name, headers) {
		this.url = url;
		this.name = name;
		this.customHeaders = JSON.parse(headers);

		this.headersExpanded = false;

		this.status = 3;

		this.done = false;

		this.stats = {};

		this.stages = {};

		this.functions = {
			cancel: this.cancel,
			remove: this.remove,
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

	render(key) {
		return <DownloadDisplayComp key={key} status={this.status} functions={this.functions} content={this.prettyProps()}/>
	}

	cancel() {
		if (this.download)
			this.download.cancel();
	}

	remove() {
		// remove the download somehow
	}

	async startDownload() {
		this.runStage("Init");
		this.download = new Download();

		this.download.on('update', info => this.update(info));
		this.download.on('error', err => this.error(err));

		this.download.on('close', data => (this.done = true) && this.runStage("Finished", data));

		await this.download.init(this.url, this.name, window.localStorage.saveLocation, Number(window.localStorage.partsToCreate), this.customHeaders, this.proxyOptions || false);

		let stage = this.download.beginDownload();
		for await (const currentStage of stage) {
			this.runStage(currentStage, this);
		} // new JS proposal. Works in node v10+. allows the use of `async` generator functions
	}

	stage(stage, callback) { // small event handling system. It's quite easy to use, define the event name (`stage`) and the handler (`callback`).
		this.stages[stage] = callback;
	}

	runStage(stage, info) {
		if (this.stages[stage])
			this.stages[stage].bind(this)(info);
	}

	prettyProps(filter) {
		const props = {
			percentage: Number(parseFloat(this.stats.percentage || 0).toFixed(7)),
			progress: `${DownloadCarrier.calculateSize(this.stats.progress) || 0} / ${DownloadCarrier.calculateSize(this.stats.size) || 0}`,
			size: DownloadCarrier.calculateSize(this.stats.size) || 0,
			speed: `${DownloadCarrier.calculateSize(this.stats.speed) || 0}/s`,
			eta: `${new Date(this.stats.eta || Date.now()).toLocaleString()} (${new Date(this.stats.eta - Date.now()).print()})` || 0,
			elapsedTime: this.stats.elapsedTime || 0,
			parts: `${this.stats.chunks_done || 0} / ${this.stats.total_chunks || 0}`,
			path: this.stats.path || "",
			url: this.url || "",
			headers: this.customHeaders || "",
			headersExpanded: this.headersExpanded || false
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
		this.stats = info;
		this.runStage("Update", this.stats);
	}

	error(err) {
		this.runStage("Error", err);
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