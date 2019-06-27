import React from "react";

export default class DownloadProperty extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={"download-detail"}>
                <b>{this.props.property}: </b>
                {
                    this.props.noWrap ?
                        <pre onClick={e => this.props.onClick && this.props.onClick(e)}>{this.props.value}</pre> :
                        <span onClick={e => this.props.onClick && this.props.onClick(e)}
                              className={"monospace"}>{this.props.value}</span>
                }
            </div>
        );
    }
}

