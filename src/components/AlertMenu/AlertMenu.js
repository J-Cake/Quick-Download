import React from 'react';
import StandardMenu from "../Shared/StandardMenu/StandardMenu";

export default class AlertMenu extends React.Component {
    constructor(props) {
        super(props);

        this.menu = React.createRef();
    }

    render() {
        return (
            <StandardMenu title={"New Download"} ref={this.menu}>
                {this.props.children}
            </StandardMenu>
        )
    }
}
