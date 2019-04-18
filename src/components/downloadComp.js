import React from 'react';
import Tool from './tool';
import Progress from './progress';
import Download from '../download';

import Alert from './alert';

const fs = window.require('fs');
const path = window.require('path');

const os = window.require('os');
const {shell} = window.require('electron');

export default class DownloadComp extends React.Component {
	constructor() {
		super(...arguments);
		this.state = {
			url: arguments[0].url,
			customHeaders: arguments[0].customHeaders,
			size: 0,
			progress: 0,
			eta: 0,
			timeStarted: Date.now(),
			chunks_done: 0,
			total_chunks: 0,
			chunkSize: 1024,
			details: false,
			fileName: this.props.name,
			status: 3,
			path: "",
			id: this.props.id,
			error: "None",
			prevStatus: 3
		};
		this.past_percent = 0;

		// this.startDownload();
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

	update_percent(percent) {
		percent = Math.round(percent * 1000) / 1000;
		if (percent - this.past_percent >= 1) {
			this.past_percent = percent;
			this.setState({
				progress: percent
			})
		}
	}

	async startDownload() {

		this.setState({status: 4});

		const start = async () => {
			let proxyOptions;
			proxyOptions = false;
			this.download = new Download();
			if (window.localStorage.proxySettings === "auth") {
				proxyOptions = {
					hostname: window.localStorage.proxyHost,
					port: window.localStorage.proxyPort,
					auth: (window.localStorage.proxyRequiresCredentials === "true") ? {
						username: window.localStorage.proxyUsername,
						password: window.localStorage.proxyPassword,
					} : false,
				};
			}
			await this.download.init(this.state.url, this.state.fileName, window.localStorage.saveLocation || path.join(os.homedir(), 'Downloads'), Number(window.localStorage.partsToCreate), async info => {
				await this.setState(prev => ({
					size: info.size,
					progress: info.percentage,
					completedBytes: info.completedBytes,
					speed: info.speed,
					total_chunks: info.total_chunks,
					chunks_done: info.chunks_done,
					status: info.done ? 2 : info.error ? 1 : 0,
					path: info.path,
					eta: info.eta,
					elapsedTime: info.elapsedTime,
					error: info.error || "None",
					prevStatus: prev.status
				}));

				if (info.done) {
					this.props.onComplete.bind(this)();
				}

				if (this.state.prevStatus !== this.state.status)
					this.props.onStatusChange.bind(this)(this.state.status);

			}, JSON.parse(this.state.customHeaders || '{}'), proxyOptions, error => {
				this.props.alert(<Alert key={new Date().toLocaleString()} header={"Error"} body={error}/>)
				this.props.onComplete.bind(this);
			});

			this.setState({
				status: 3
			});
			 this.download.beginDownload().then(() => {
				if (this.state.status === 2 && window.localStorage.getItem('allowNotifications') === "true") {
					new Notification('DownloadComp Complete', {
						body: `Download of ${this.state.fileName} has been completed`,
						icon: "./favicon.ico"
					}).onclick = () => window.require('electron').remote.getCurrentWindow().focus();
				}

				this.props.updateTaskBarProgress(this.state.id, this.state.progress || 0);
			}).catch(e => {
				this.setState({
					status: 1
				});
				this.props.onComplete.bind(this);
			});
		};

		const fullFile = Download.getFileName(this.state.fileName, window.localStorage.saveLocation, this.state.url);

		if (fs.existsSync(fullFile)) {
			let _ref;
			this.props.alert(<Alert noClose={true} ref={ref => _ref = ref} key={new Date().getTime().toLocaleString()}
									header={"File already exists"}>
				<div>
					The file "{fullFile.split('/').pop()}" already exists. You can replace it or keep it or rename the
					download.

					<br/>
					<br/>

					<b>Note:</b> If you choose to keep it, the file's contents will not be deleted, instead additional
					content will be appended to it. This will render the resulting and the original files unusable.

					<br/>
					<br/>

					<div className={"right"}>
						<button onClick={async () => {
							while (fs.existsSync(Download.getFileName(this.state.fileName, window.localStorage.saveLocation, this.state.url)))
								await this.setState(prev => ({fileName: prev.fileName + " 2"}));

							_ref.setState({showing: false});
							await start();
						}}>Rename
						</button>

						<button onClick={async () => {
							fs.unlinkSync(fullFile);
							_ref.setState({showing: false});
							await start();
						}}>Overwrite
						</button>

						<button onClick={async () => {
							_ref.setState({showing: false});
							await start()
						}}>Keep
						</button>

						<button onClick={() => {
							_ref.setState({showing: false});
							this.props.remove.bind(this)();
						}}>Cancel
						</button>
					</div>
				</div>
			</Alert>);
		} else
			await start();
	}

	toggleDetails() {
		this.setState(prevState => ({details: !prevState.details}));
	}

	open() {
		shell.showItemInFolder(this.state.path);
	}

	getStatus() {
		return this.state.status;
	}

	render() {
		return (
			<div className={"download" + (this.state.status === 1 ? " failed" : this.state.status === 2 ? " done" : (this.state.status === 3 ? " pending" : (this.state.status === 4 ? " awaiting" : "")))}>
				<div className="header">
					<div className={"flex"}>
						<span className={"progress"}>{Math.floor(this.state.progress)}%</span>
						<h2>{this.state.fileName}</h2>
					</div>
					<div className="tools">
						{this.state.status === 2 ?
							<Tool className="open-in-folder" onClick={() => this.open()}
								  icon={"fas fa-folder"}/> : null}
						{this.state.status === 1 ?
							<Tool className="retry" onClick={() => this.startDownload()}
								  icon={"fas fa-redo-alt"}/> : null}
						<Tool className="show-download-details" onClick={() => this.toggleDetails()}
							  icon={!this.state.details ? "fas fa-chevron-left" : "fas fa-chevron-down"}/>
						{this.state.status === 0 ?
							<Tool className="download-cancel-btn" onClick={async () => {
								await this.download.cancel();
								this.setState({
									status: 1,
								});
								await this.props.onStatusChange.bind(this)(this.state.status);
							}} icon={"fas fa-times"}/> : <Tool className="download-trash-btn" onClick={() => {
								this.props.remove.bind(this)();
							}} icon={"fas fa-trash"}/>
						}
					</div>
				</div>
				{this.state.details ?
					<div className="download-details">
						<span className="download-detail"><b>Elapsed Time: </b>
							{this.state.elapsedTime}</span>
						<span className={"download-detail"}><b>Speed: </b>
							<span
								className={"monospace"}>{DownloadComp.calculateSize(this.state.speed)}/s {this.state.speed} B/s</span></span>
						<span className="download-detail"><b>Final File Destination: </b>
							{this.state.path}</span>
						<span className="download-detail"><b>Source: </b>
							{this.state.url}</span>
						<span className="download-detail"><b>Error: </b>
							{this.state.error}</span>
						<span className="download-detail"><b>Size: </b>
							{DownloadComp.calculateSize(this.state.size)} ({this.state.size} bytes)</span>
						<span className="download-detail"><b>Estimated Time of completion: </b>
							<span className={"monospace"}> {this.state.eta} </span></span>
						<span className="download-detail"><b>Parts downloaded: </b>
							{this.state.chunks_done} of {this.state.total_chunks}</span>
						<span className="download-detail"><b>Progress: </b>
							<span className={"monospace"}> ({DownloadComp.calculateSize(this.state.completedBytes)} / {DownloadComp.calculateSize(this.state.size)}) {this.state.progress}%</span></span>
					</div>
					: undefined
				}

				{this.state.status === 0 ?
					<Progress className={this.state.status === 1 ? "failed" : this.state.status === 2 ? "done" : ""}
							  value={this.state.progress}/> : null}
			</div>
		);
	}
}
