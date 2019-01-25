import React, { Component } from 'react';
import './css/App.css';
import Prescript from './prescript';
import Tool from './tool';

class App extends Component {
	render() {
		return (
			<div className="wrapper">
				<div className="App">
					<Prescript />
					<header>
						<Tool shortcut="+"/>
					</header>
				</div>
			</div>
		);
	}
}

export default App;
