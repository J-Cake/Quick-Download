import React from 'react';

export default class Progress extends React.Component {
	render() {
		// console.log(this.props.value);
		return (
			<div className={"progress-bar" + this.props.className}>
				<div className="progress-bar-wrapper">
					<Filler progress={this.props.value}/>
				</div>
				<div className={"progress-visual"}>
					<span>
						{Math.floor(Number(this.props.value)) + "%"}
					</span>
				</div>
			</div>
		);
	}
}

const Filler = props => <div className="progress-bar-inner" style={{width: `${props.progress}%`}}/>;