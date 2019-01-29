import React from 'react';
import Tool from './tool';
import Progress from './progress';

export default class Download extends React.Component {
	constructor() {
		super(...arguments);
		this.state = {
			url: arguments[0].url,
			size: /*get size*/ "calculating",
			progress: /*calculate progress*/ 0,
			timeStarted: Date.now(),
			chunks: new Array(1).fill(0),
			chunkSize: 1024,
			details: false,
			fileName: this.props.name
		};

		this.state.totalChunks = /*get total chunks*/ this.state.size / this.state.chunkSize;
		console.log(arguments[0].url);
	}

	cancelDownload() {
		// Cancel download somehow
	}
	toggleDetails() {
		console.log(this.state);
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
							className="download-detail"><b>Chunks downloaded: </b>{this.state.chunks.reduce((a, i) => a += i ? 1 : 0)} / {this.state.totalChunks}</span>
					</div>
					: undefined
				}

				<Progress value={this.state.progress} />
			</div>
		);
	}
}