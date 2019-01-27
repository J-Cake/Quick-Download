import React from 'react';
import Tool from "./App";
import Download from './download';

export default class Prompt extends React.Component {
	constructor() {
		super(...arguments);

		this.downloadName = "";
		this.downloadURL = "";

		this.closePrompt = this.props.closePrompt;
	}
	render() {
		return (
			<div className="prompt">
				<div className={"right-align"}>
					<Tool className={"prompt-close-btn"} icon={"fas fa-times"} onClick={e => this.closePrompt()} />
				</div>

				<label htmlFor={"dl-name"}>The file name of the download</label>
				<input onChange={e => this.setState(prevState => ({downloadName: e.target.value}))} className={"dl-name"} id={"dl-name"} placeholder={"Download Name"} />

				<label htmlFor={"dl-url"}>The location of the file to download</label>
				<input onChange={e => this.setState(prevState => ({downloadURL: e.target.value}))} className={"url"} id={"dl-url"} placeholder={"Download URL"} />

				<div className={"right-align"}>
					<Tool className={"confirm-btn"} icon={"fas fa-check"}
					      onClick={() => void this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url="http://jacob-schneider.ga/hosted-content/bbb.mp4"/>]}) || this.closePrompt()} />
				</div>
			</div>
		)
	}
}