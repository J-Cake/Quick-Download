import React from 'react';
import Tool from "./tool";

export default class Alert extends React.Component {
	state = {
		showing: true
	};

	render() {
		if (this.state.showing)
			return (
				<div className="alert">
					<div className="alert-header">
						{this.props.header}
					</div>
					<div className="alert-body">
						{this.props.body}
					</div>
					<div className={"right-align"}>
						<Tool className={"prompt-close-btn"} icon={"fas fa-check"} onClick={e => this.setState({showing: false})} />
					</div>
				</div>
			);
		else
			return null;
	}
}