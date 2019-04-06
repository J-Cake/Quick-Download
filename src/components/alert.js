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
						<div className={"prompt_content_wrapper"}>
							<header className={"prompt_header"}>
								<h1>{this.props.header || "About"}</h1>
								<div className={"prompt_close_button"}>
									<Tool icon={"fas fa-times"}
										  onClick={e => this.setState({showing: false})}/>

								</div>
							</header>
							<br />
							{this.props.children || this.props.body}
						</div>
					</div>
				</div>
			);
		else
			return null;
	}
}