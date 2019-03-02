import React from 'react';

export default class Tool extends React.Component {
	render() {
		return (
			<button className={"tool " + this.props.className} onClick={this.props.onClick}>
				<i className={this.props.icon}/>
			</button>
		)
	}
}