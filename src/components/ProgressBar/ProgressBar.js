import React from 'react';

import './ProgressBar.css';

export default class ProgressBar extends React.Component {
	render() {
		return (
			<div className={"progress-bar"}>
				<div className="progress-bar-wrapper">
					<div className="progress-bar-inner" style={{width: `${this.props.value}%`}}/>
				</div>
			</div>
		);
	}
}
