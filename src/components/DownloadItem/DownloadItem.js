import React from "react";
import ProgressBar from "../ProgressBar/ProgressBar";
import Tool from "../Shared/tool";

import Enum from '../../enum.js';
import DownloadProperty from "./DownloadProperty";

const {DownloadStatus} = Enum;

const _electron = window.require('electron');

export default class DownloadItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div
                className={`download ${this.props.status}`}>
                <div className="header">
                    <div className={"flex"}>
                        <span className={"progress"}>{this.props.stats.percentage}%</span>
                        <h2>{this.props.stats.filename}</h2>
                    </div>

                    <div className="flex">
                        {(() => {
                            switch (this.props.status) {
                                /*     case 0:
                                     case 3:
                                     case 4:*/
                                case DownloadStatus.FAILED:
                                    return [
                                        <Tool key={"option1"} left={true} tooltip={"Retry Download"}
                                              icon={"fas fa-redo"}
                                              onClick={() => this.this.props.functions.retry()}/>,
                                        <Tool key={"option2"} left={true} tooltip={"Remove Download From List"}
                                              icon={"fas fa-trash"}
                                              onClick={() => this.props.functions.remove()}/>
                                    ];
                                case DownloadStatus.DONE:
                                    return [
                                        <Tool key={"option1"} left={true} tooltip={"Show Download in folder"}
                                              icon={"fas fa-folder"}
                                              onClick={() => _electron.ipcRenderer.send('show-file',this.props.stats.path)}/>,
                                        <Tool key={"option2"} left={true} tooltip={"Remove Download From List"}
                                              icon={"fas fa-trash"}
                                              onClick={() => this.props.functions.remove()}/>
                                    ];
                                case DownloadStatus.STOPPED:
                                    return [
                                        <Tool key={"option1"} left={true} tooltip={"Retry Download"}
                                              icon={"fas fa-redo"}
                                              onClick={() => this.props.functions.retry()}/>,
                                        <Tool key={"option2"} left={true} tooltip={"Remove Download From List"}
                                              icon={"fas fa-trash"}
                                              onClick={() => this.props.functions.remove()}/>
                                    ];
                                default:
                                    return [
                                        <Tool key={"option1"} left={true} tooltip={"Cancel Download"}
                                              icon={"fas fa-times"}
                                              onClick={() => this.props.functions.cancel()}/>
                                    ];
                            }


                        })()}
                    </div>
                </div>
                {this.props.showDetails || true ?
                    <div className="download-details">
                        <DownloadProperty property={"Status"} value={this.props.status}/>
                        <DownloadProperty property={"Source"} value={this.props.status}/>
                        <DownloadProperty property={"Final File"} value={this.props.stats.url}/>
                        <DownloadProperty property={"Headers"} value={JSON.stringify(this.props.stats.headers, null, 2)}
                                          noWrap={this.props.stats.headersExpanded}
                                          onClick={() => this.props.functions.toggleHeaders()}/>
                        <DownloadProperty property={"Error"} value={this.props.stats.error}/>
                        <DownloadProperty property={"Size"} value={this.props.stats.size}/>
                        <DownloadProperty property={"Elapsed Time"} value={this.props.stats.elapsedTime}/>
                        <DownloadProperty property={"Estimated Time of Completion"} value={this.props.stats.eta}/>
                        <DownloadProperty property={"Speed"} value={this.props.stats.speed}/>
                        <DownloadProperty property={"Parts Done"} value={this.props.stats.partsDone}/>
                        <DownloadProperty property={"ProgressBar"}
                                          value={`${this.props.stats.progressInUnits} (${this.props.stats.percentage}%)`}/>
                    </div>
                    : null}

                {this.props.status === DownloadStatus.ACTIVE ?
                    <ProgressBar value={this.props.stats.percentage}/>
                    : null}
            </div>
        )
    }
}
