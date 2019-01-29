import React from 'react';
import './css/frame.css';

import {$} from './utils';

const _electron = window.require('electron');
const remote = _electron.remote;
const _window = remote.getCurrentWindow();

export default class WindowFrame extends React.Component {
	constructor(...args) {
		super(...args);

		this.state = {
			restore: false
		}
	}

	componentDidMount() {
		$("#min-btn").on("click", e => {
			_window.minimize();
		});
		$("#max-btn").on("click", e => {
			_window.maximize();
		});
		$("#restore-btn").on("click", e => {
			_window.restore();
		});
		$("#close-btn").on("click", e => {
			_window.close();
		});

		this.updateButtons();

		_window.on('resize', () => this.updateButtons(), false);
	}

	updateButtons() {
		this.setState({restore: _window.isMaximized()});
	}

	render() {
		return (
			<header id="titlebar">
				<div id="drag-region">
					<div id="window-title">
						<span>Quick Downloader</span>
					</div>
					<div id="window-controls">
						<div className="button" id="min-btn">
							<span>&#xE921;</span>
						</div>
						<div className="button" id="max-btn" style={{display: !this.state.restore ? "inherit" : "none"}}>
							<span>&#xE922;</span>
						</div>
					<div className="button" id="restore-btn" style={{display: this.state.restore ? "inherit" : "none"}}>
							<span>&#xE923;</span>
						</div>
						<div className="button" id="close-btn">
							<span>&#xE8BB;</span>
						</div>
					</div>
				</div>
			</header>
		);
	}
}