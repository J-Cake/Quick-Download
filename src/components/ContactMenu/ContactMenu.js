import React from "react";
import Alert from "../Shared/alert";

const _electron = window.require('electron');

export default class ContactMenu extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (<Alert header={"About"} close={this.props.close}>
            <ul>
                <li><a target={"_blank"}
                       onClick={() => _electron.ipcRenderer.send('openURL', "https://joshbrown.info/#contact")}>Joshua
                    Brown</a>
                </li>
                <li><a target={"_blank"}
                       onClick={() => _electron.ipcRenderer.send('openURL', "https://www.jacob-schneider.ga/contact.html")}>Jacob
                    Schneider</a>
                </li>
                <br/>
                <b>Please submit issues to Github.</b>
            </ul>

        </Alert>);
    }
}
