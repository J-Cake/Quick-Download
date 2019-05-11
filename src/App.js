import React, {Component} from 'react';

import './css/App.css';
import './css/box.css';
import './components/SettingsMenu/SettingsMenu.css';
import './components/HistoryMenu/HistoryMenu.css';
import './components/Shared/StandardMenu/standard_prompt.css';
import './css/tooltip.css';
import './components/DownloadMenu/DownloadMenu.css';

import IconMenu from "./components/IconMenu/IconMenu";

import AboutMenu from "./components/AboutMenu/AboutMenu";

import DownloadTabsSelector from "./components/DownloadTabs/DownloadTabsSelector";
import DownloadTabsContent from "./components/DownloadTabs/DownloadTabsContent";

import SettingsMenu from './components/SettingsMenu/SettingsMenu.js';
import HistoryMenu from './components/HistoryMenu/HistoryMenu.js';
import DownloadMenu from './components/DownloadMenu/DownloadMenu.js';

import Tool from './components/Shared/tool';

import WindowFrame from './components/windowframe';
import Alert from './components/Shared/alert';
import {$} from './components/utils';

import DownloadCarrier from './download-carrier';
import Download from "./Download";
import * as url_lib from "url";


Array.prototype.switch = function (condition, goto, fallback) {
    // a ternary operator for arrays.
    // if the condition evaluates to true, return the first condition
    // otherwise, the second

    if (!condition.bind(this)(this))
        return typeof fallback === "function" ? fallback(this) : fallback;
    else
        return typeof goto === "function" ? goto(this) : goto;
};

Array.prototype.flip = function (shouldFlip) {
    if (shouldFlip)
        return this.reverse();
    else
        return this;
};

Array.prototype.except = function (excluder) {
    return this.filter(i => i !== excluder);
};

const path = window.require('path');
const os = window.require('os');
const fs = window.require('fs');
const https = window.require('https');

const Mousetrap = window.Mousetrap;

const _electron = window.require('electron');
const version = _electron.ipcRenderer.sendSync('version');
const remote = _electron.remote;
const {ipcRenderer} = window.require('electron');

const currentWindow = remote.getCurrentWindow();

let platform = remote.require('os').platform();

if (platform !== "win32" && platform !== "darwin")
    platform = "other";


ipcRenderer.on('menu-about', function (event) {
    window.App.about();
});
ipcRenderer.on('menu-settings', function (event) {
    window.App.showSettings();
});
ipcRenderer.on('menu-new_download', function (event) {
    window.App.show();
});
ipcRenderer.on('menu-close', function (event) {
    window.App.close();
});
ipcRenderer.on('menu-contact', function (event) {
    window.App.contact();
});

ipcRenderer.on('check-update', function (event) {
    window.App.CheckForUpdate(true);
});


export default class App extends Component {
    constructor(...args) {
        super(...args);
        document.title = "Quick Downloader";
        this.alert = this.alert.bind(this);

        this.updateCookies = this.updateCookies.bind(this);
        this.state = {
            downloadNums: 0,
            promptShowing: false,
            box: null,
            settingsVisible: false,
            currentSelection: -1,
            latestDownloadProgress: 0,
            pastDownloadsVisible: false,
            filters: {name: true},
            showError: false,
            filterValue: "",
            sortBy: "stats.eta",
            cookieURL: "",
        };

        /* Create Prompt Refs */
        this.settingsPrompt = React.createRef();
        this.historyPrompt = React.createRef();
        this.downloadPrompt = React.createRef();
        this.tabsContent = React.createRef();
        this.aboutPrompt = React.createRef();


        this.CheckForUpdate(false);
    }

    alert(box) {
        this.setState(prev => ({box: box}));
    }

    showDownloadPrompt() {
        if (!this.state.promptShowing) {
            this.setState(prevState => ({promptShowing: !prevState.promptShowing}));
        }
    }

    closeDownloadPrompt() {
        this.setState({promptShowing: false});
    }

    clearDownloadPrompt() {
        this.setState({downloadName: "", downloadURL: ""});
    }

