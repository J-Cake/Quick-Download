import React from 'react';
import Tool from './tool';
import Progress from './progress';

export default class Download extends React.Component {
	constructor() {
		super(...arguments);
		this.state = {
			url: arguments[0].url,
			size: /*get size*/ 512,
			progress: /*calculate progress*/ 50,
			timeStarted: Date.now(),
			chunks: [0],
			chunkSize: 8,
			details: true
		};

		this.state.totalChunks = /*get total chunks*/ this.state.size / this.state.chunkSize;
		console.log(arguments[0].url);
	}
	render() {
		return (
			<div className="download">
				<div className="download-details">
					<span className="download-detail"><b>Source: </b>{this.state.url}</span>
					<span className="download-detail"><b>Size: </b>{this.state.size} bytes</span>
					<span className="download-detail"><b>Estimated Time of completion: </b>{/*Calculate completion time*/}getting there</span>
					<span className="download-detail"><b>Chunks downloaded: </b>{this.state.chunks.reduce((a, i) => a += i ? 1 : 0)} / {this.state.totalChunks}</span>
				</div>
				<div className="tools">
					<Tool className="show-download-details" icon={!this.state.details ? "fas fa-chevron-left" : "fas fa-chevron-down"} />
					<Tool className="download-cancel-btn" icon={"fas fa-times"} />
				</div>

				<Progress value={this.state.progress} />
			</div>
		);
	}
}