import React, { Component } from 'react';
import './css/App.css';
import Tool from './tool';
import Download from './download';

class App extends Component {
	constructor(...args) {
		super(...args);
		document.title = "Quick Downloader";

		this.state = {
			downloads: [],
			promptShowing: false
		}
	} // onClick={() => this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url="http://jacob-schneider.ga/hosted-content/bbb.mp4"/>]})}

	showPrompt() {
		if (!this.state.promptShowing) {
			this.setState(prevState => ({promptShowing: !prevState.promptShowing}));
		}
	}

	closePrompt() {
		this.setState({promptShowing: false});
	}

	render() {
		return (
			<div className="wrapper">
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
							<input className={"dl-name"} id={"dl-name"} placeholder={"Download Name"} />

							<label htmlFor={"dl-url"}>The location of the file to download</label>
							<input className={"url"} id={"dl-url"} placeholder={"Download URL"} />

							<div className={"right-align"}>
								<Tool className={"confirm-btn"} icon={"fas fa-check"}
								      onClick={() => void this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url="http://jacob-schneider.ga/hosted-content/bbb.mp4"/>]}) || this.closePrompt()} />
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