    generateUniqueFileName(name, saveLocation, url) {
        const fullLocation = Download.getFileName(name, saveLocation, url);
        return new Promise(resolve => {
            if (fs.existsSync(fullLocation)) {
                let box;
                this.alert(<Alert noClose={true} ref={dialog => box = dialog}
                                  key={new Date().getTime().toLocaleString()}
                                  header={"File already exists"}>
                    <div>
                        The file "{fullLocation.split('/').pop()}" already exists. You can replace it or keep it or
                        rename
                        the
                        download.

                        <br/>
                        <br/>

                        <div className={"right"}>
                            <button onClick={async () => {
                                let num = 2;
                                while (fs.existsSync(Download.getFileName(name + " " + num, saveLocation, url))) {
                                    num++;
                                }
                                this.setState({showing: false});
                                resolve(name + " " + num);
                                box.setState({showing: false});
                            }}>Rename
                            </button>

                            <button onClick={async () => {
                                fs.unlinkSync(fullLocation);
                                resolve(name);
                                this.setState({showing: false});
                                box.setState({showing: false});
                            }}>Overwrite
                            </button>

                            <button onClick={() => {
                                resolve(false);
                                this.setState({showing: false});
                                box.setState({showing: false});
                            }}>Cancel
                            </button>
                        </div>
                    </div>
                </Alert>);
            } else {
                resolve(name);
            }
        });
    }

