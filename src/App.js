import React, { Component } from 'react';
import './css/App.css';
import Tool from './tool';
import Download from './download';

class App extends Component {
	constructor(...args) {
		super(...args);
		document.title = "Quick Downloader";

		this.state = {
			downloads: []
		}
	}

	render() {
		return (
			<div className="wrapper">
				<div className="App">
					<header>
						<Tool shortcut="+" onClick={() => this.setState({downloads: [...this.state.downloads, <Download key={Date.now()} url="http://jacob-schneider.ga/hosted-content/bbb.mp4"/>]})} icon={"fas fa-plus"}/>
					</header>
					<div className="downloads">
						{this.state.downloads}
					</div>
				</div>
			</div>
		);
	}
}

export default App;
