import './DownloadTabsSelector.css';
import React from 'react';

import Enum from '../../enum.js';

const {Tabs} = Enum;


export default class DownloadTabsSelector extends React.Component {
    constructor(props){
        super(props);
    }
    render() {
        return (
            <div className={"download-tabs"}>
				<span
                    onClick={() => {
                        this.props.changeTab(Tabs.QUEUE);
                    }}
                    className={"tab " + (this.props.currentTab === Tabs.QUEUE ? "active" : "")}
                >
                    Queue
				</span>
                <span
                    onClick={() => {
                        this.props.changeTab(Tabs.COMPLETED);
                    }}
                    className={"tab " + (this.props.currentTab === Tabs.COMPLETED  ? "active" : "")}
                >
                    Complete
                </span>
            </div>
        )
    }
}
