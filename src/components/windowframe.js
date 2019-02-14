import React from 'react';
import '../css/frame.css';

import {$} from './utils';

const _electron = window.require('electron');
const remote = _electron.remote;
const _window = remote.getCurrentWindow();

window.localStorage.hasRelaunched = window.localStorage.hasRelaunched || "false";
window.localStorage.withFrame = window.localStorage.withFrame || 'true';

let platform = remote.require('os').platform();

if (platform !== "win32" && platform !== "darwin") {
	platform = "other";
	if (window.localStorage.hasRelaunched === "false") {
		window.localStorage.hasRelaunched = "true";
		window.localStorage.withFrame = "true";
		_electron.ipcRenderer.send('withFrame');
	} else {
		window.localStorage.hasRelaunched = "false";
		window.localStorage.withFrame = "false";
	}
} else {
	if (window.localStorage.withFrame === "true") {
		window.localStorage.withFrame = "false";
		window.localStorage.hasReloaded = "false";
		_electron.ipcRenderer.send('noFrame');
	}

	if (_window.frame) {
		_electron.ipcRenderer.send('noFrame');
	}
}

export default class WindowFrame extends React.Component {
	constructor(...args) {
		super(...args);

		this.state = {
			restore: false
		}
	}

	componentDidMount() {
		if ($(".titlebar")) {
			$(".min-btn").on("click", e => {
				_window.minimize();
			});
			$(".max-btn").on("click", e => {
				_window.maximize();
			});
			$(".restore-btn").on("click", e => {
				_window.restore();
			});
			$(".close-btn").on("click", e => {
				_window.close();
			});

			this.updateButtons();

			_window.on('resize', () => this.updateButtons(), false);
		}
	}

	updateButtons() {
		this.setState({restore: _window.isMaximized()});
	}

	render() {

		// console.log(platform);

		if (!_window.frame) {
			return (
				<header style={{display: _window.isFullScreen() ? "none" : "block"}} className={`titlebar ${platform}`}>
					<div className={`drag-region ${platform}`}>
						<div className={`window-title ${platform}`}>
							<img src={"./favicon.ico"} className={`icon ${platform}`} alt={"Quick Downloader"}/>
							<span>Quick Downloader</span>
						</div>
						<div className={`window-controls ${platform}`}>
							<div className={`button min-btn ${platform}`}>
								<span>{platform === "win32" ? "" : ""} </span>
							</div>
							<div className={`button max-btn ${platform}`}
							     style={{display: !this.state.restore ? "inherit" : "none"}}>
								<span>{platform === "win32" ? "" : ""}</span>
							</div>
							<div className={`button restore-btn ${platform}`}
							     style={{display: this.state.restore ? "inherit" : "none"}}>
								<span>{platform === "win32" ? "" : ""}</span>
							</div>
							<div className={`button close-btn ${platform}`}>
								<span>{platform === "win32" ? "" : ""}</span>
							</div>
						</div>
					</div>
				</header>
			);
		} else {
			return (
				<div/>
			)
		}
	}
}