import React from 'react';

export default class Tool extends React.Component {
	render() {
		console.log(this.props);
		return (
			<button className="tool" onClick={this.props.onClick}>
				<i className={this.props.icon}/>
			</button>
		)
	}
}