import React, { Component } from 'react';
import './css/App.css';
import Tool from './tool';
import Download from './download';
import WindowFrame from './windowframe';

class App extends Component {
	constructor(...args) {
		super(...args);
		document.title = "Quick Downloader";

		this.state = {
			downloads: [],
			promptShowing: false,
			downloadName: "",
			downloadURL: ""
		}
	}

	showPrompt() {
		if (!this.state.promptShowing) {
			this.setState(prevState => ({promptShowing: !prevState.promptShowing}));
		}
	}

	closePrompt() {
		this.setState({promptShowing: false});
	}

	beginDownload() {
		this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url={this.state.downloadURL} name={this.state.downloadName}/>]});
		this.closePrompt();

		App.addToDownloadHistory(this.state.downloadURL, this.state.downloadName);
	}

	static addToDownloadHistory(url, name) {
		const _downloadHistory = JSON.parse(window.localStorage.downloadHistory);
		_downloadHistory.push({url, name});

		window.localStorage.downloadHistory = JSON.stringify(_downloadHistory);
	}

	componentDidMount() {
		if (!window.localStorage.downloadHistory)
			window.localStorage.downloadHistory = JSON.stringify([{name: "Big Buck Bunny", url: "http://jacob-schneider/hosted-content/bbb.mp4"}]);
	}

	render() {
		return (
			<div className="wrapper">
				<WindowFrame />
				<div className="App">
					<header>
						<Tool shortcut="+" onClick={e => this.showPrompt()} icon={"fas fa-plus"}/>
					</header>
					<div className="downloads">
						{this.state.downloads}
					</div>

					{ this.state.promptShowing ?
						<div className="prompt">
							<div className={"right-align"}>
								<Tool className={"prompt-close-btn"} icon={"fas fa-times"} onClick={e => this.closePrompt()} />
							</div>

							<label htmlFor={"dl-name"}>The file name of the download</label>
							<input onChange={e => this.setState({downloadName: e.target.value})} className={"dl-name"} id={"dl-name"} placeholder={"Download Name"} />

							<label htmlFor={"dl-url"}>The location of the file to download</label>
							<input onChange={e => this.setState({downloadURL: e.target.value})} className={"url"} id={"dl-url"} placeholder={"Download URL"} />

							<div className={"right-align"}>
								<Tool className={"confirm-btn"} icon={"fas fa-check"}
								      onClick={() => this.beginDownload()} />
							</div>
						</div>
						: undefined
					}
				</div>
			</div>
		);
	}
}

export default App;
