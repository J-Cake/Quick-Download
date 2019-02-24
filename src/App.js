import React, { Component } from 'react';

import './css/App.css';
import './css/box.css';

import * as Mousetrap from "mousetrap";

import Tool from './components/tool';
import Download from './components/download';
import WindowFrame from './components/windowframe';
import Alert from './components/alert';
import {$} from './components/utils'

const _electron = window.require('electron');
const remote = _electron.remote;

let platform = remote.require('os').platform();

if (platform !== "win32" && platform !== "darwin")
	platform = "other";

class App extends Component {
	settingsVisible = true;

	constructor(...args) {
		super(...args);
		document.title = "Quick Downloader";

		this.state = {
			downloads: [],
			promptShowing: false,
			downloadName: "",
			downloadURL: "",
			boxes: []
		};
	}

	alert(box) {
		this.setState(prev => ({boxes: [...prev.boxes, box]}));
		console.log("showing box");
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
		if (this.state.downloadURL) {
			this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url={this.state.downloadURL} name={this.state.downloadName}/>]});
			this.closePrompt();

			if (!this.state.stopSave)
				App.addToDownloadHistory(this.state.downloadURL, this.state.downloadName);

			this.setState({stopSave: true});
		} else {
			this.setState({requiredField: true});
		}
	}

	static addToDownloadHistory(url, name) {
		const _downloadHistory = JSON.parse(window.localStorage.downloadHistory);
		_downloadHistory.push({url, name});

		window.localStorage.downloadHistory = JSON.stringify(_downloadHistory);
	}

	static getDownloadNames() {
		return JSON.parse(window.localStorage.downloadHistory).map(i => i.name);
	}

	static getDownloadUrls() {
		return JSON.parse(window.localStorage.downloadHistory).map(i => i.url);
	}

	componentDidMount() {
		if (!window.localStorage.downloadHistory)
			window.localStorage.downloadHistory = JSON.stringify([]);

		try {
			Mousetrap.bind('ctrl+n', () => this.showPrompt());
			Mousetrap.bind('esc', () => {
				this.closePrompt();
			});
			Mousetrap.bind('ctrl+j', () => this.pastDownloads());
			Mousetrap.bind('f11', () => remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen()));
		} catch (e) {
			this.alert(<Alert key={new Date().toLocaleString()} header={"An error has occurred"} body={"A dependency has failed to load, keyboard shortcuts will be disabled. Otherwise, everything else should work."}/>)
		}
	}

	acceptSuggestion(number) {
		const names = App.getDownloadNames(),
			urls = App.getDownloadUrls();

		this.setState({
			downloadURL: urls[number],
			downloadName: names[number]
		});

		this.setState({
			stopSave: true
		});

		$('.suggestions').style.display = "none";
	}

	showSettings() {
		this.settingsVisible = !this.settingsVisible;
	}

	static confirmExit() {
		window.close();
	}

	pastDownloads() {

	}

	about() {
		console.log(window.process.versions);
		this.alert(<Alert key={new Date().toLocaleString()} header={"About"} body={<div>
			<ul className={"about-details"}>
				<li>
					<b>Node Version: </b>
					<span>{window.process.versions.node}</span>
				</li>
				<li>
					<b>Electron Version: </b>
					<span>{window.process.versions.electron}</span>
				</li>
				<li>
					<b>Chromium Version: </b>
					<span>{window.process.versions.chrome}</span>
				</li>
				<li>
					<b>V8 Version: </b>
					<span>{window.process.versions.v8}</span>
				</li>
				<li>
					<b>React Version: </b>
					<span>{React.version}</span>
				</li>
			</ul>
		</div>}/>)
	}

	// hello world

	render() {
		return (
			<div className="wrapper">
				<WindowFrame/>
				<div className="App">
					<header>
						<Tool shortcut="+" onClick={e => this.showPrompt()} icon={"fas fa-plus"}/>
						<div className={"menu"}>
							<div className={"submenu"}>
								<label className={"menuTitle"}>File</label>
								<div className={"options"}>
									<div onClick={e => this.showPrompt()} className={"option"}>
										New Download
										<div className={"accelerator"}>
											{platform === "darwin" ? "Cmd+N" : "Ctrl+N"}
										</div>
									</div>
									<div className={"option"}>
										Show Past Downloads
										<div className={"accelerator"}>
											{platform === "darwin" ? "Cmd+J" : "Ctrl+J"}
										</div>
									</div>
									<hr/>
									<div onClick={() => App.confirmExit()} className={"option"}>
										Exit
										<div className={"accelerator"}>
											{platform === "darwin" ? "Cmd+W" : "Ctrl+W"}
										</div>
									</div>
								</div>
							</div>
							<div className={"submenu"}>
								<label className={"menuTitle"}>View</label>
								<div className={"options"}>
									<div className={"option"}>
										<div className={"submenu"}>
											<label className={"menuTitle"}>Theme</label>
											<div className={"options"}>
												<div className={"option"}>
													Dark
												</div>
											</div>
										</div>
									</div>
									<div className={"option"} onClick={() => remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen())}>
										Full Screen
										<div className={"accelerator"}>
											F11
										</div>
									</div>
								</div>
							</div>
							<div className={"submenu"}>
								<label className={"menuTitle"}>Help</label>
								<div className={"options"}>
									<div className={"option"} onClick={() => this.about()}>About</div>
									<div className={"option"}>Docs</div>
								</div>
							</div>
						</div>
					</header>

					<div className="downloads">
						{this.state.downloads}
					</div>

					{this.state.promptShowing ?
						<div className="prompt">
							<div className={"right-align"}>
								<Tool className={"prompt-close-btn"} icon={"fas fa-times"}
								      onClick={e => this.closePrompt()}/>
							</div>

							<div className={"formItem"}>
								<label htmlFor={"dl-name"}>The file name of the download</label>
								<input value={this.state.downloadName}
								       onChange={e => this.setState({downloadName: e.target.value})}
								       className={"dl-name"} id={"dl-name"} placeholder={"Download Name"}/>
								<div className={"suggestions"}>
									{App.getDownloadNames().map((i, a) => <div key={a} className={"suggestion"}><span
										onClick={() => this.acceptSuggestion(a)}>{i}</span><br/></div>)}
								</div>
							</div>

							<div className={"formItem"}>
								<label htmlFor={"dl-url"}>The location of the file to download</label>
								<input value={this.state.downloadURL}
								       onChange={e => this.setState({downloadURL: e.target.value})}
								       className={"url" + " " + this.state.required ? "required" : ""} id={"dl-url"}
								       placeholder={"Download URL"}/>
								<div className={"suggestions"}>
									{App.getDownloadUrls().map((i, a) => <div key={a} className={"suggestion"}><span
										onClick={() => this.acceptSuggestion(a)}>{i}</span><br/></div>)}
								</div>
							</div>

							<div className={"right-align"}>
								<Tool className={"confirm-btn"} icon={"fas fa-check"}
								      onClick={() => this.beginDownload()}/>
							</div>
						</div>
						: undefined
					}
				</div>
				<div className={"box-display-area"}>
					{this.state.boxes}
				</div>
			</div>
		);
	}
}

export default App;