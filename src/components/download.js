import React from 'react';
import Tool from './tool';
import Progress from './progress';

import * as path from "path";


import beginDownload from '../download.js';

const os = window.require('os');

export default class Download extends React.Component {
	constructor() {
		super(...arguments);
		this.state = {
			url: arguments[0].url,
			size: /*get size*/ "Calculating...",
			progress: /*calculate progress*/ 0,
			timeStarted: Date.now(),
			chunks_done: "0",
			total_chunks: "Loading...",
			chunkSize: 1024,
			details: false,
			fileName: this.props.name,
			status: 0
		};
		this.download = beginDownload(this.state.url, this.state.fileName, path.join(window.localStorage.saveLocation || path.join(os.homedir(), 'Downloads')), info => {
			console.log(info);
			this.setState({
				progress: info.percentage*100,
				size: info.size,
				total_chunks: info.total_chunks,
				chunks_done: info.chunks_done
			});
		});


		// while (!this.download.done && !this.download.failed) {
		// 	this.setState({progress: this.download.percentage, totalChunks: this.download.totalChunks});
		// 	console.log(this.download);
		//
		// 	this.download.next();
		// }
	}

	cancelDownload() {
		// Cancel download somehow
	}
	toggleDetails() {
		this.setState(prevState => ({details: !prevState.details}));
	}

	render() {
		return (
			<div className="download">
				<div className="header">
					<h2>{this.state.fileName}</h2>
					<div className="tools">
						<Tool className="show-download-details" onClick={e => this.toggleDetails()} icon={!this.state.details ? "fas fa-chevron-left" : "fas fa-chevron-down"} /> {/* */}
						<Tool className="download-cancel-btn" onClick={e => this.cancelDownload()} icon={"fas fa-times"} />
					</div>
				</div>
				{this.state.details ?
					<div className="download-details">
						<span className="download-detail"><b>Source: </b>{this.state.url}</span>
						<span className="download-detail"><b>Size: </b>{this.state.size} bytes</span>
						<span
							className="download-detail"><b>Estimated Time of completion: </b>{/*Calculate completion time*/}Today</span>
						<span
							className="download-detail"><b>Chunks downloaded: </b>{this.state.chunks_done} of {this.state.total_chunks}</span>
					</div>
					: undefined
				}

				<Progress className={this.state.status === 1 ? "failed" : ""} value={this.state.progress} />
				<Progress className={this.state.status === 1 ? "failed" : ""} value={(this.state.chunks_done/this.state.total_chunks)*100} />
			</div>
		);
	}
}