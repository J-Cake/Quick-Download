import React from 'react';


export default class DownloadTabsContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            displayDownloads: [],
            showActive: true,
        }
    }

    addDownload(download) {
        if (download) {
            this.setState(prev => ({
                downloads: [
                    ...prev.displayDownloads,
                    download
                ]
            }));
        }
    }

    filter(downloads) {
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

    getDisplayDownloads() {
        return this.filter(this.state.displayDownloads.filter(i => !i.done));
    }

    getAllDownloads() {
        return this.filter(this.state.displayDownloads);
    }

    getActive() {
        return this.filter(this.state.displayDownloads.filter(i =>
            i.status === 0
        ));
    }

    getReady() {
        return this.filter(this.state.displayDownloads.filter(i =>
            i.status === 3
        ));
    }

    getInactive() {
        return this.filter(this.state.displayDownloads.filter(i => i.done));
    }

    next() {
        const downloads = this.getReady();
        if (downloads[0] && this.getActive().length === 0) {
            const download = downloads[0];
            download.startDownload().catch(err => {
                console.error(err);
            });
        }

        this.forceUpdate();
    }

    displayTab(showActive) {
        this.setState({showActive: showActive})
    }

    getActiveTab() {
        return this.state.showActive;
    }

    render() {
        return (
            <div className={"download-tabs-content"}>
                {(() => {
                    if (this.getActiveTab()) {
                        return (
                            <div className={"downloads"}>
                                {(() => {
                                    const displayDownloads = this.getDisplayDownloads();
                                    if (displayDownloads.length > 0) {
                                        return displayDownloads.map((download, i) => {
                                            download.render(`download${i}`)
                                        })
                                    }
                                    return "Press the + button to start a download";
                                })()}
                            </div>
                        )
                    }
                    return (
                        <div className={"downloads"}>
                            {(() => {
                                const inactiveDownloads = this.getInactive();
                                if (inactiveDownloads.length > 0) {
                                    return inactiveDownloads.map((download, i) => {
                                        download.render(`download${i}`)
                                    })
                                }
                                return "Wait until a download completes to see it here";
                            })()}
                        </div>
                    )
                })()}
            </div>
        )
    }
}