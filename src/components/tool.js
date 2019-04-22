import React from 'react';

export default class Tool extends React.Component {
	render() {
		return (
			<button className={"tool" + (this.props.className ? ` ${this.props.className}` : "")}
					onClick={this.props.onClick}>
				<i className={this.props.icon}/>
				{this.props.tooltip && !this.props.noToolTip ? <span className={`tool-tip ${this.props.left ? "left" : "buttom"}`}>{this.props.tooltip}</span> : ""}
			</button>
		)
	}
}