    changeSelection(dir) {
        if (this.state.focused) {
            if (this.state.focused.classList.contains('dl-name'))
                this.setState(prev => {
                    const maxSelection = this.getDownloadNames().filter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
            else if (this.state.focused.classList.contains('dl-url'))
                this.setState(prev => {
                    const maxSelection = this.getDownloadUrls().filter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
            else if (this.state.focused.classList.contains('dl-headers'))
                this.setState(prev => {
                    const maxSelection = this.getDownloadHeaders().filter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
        }
    }

    componentDidMount() {
        remote.getCurrentWindow().setProgressBar(-1);

        if (!window.localStorage.downloadHistory)
            window.localStorage.downloadHistory = JSON.stringify([]);

        try {
            Mousetrap.bind('mod+n', () => this.showDownloadPrompt());
            Mousetrap.bind('esc', () => {
                // this.forceUpdate();
                this.closeDownloadPrompt();
                this.clearDownloadPrompt();
                this.setState(prev => ({
                    settingsVisible: false,
                    pastDownloadsVisible: false,
                    boxes: prev.boxes.filter(i => i.props.noClose)
                }));
            });
            Mousetrap.bind('mod+j', () => this.pastDownloads());
            Mousetrap.bind('f11', () => currentWindow.setFullScreen(!currentWindow.isFullScreen()));

            Mousetrap.bind('up', () => this.changeSelection(-1) || false);
            Mousetrap.bind('down', () => this.changeSelection(1) || false);
            // Mousetrap.bind('enter', () => {
            //     if (this.state.promptShowing) this.acceptSuggestion(this.state.currentSelection)
            // });

            Mousetrap.bind("ctrl+tab", () => {
                this.setState(prev => ({
                    showActive: !prev.showActive
                }))
            })
        } catch (e) {
            this.alert(<Alert key={new Date().toLocaleString()} header={"An error has occurred"}
                              body={"A dependency has failed to load, keyboard shortcuts will be disabled. Otherwise, everything else should work."}/>)
        }

        window.App = {
            show: () => this.showDownloadPrompt(),
            showPastDownloads: () => this.pastDownloads(),
            close: () => App.confirmExit(),
            toggleFullScreen: () => remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen()),
            about: () => this.about(),
            showSettings: () => this.settingsPrompt.current.menu.current.show(),
            alert: (box) => this.alert(box),
            contact: () => this.contact(),
            CheckForUpdate: (displayFailPrompt) => this.CheckForUpdate(displayFailPrompt)
        };
    }

    acceptSuggestion(number) {
        const names = this.getDownloadNames(),
            urls = this.getDownloadUrls(),
            headers = this.getDownloadHeaders();

        this.setState({
            downloadURL: urls[number],
            downloadName: names[number],
            customHeaders: headers[number]
        });

        this.setState({
            stopSave: true
        });

        $('.suggestions').style.display = "none";

        this.setState({
            currentSelection: -1,
            focused: null
        })
    }

    static confirmExit() {
        window.close();
    }

    pastDownloads() {
        this.setState(prev => ({pastDownloadsVisible: !prev.pastDownloadsVisible}));
    }

    changePath() {
        window.localStorage.saveLocation = _electron.ipcRenderer.sendSync('pickDir') || window.localStorage.saveLocation;
        this.forceUpdate();
    }

    contact() {
        this.alert(<Alert key={new Date().toLocaleString()} header={"About"} body={
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

        }/>)
    }

    about() {
       this.aboutPrompt.current.menu.current.show();
    }

    async createDownload(url, name, headers) {
        url = url || "";
        name = name || "";
        headers = headers || "{}";

        this.closeDownloadPrompt();
        this.clearDownloadPrompt();

        const newName = await this.generateUniqueFileName(name, window.localStorage.saveLocation, url);
        if (!newName) {
            return false;
        }
        const download = new DownloadCarrier(url, newName, headers);

        download.download.on("init-complete", function () {
            download.status = 3;
            this.forceUpdate();
        });
        download.download.on("download_all", () => {
            download.status = 0;
            this.forceUpdate();
        });
        download.download.on("downloads_complete", () => {
            download.status = 6;
            this.next();
            this.forceUpdate();
        });
        download.download.on("complete", () => {
            download.done = true;
            download.status = 2;
            this.next();
            this.forceUpdate();
        });
        download.on("update", info => {
            this.forceUpdate();
        });
        download.on("error", err => {
            download.status = 1;
            this.forceUpdate();
            console.error(err);
            download.cancel();
        });
        download.on("cancel", () => {
            if (download.status !== 1) {
                download.status = 5;
                this.forceUpdate();
            }
            this.next();
        });
        download.on("remove", () => {
            this.setState({
                downloads: [...this.state.downloads.filter(d => d !== download)],
            });
        });
        download.on("retry", async () => {
            download.constructor(download.url, download.name, download.customHeaders);
            download.status = 3;
            await download.initiateDownload();
            if (this.getActive().length === 0) {
                this.next();
            }
        });
        return download;
    }
    updateCookies(e){
            this.setState({cookieURL: e.target.value});
           console.log(this.state.cookieURL);
           this.forceUpdate();
    }
    async CheckForUpdate(displayFailPrompt) {
        const url = "https://raw.githubusercontent.com/jbis9051/quick_download/master/package.json";
        const q = url_lib.parse(url);
        const currentVersion = await new Promise((resolve, reject) => {
            let data = "";
            const request = https.get({
                path: q.path,
                host: q.hostname,
                port: 443,
            }, res => {
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on('error', (e) => {
                    console.error(e);
                    resolve(false);
                });
                res.on('end', () => {
                    resolve(JSON.parse(data).version);
                });
            });
            request.on('error', (e) => {
                console.error(e);
                resolve(false);
            });
        });
        if (!currentVersion) {
            if (displayFailPrompt) {
                let box;
                this.alert(<Alert noClose={false}
                                  ref={dialog => box = dialog}
                                  key={new Date().getTime().toLocaleString()}
                                  header={"Update Check Failed"}>
                    <div>
                        An Error occurred while checking for an update.
                    </div>
                </Alert>);
            }
            return false;
        }
        console.log("Current Version: " + currentVersion);
        console.log("This Version: " + version);
        if (version !== currentVersion) {
            let box;
            this.alert(<Alert noClose={true}
                              ref={dialog => box = dialog}
                              key={new Date().getTime().toLocaleString()}
                              header={"Update Available"}>
                <div>
                    An update is available. You are currently on version {version}. The current version
                    is {currentVersion}. Would you like to update?
                    <div className={"right"}>
                        <button onClick={() => {
                            this.setState({showing: false});
                            box.setState({
                                showing: false,
                            });
                        }
                        }>No
                        </button>

                        <button onClick={() => {
                            window.localStorage.downloadHistory = "[]";
                            this.setState({showing: false});
                            box.setState({
                                showing: false,
                            });
                            _electron.ipcRenderer.send('openURL', 'https://jbis9051.github.io/quick_download/');
                        }}>Yes
                        </button>

                    </div>
                </div>
            </Alert>);
        } else {
            if (displayFailPrompt) {
                let box;
                this.alert(<Alert noClose={false}
                                  ref={dialog => box = dialog}
                                  key={new Date().getTime().toLocaleString()}
                                  header={"Current Version"}>
                    <div>
                        You have the current version, {version}.
                    </div>
                </Alert>);
            }
        }
        return true;
    }

    render() {
        var box;
        return (
            <div className="wrapper">
                <WindowFrame contact={e => this.contact()} update={e => this.CheckForUpdate(true)}
                             about={e => this.about()} download={e => this.showDownloadPrompt()}/>
                 <IconMenu
                    downloadPrompt={this.downloadPrompt}
                    settingsPrompt={this.settingsPrompt}
                    historyPrompt={this.historyPrompt}
                 />
                <div className="App">
                   <DownloadTabsSelector
                       displayTab={(showActive) => {this.tabsContent.current.displayTab(showActive)}}
                       getActiveTab={() => { return this.tabsContent.current.getActiveTab()}}
                       /* this.tabsContent.current.displayTab(false) */
                   />

                    <div className={"downloads-display-options"}>
                        <input value={this.state.filterValue}
                               onChange={async text => (await this.setState({filterValue: text.target.value}) || console.log(this.state.filters, this.state.filterValue))}
                               className={"input_standard"} placeholder={"Filter downloads"}/>

                        <Tool left={true} tooltip={"Search by"} icon={"fas fa-search"}
                              menu={{
                                  "Name": () => this.setState(prev => ({
                                      filters: {
                                          ...prev.filters,
                                          name: !prev.filters.name
                                      }
                                  })),
                                  "URL": () => this.setState(prev => ({
                                      filters: {
                                          ...prev.filters,
                                          url: !prev.filters.url
                                      }
                                  })),
                                  "Status": () => this.setState(prev => ({
                                      filters: {
                                          ...prev.filters,
                                          statusName: !prev.filters.statusName
                                      }
                                  }))
                              }} getActive={() => ({
                            Name: this.state.filters.name,
                            URL: this.state.filters.url,
                            Status: this.state.filters.statusName
                        })}/>

                        <Tool left={true} tooltip={"Sort By"} icon={"fas fa-sort-amount-down"}
                              menu={{
                                  "Name": () => this.setState({sortBy: "name"}),
                                  "URL": () => this.setState({sortBy: "url"}),
                                  "Completion Time": () => this.setState({sortBy: "stats.eta"})
                              }} getActive={() => ({
                            "Name": this.state.sortBy === "name",
                            "URL": this.state.sortBy === "url",
                            "Completion Time": this.state.sortBy === "stats.eta"
                        })}/>

                        <Tool onClick={() => this.setState(prev => ({reversed: !prev.reversed}))} left={true}
                              tooltip={"Reverse List"}
                              icon={!this.state.reversed ? "fas fa-chevron-down" : "fas fa-chevron-up"}/>
                    </div>

                    <DownloadTabsContent ref={this.tabsContent}/>
                    {/*------------------------------------------------------------------------------------------------Past Downloads------------------------------------------------------------------------------------------------*/}
                    <HistoryMenu ref={this.historyPrompt}/>
                    {/* ------------------------------------------------------------------------------------------------New Download Prompt------------------------------------------------------------------------------------------------ */}
                    <DownloadMenu ref={this.downloadPrompt} addToDownloadHistory={()=>{this.historyPrompt.current.addToDownloadHistory()}}/>
                    {/*------------------------------------------------------------------------------------------------Settings Prompt------------------------------------------------------------------------------------------------*/}
                    <SettingsMenu ref={this.settingsPrompt} settings={{}} />
                    {/*------------------------------------------------------------------------------------------------About Prompt------------------------------------------------------------------------------------------------*/}
                    <AboutMenu ref={this.aboutPrompt} version={version}/>
                </div>

                <div className={"box-display-area"}>
                    {this.state.box}
                </div>
            </div>
        );
    }
}