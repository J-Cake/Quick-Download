import React from 'react';

export default class Tool extends React.Component {
	render() {
		console.log(this.props);
		return (
			<button className="tool">
				<i className="fas fa-plus"/>
			</button>
		)
	}
}