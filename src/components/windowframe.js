import React from 'react';
import '../css/frame.css';

import {$} from './utils';

const _electron = window.require('electron');
const remote = _electron.remote;
const _window = remote.getCurrentWindow();

const Mousetrap = window.require('mousetrap');

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
			restore: false,
			showMenu: false
		}
	}

	componentDidMount() {
		Mousetrap.bind('alt', () => this.setState(prev => ({showMenu: !prev.showMenu})));

		if ($(".titlebar")) {
			$(".min-btn").on("click", e => {
				_window.minimize();
			});
			$(".max-btn").on("click", e => {
				if (platform !== "darwin")
					_window.maximize();
				else
					_window.setFullScreen(true)
			});
			$(".restore-btn").on("click", e => {
				if (platform !== "darwin")
					_window.restore();
				else
					_window.setFullScreen(false)
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
		if (!_window.frame) {
			return (
				<header style={{display: _window.isFullScreen() ? "none" : "block"}} className={`titlebar ${platform}`}>
					<div className={`drag-region ${platform}`}>
						<div className={`window-title ${platform}`}>
							<img src={"./favicon.ico"} className={`icon ${platform}`} alt={"Quick Downloader"}/>
							<span>Quick Downloader</span>
						</div>

						{this.state.showMenu || !(window.localStorage.autoHideMenuBar === "true") ?
							<nav className="menu">
								<div className={"category"}>
									<div className="category-name">File</div>
									<div className={"options"}>
										<div className={"option"} onClick={() => this.props.newDownload()}><label>New Download</label><span
											className={"accelerator"}>CTRL+N</span></div>
									</div>
								</div>
								<div className={"category"}>
									<div className={"category-name"}>View</div>
									<div className={"options"}>
										<div className={"option"}>
											<div className="category">
												<div className={"category-name"}>Theme</div>
												<div className={"options"}>
													<div className={"option"}>Light</div>
													<div className={"option"}>Dark</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</nav> : null}

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
				<div>
					No Header
				</div>
			)
		}
	}
}