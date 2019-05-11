import './HistoryMenu.css';

import React from 'react';
import StandardMenu from "../Shared/StandardMenu/StandardMenu";
import Tool from "../Shared/tool";
import Alert from "../Shared/alert";


export default class HistoryMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            downloadHistory: []
        };

        this.addToDownloadHistory = this.addToDownloadHistory.bind(this);
        this.removeDownload = this.removeDownload.bind(this);
        this.menu = React.createRef();
    }

    addToDownloadHistory(url, name, headers) {
        this.setState(prev => ({
           downloadHistory: [{url, name, headers},...prev.downloadHistory]
        }));
    }
    removeDownload(index){
        this.setState(prev => ({
            downloadHistory: prev.downloadHistory.filter((value, index1) => index1 !== index)
        }));
    }
    clearDownloads(){
        this.setState(prev => ({
            downloadHistory: []
        }));
    }
    async clearPrompt() {
        await new Promise(resolve => {
                let box;
                this.menu.current.emitter.emit("alert",
                    <Alert noClose={true}
                           ref={dialog => box = dialog}
                           key={new Date().getTime().toLocaleString()}
                           header={"Clear History"}>
                        <div>
                            Are you sure you would like to clear all past
                            downloads from history and suggestions? This
                            cannot be undone.
                            <div className={"right"}>
                                <button onClick={() => {
                                    this.menu.current.hide();
                                    resolve();
                                    box.setState({
                                        showing: false,
                                    });
                                }
                                }>No
                                </button>

                                <button onClick={() => {
                                    this.clearDownloads();
                                    this.menu.current.hide();
                                    resolve();
                                    box.setState({
                                        showing: false,
                                    });
                                }}>Yes
                                </button>

                            </div>
                        </div>
                    </Alert>);
            }
        );
        this.menu.current.show();
    }

    render() {
        return (
            <StandardMenu title={"History"} ref={this.menu}
                          header={

                              <div className={"flex"}>
                                  {this.state.downloadHistory.length > 1 ?
                                      <Tool left={true} tooltip={"Clear all history"} icon={"fas fa-trash"}
                                            onClick={async e => {
                                                this.setState({pastDownloadsVisible: false});
                                                await this.clearPrompt();
                                                this.setState({pastDownloadsVisible: true});
                                            }
                                            }/> : null}
                              </div>


                          }
            >
                {
                    this.state.downloadHistory.map(
                        (download, i) =>
                            <div
                                key={i}
                                className={"past-download"}>
                                <div className={"download-details"}>
                                    <div className={"download-name"}>{download.name}:</div>
                                    <div className={"download-url"}>{download.url}</div>
                                </div>

                                <div className={"delete"}>
                                    <Tool left={true} tooltip={"Remove item from history"}
                                          icon={"fas fa-trash"}
                                          onClick={() => {
                                             this.removeDownload(i)
                                          }}/>
                                </div>
                            </div>
                    )
                }
            </StandardMenu>
        )
    }
}
