import './AboutMenu.css';

import React from 'react';
import StandardMenu from "../Shared/StandardMenu/StandardMenu";

export default class DownloadMenu extends React.Component {
    constructor(props) {
        super(props);

        this.menu = React.createRef();
    }

    render() {
        return (
            <StandardMenu title={"New Download"} ref={this.menu}>
                    <ul className={"about-details"}>
                        <li>
                            <b>Quick Downloader Version: </b>
                            <span>{this.props.version}</span>
                        </li>
                        <li>
                            <b>Node Version: </b>
                            <span>{window.process.versions.node}</span>
                        </li>
                        <li>
                            <b>Electron Version: </b>
                            <span>{window.process.versions.electron}</span>
                        </li>
                        <li>
                            <b>Chromium Version: </b>
                            <span>{window.process.versions.chrome}</span>
                        </li>
                        <li>
                            <b>V8 Version: </b>
                            <span>{window.process.versions.v8}</span>
                        </li>
                        <li>
                            <b>React Version: </b>
                            <span>{React.version}</span>
                        </li>
                    </ul>
            </StandardMenu>
        )
    }
}
