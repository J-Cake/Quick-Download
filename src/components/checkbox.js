import React from 'react';

export default class Checkbox extends React.Component {
	state = {
		checked: this.props.checked
	};

	render() {
		return (
			<div className={"checkbox"}
				 onClick={() => (void this.setState(prev => ({checked: !prev.checked}))) || this.props.onChange(!this.state.checked)}>
				<span className={"label"}>{this.props.text}</span>
				<span className={"indicator" + (this.state.checked ? " checked" : "")}/>
			</div>
		);
	}
}