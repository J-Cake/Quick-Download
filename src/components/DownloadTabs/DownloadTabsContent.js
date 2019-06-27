import React from 'react';
import Enum from '../../enum.js';
import DownloadItem from "../DownloadItem/DownloadItem";

const {DownloadStatus,Tabs} = Enum;

export default class DownloadTabsContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            downloads: [],
            showActive: true,
        }
    }


    static customFilter(downloads) {
        return downloads;
        /*
        const filtered = [];
        for (let i of downloads) {
            let matchesCriteria = false;
            for (let j in this.state.filters) {
                if (this.state.filters[j]) {
                    if (!matchesCriteria)
                        matchesCriteria = i[j].toLowerCase().indexOf(this.state.filterValue.toLowerCase()) > -1;
                }
            }
            if (matchesCriteria)
                filtered.push(i);
        }

        return filtered.sort((downloadA, downloadB) => {
            if (downloadA[this.state.sortBy] > downloadB[this.state.sortBy])
                return 1;
            else if (downloadA[this.state.sortBy] < downloadB[this.state.sortBy])
                return -1;
            else
                return 0;
        });
         */
    }

     static getDisplayDownloads(downloads) {
        return DownloadTabsContent.customFilter(downloads.filter(i => !i.state.done));
    }

     static getAllDownloads(downloads) {
        return DownloadTabsContent.customFilter(downloads);
    }

     static getActive(downloads) {
        return DownloadTabsContent.customFilter(downloads.filter(i => i.state.status === DownloadStatus.ACTIVE));
    }


     static getReadyDownloads(downloads) {
        debugger;
        return DownloadTabsContent.customFilter(downloads.filter(i => i.state.status === DownloadStatus.PENDING));
    }

     static getInactive(downloads) {
        return DownloadTabsContent.customFilter(downloads.filter(i => i.state.done));
    }


    render() {
        console.log("Rendering");
        return (
            <div className={"download-tabs-content"}>
                {(() => {
                    if (this.props.currentTab === Tabs.QUEUE) {
                        return (
                            <div className={"downloads"} id={"downloadsViewer"}>
                                {(() => {
                                    const displayDownloads = DownloadTabsContent.getDisplayDownloads(this.props.downloads);
                                    if (displayDownloads.length > 0) {
                                       return  displayDownloads.map((download, i) =>
                                           <DownloadItem key={`downloads${i}`} status={download.state.status} functions={download.functions}
                                                         stats={download.formatProps(download.state)}/>);
                                    }
                                    return "Press the + button to start a download";
                                })()}
                            </div>
                        )
                    } else {
                        return (
                            <div className={"downloads"}>
                                {(() => {
                                    const inactiveDownloads = DownloadTabsContent.getInactive(this.props.downloads);
                                    if (inactiveDownloads.length > 0) {
                                        return inactiveDownloads.map((download, i) => download.render(`download${i}`));
                                    }
                                    return "Wait until a download completes to see it here";
                                })()}
                            </div>
                        )
                    }
                })()}
            </div>
        )
    }
}
