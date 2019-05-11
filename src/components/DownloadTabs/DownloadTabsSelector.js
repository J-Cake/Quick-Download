import './DownloadTabsSelector.css';
import React from 'react';

export default class DownloadTabsSelector extends React.Component {
    render() {
        return (
            <div className={"download-tabs"}>
				<span
                    onClick={() => {
                        this.props.displayTab(true);
                        this.forceUpdate();
                    }}
                    className={"tab " + (this.props.getActiveTab() ? "active" : "")}
                >
                    Queue
				</span>
                <span
                    onClick={() => {
                        this.props.displayTab(false);
                        this.forceUpdate();
                    }}
                    className={"tab " + (!this.props.getActiveTab() ? "active" : "")}
                >
                    Complete
                </span>
            </div>
        )
    }
}