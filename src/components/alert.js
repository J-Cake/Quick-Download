import React from 'react';
import Tool from "./tool";

export default class Alert extends React.Component {
	state = {
		showing: true
	};

	render() {
		if (this.state.showing)
			return (
				<div className={"prompt_wrapper"}>
					<div className={"prompt_content_container"}>
						<div className={"prompt_close_button"}>
							<Tool icon={"fas fa-times"}
								  onClick={e => this.setState({showing: false})}/>

						</div>
						<div className={"prompt_content_wrapper"}>
							<header className={"settings_header"}>
								{this.props.header}
							</header>
							{this.props.body}
						</div>
					</div>
				</div>
			);
		else
			return null;
	}
}