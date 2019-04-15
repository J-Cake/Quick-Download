import React from 'react';
import '../css/frame.css';
import '../css/nav_bar.css';


import { $ } from './utils';
import Tool from "./tool";

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
			restore: false,
			showMenu: false,
		}
	}

	componentDidMount() {
		Mousetrap.bind('alt', () => this.setState(prev => ({ showMenu: !prev.showMenu })));

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
		this.setState({ restore: _window.isMaximized() });
	}

	render() {
		if (!_window.frame) {
			return ( <
				header style = { { display: _window.isFullScreen() ? "none" : "block" } } className = { `titlebar` } >
				<
				div className = { `drag-region` } >
				<
				div className = { `window-title` } >
				<
				img src = { "./favicon.ico" } className = { `icon` } alt = { "Quick Downloader" }
				/> <
				span > Quick Downloader < /span> <
				/div>

				{
					platform === "win32" ?
						<
						div className = { "nav_bar_container" } >
						<
						div className = "nav_bar_wrapper" >
						<
						div className = "nav_item" > File <
						div className = "nav_dropdown" >
						<
						div onClick = { e => this.props.download() } > New Download < /div> <
						/div> <
						/div> <
						div className = "nav_item" > View <
						div className = "nav_dropdown" >
						<
						div > Theme <
						div className = "nav_dropdown" >
						<
						div > Light < /div> <
						div > Dark < /div> <
						/div> <
						/div> <
						/div> <
						/div> <
						div className = "nav_item" > Help <
						div className = "nav_dropdown" >
						<
						div onClick = { e => this.props.contact() } > Contact Developers < /div> <
						div onClick = { e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download") } > Learn More < /div> <
						div onClick = { e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download") } > Contribute < /div> <
						div onClick = { e => this.props.about() } > About < /div> <
						div onClick = { e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download") } > Docs < /div> <
						/div> <
						/div> <
						/div> <
						/div> :
						null
				} <
				div className = { `window-controls ${platform}` } >
				<
				div className = { `button min-btn ${platform}` } >
				<
				span > { platform === "win32" ? "" : "" } < /span> <
				/div> <
				div className = { `button max-btn ${platform}` } style = { { display: !this.state.restore ? "inherit" : "none" } } >
				<
				span > { platform === "win32" ? "" : "" } < /span> <
				/div> <
				div className = { `button restore-btn ${platform}` } style = { { display: this.state.restore ? "inherit" : "none" } } >
				<
				span > { platform === "win32" ? "" : "" } < /span> <
				/div> <
				div className = { `button close-btn ${platform}` } >
				<
				span > { platform === "win32" ? "" : "" } < /span> <
				/div> <
				/div> <
				/div> <
				/header>
			);
		} else {
			return ( <
				div >
				No Header <
				/div>
			)
		}
	}
}