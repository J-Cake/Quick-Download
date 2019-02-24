import React from 'react';
import Tool from './tool';
import Progress from './progress';

import * as path from "path";

import beginDownload from '../download.js';

const os = window.require('os');
const {shell} = window.require('electron');

export default class Download extends React.Component {
	constructor() {
		super(...arguments);
		this.state = {
			url: arguments[0].url,
			size: /*get size*/ "Calculating...",
			progress: /*calculate progress*/ 0,
			timeStarted: Date.now(),
			chunks_done: 0,
			total_chunks: "Loading...",
			chunkSize: 1024,
			details: false,
			fileName: this.props.name,
			status: 0,
			path: ""
		};
		this.startDownload();
	}

	startDownload() {
		this.download = beginDownload(this.state.url, this.state.fileName, path.join(window.localStorage.saveLocation || path.join(os.homedir(), 'Downloads')), async info => {
			// console.log(info);
			this.setState({
				progress: info.percentage,
				size: info.size,
				total_chunks: info.total_chunks,
				chunks_done: info.chunks_done,
				status: info.done ? 2 : 0,
				path: info.path
			});

			this.cancelDownload = info.cancel
		}).catch(e => {
			console.error(e);
			this.setState({
				status: 1
			})
		});
	}

	toggleDetails() {
		this.setState(prevState => ({details: !prevState.details}));
	}

	open() {
		shell.openItem(this.state.path);
	}

	render() {
		return (
			<div className={"download" + (this.state.status === 1 ? " failed" : this.state.status === 2 ? " done" : "")}>
				<div className="header">
					<h2>{this.state.fileName}</h2>
					<div className="tools">
						{this.state.status === 2 ?
							<Tool className="open-in-folder" onClick={e => this.open()} icon={"fas fa-folder"} /> : null}
						{this.state.status === 1 ?
							<Tool className="retry" onClick={e => this.startDownload()} icon={"fas fa-redo-alt"} /> : null}
						<Tool className="show-download-details" onClick={e => this.toggleDetails()} icon={!this.state.details ? "fas fa-chevron-left" : "fas fa-chevron-down"} />
						<Tool className="download-cancel-btn" onClick={e => this.cancelDownload(this)} icon={"fas fa-times"} />
					</div>
				</div>
				{this.state.details ?
					<div className="download-details">
						<span className="download-detail"><b>Final File Destination: </b>{this.state.path}</span>
						<span className="download-detail"><b>Source: </b>{this.state.url}</span>
						<span className="download-detail"><b>Size: </b>{this.state.size} bytes</span>
						<span
							className="download-detail"><b>Estimated Time of completion: </b>{/*Calculate completion time*/}Today</span>
						<span
							className="download-detail"><b>Chunks downloaded: </b>{this.state.chunks_done} of {this.state.total_chunks}</span>
					</div>
					: undefined
				}

				{this.state.status === 0 ? <Progress className={this.state.status === 1 ? "failed" : this.state.status === 2 ? "done" : ""} value={this.state.progress} /> : null}
			</div>
		);
	}
}