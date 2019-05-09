import React, {Component} from 'react';

import './css/App.css';
import './css/box.css';
import './components/SettingsMenu/SettingsMenu.css';
import './css/pastDownloads.css';
import './components/Shared/StandardMenu/standard_prompt.css';
import './css/tooltip.css';
import './css/downloads.css';

import Tool from './components/Shared/tool';
import SettingsMenu from './components/SettingsMenu/SettingsMenu.js';
import Checkbox from './components/Shared/checkbox';
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
            downloads: [],
            promptShowing: false,
            downloadName: "",
            downloadURL: "",
            box: null,
            settingsVisible: false,
            currentSelection: -1,
            latestDownloadProgress: 0,
            pastDownloadsVisible: false,
            customHeaders: "",
            showActive: true,
            filters: {name: true},
            showError: false,
            filterValue: "",
            sortBy: "stats.eta",
            cookieURL: "",
        };

        /* Create Prompt Refs */
        this.settingsPrompt = React.createRef();


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

    filter(downloads) { // challenge, turn this into a one-liner
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

    async addToDownloadHistory(url = this.state.downloadURL, name = this.state.downloadName, headers = this.state.customHeaders) {
        const _downloadHistory = JSON.parse(window.localStorage.downloadHistory || "[]");
        _downloadHistory.unshift({url, name, headers});

        window.localStorage.downloadHistory = JSON.stringify(_downloadHistory);
    }

    getDownloads() {
        const downloads = JSON.parse(window.localStorage.downloadHistory || "[]");
        return downloads.map((i, a) => downloads.slice(0, a).findIndex(j => j.url === downloads[a].url && j.name === downloads[a].name && j.headers === downloads[a].headers) === -1 ? downloads[a] : null);
    }

    getDownloadNames() {
        return this.getDownloads().map(i => i ? i.name || "" : i);
    }

    getDownloadUrls() {
        return this.getDownloads().map(i => i ? i.url || "" : i);
    }

    getDownloadHeaders() {
        return this.getDownloads().map(i => i ? i.headers || "" : i);
    }

    filterSuggestion(i) {
        return (i.name || "").toLowerCase().indexOf((this.state.downloadName || "").toLowerCase()) >= 0
            && (i.url || "").toLowerCase().indexOf((this.state.downloadURL || "").toLowerCase()) >= 0
            && (i.headers || "").toLowerCase().indexOf((this.state.customHeaders || "").toLowerCase()) >= 0
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
        this.alert(<Alert key={new Date().toLocaleString()} header={"About"} body={<div>
            <ul className={"about-details"}>
                <li>
                    <b>Quick Downloader Version: </b>
                    <span>{version}</span>
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
        </div>}/>)
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

    addDownload(download) {
        if (download) {
            this.setState({
                downloads: [
                    ...this.state.downloads,
                    download
                ]
            });
        }
    }

    getDisplayDownloads() {
        return this.filter(this.state.downloads.filter(i => !i.done));
    }

    getAllDownloads() {
        return this.filter(this.state.downloads);
    }

    getActive() {
        return this.filter(this.state.downloads.filter(i =>
            i.status === 0
        ));
    }

    getReady() {
        return this.filter(this.state.downloads.filter(i =>
            i.status === 3
        ));
    }

    getInactive() {
        return this.filter(this.state.downloads.filter(i => i.done));
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
                <div className={"menu_buttons_container"}>
                    <div className={"menu_buttons_wrapper"}>
                        <Tool tooltip={"New download"} className="icon_button" shortcut="+"
                              onClick={e => this.showDownloadPrompt()}
                              icon={"fas fa-plus"}/>
                        <Tool tooltip={"Settings"} className="icon_button"
                              shortcut="*"
                              onClick={() => this.settingsPrompt.current.menu.current.show()}
                              icon={"fas fa-cog"}/>
                        <Tool tooltip={"Show download history"}
                              className="icon_button"
                              onClick={() => this.setState(prev => ({pastDownloadsVisible: !prev.pastDownloadsVisible}))}
                              icon={"fas fa-history"}/>
                    </div>
                </div>
                <div className="App">
                    <div className={"download-tabs"}>
							<span onClick={() => {
                                this.setState({showActive: true});
                            }} className={"tab"}
                                  id={this.state.showActive ? "active" : ""}>Queue</span>
                        <span onClick={() => this.setState({showActive: false})} className={"tab"}
                              id={!this.state.showActive ? "active" : ""}>Complete</span>
                    </div>

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

                    <div className={"download-tabs-content"}>
                        <div className={"downloads active"} id={this.state.showActive ? "active" : ""}>
                            {this.getDisplayDownloads().switch(i => i.length > 0, i => i.map((i, a) => i.render(`download${a}`)), "Press the + button to start a download")}
                        </div>
                        <div className={"downloads inactive"} id={!this.state.showActive ? "active" : ""}>
                            {this.getInactive().switch(i => i.length > 0, i => i.map((i, a) => i.render(`download${a}`)), "Wait until a download completes to see it here")}
                        </div>
                    </div>

                    {/* ------------------------------------------------------------------------------------------------New Download Prompt------------------------------------------------------------------------------------------------ */}
                    {this.state.promptShowing ?
                        <div className={"prompt_wrapper"}>
                            <div className={"prompt_content_container"}>
                                <div className={"prompt_content_wrapper"}>
                                    <header className={"prompt_header"}>
                                        <h1>New Download</h1>
                                        <div className={"prompt_close_button"}>
                                            <Tool left={true} tooltip={"Close the prompt"} icon={"fas fa-times"}
                                                  onClick={e => {
                                                      this.closeDownloadPrompt();
                                                      this.clearDownloadPrompt();
                                                  }}
                                            />

                                        </div>
                                    </header>

                                    <div className={"formItem"}>
                                        <label htmlFor={"dl-name"}>The file name of the download</label>
                                        <input autoFocus={true}
                                               onFocus={field => this.setState({focused: field.target})}
                                               onBlur={() => this.setState({focused: null})}
                                               value={this.state.downloadName || ""}
                                               onChange={e => void ((() => {
                                                   if (this.state.stopSave)
                                                       this.setState({
                                                           stopSave: false
                                                       });
                                               })()) || this.setState({downloadName: e.target.value})}
                                               className={"mousetrap dl-name input_standard"}
                                               id={"dl-name"}
                                               placeholder={"Download Name"}/>
                                        <div className={"suggestions"}>
                                            {
                                                this.getDownloads().map((i, a, x) => {
                                                    if (i && i.name.length > 1 && this.filterSuggestion(i)) {
                                                        return (<div key={a}
                                                                     onClick={() => this.acceptSuggestion(a)}
                                                                     className={"suggestion"}>
                                                            <span>{i.name}</span>
                                                            <br/>
                                                        </div>);
                                                    }
                                                })
                                            }
                                        </div>
                                    </div>

                                    <div className={"formItem"}>
                                        <label htmlFor={"dl-url"}>The location of the file to download</label>
                                        <input onFocus={field => this.setState({focused: field.target})}
                                               onBlur={() => this.setState({focused: null})}
                                               value={this.state.downloadURL || ""}
                                               onChange={e => void ((() => {
                                                   if (this.state.stopSave)
                                                       this.setState({
                                                           stopSave: false
                                                       });
                                               })()) || this.setState({downloadURL: e.target.value})}
                                               className={"input_standard dl-url mousetrap url"}
                                               id={"dl-url"}
                                               placeholder={"Download URL"}/>
                                        <div className={"suggestions"}>
                                            {
                                                this.getDownloads().map((i, a, x) => {
                                                    if (i && i.url.length > 1 && this.filterSuggestion(i)) {
                                                        return (<div key={a}
                                                                     onClick={() => this.acceptSuggestion(a)}
                                                                     className={"suggestion"}>
                                                            <span>{i.url}</span>
                                                            <br/>
                                                        </div>);
                                                    }
                                                })
                                            }
                                        </div>
                                    </div>
                                    <div className={"formItem"}>
                                        <label htmlFor={"dl-headers"}>Custom Headers (JSON)</label>
                                        <textarea onFocus={field => this.setState({focused: field.target})}
                                                  onBlur={() => this.setState({focused: null})}
                                                  value={this.state.customHeaders}
                                                  onChange={e => void ((() => {

                                                      if (this.state.stopSave)
                                                          this.setState({
                                                              stopSave: false
                                                          });
                                                  })()) || this.setState({customHeaders: e.target.value})
                                                  }

                                                  className={"input_standard dl-headers standard_code mousetrap url"}
                                                  id={"dl-headers"}
                                                  placeholder={'Download Headers (JSON)'}
                                        />
                                        <div className={"suggestions"}>
                                            {this.getDownloads().map((i, a, x) => {
                                                if (i && i.headers.length > 1 && this.filterSuggestion(i)) {
                                                    return (<div key={a}
                                                                 onClick={() => this.acceptSuggestion(a)}
                                                                 className={"suggestion"}>
                                                        <span>{i.headers}</span>
                                                        <br/>
                                                    </div>);
                                                }
                                            })}
                                        </div>
                                    </div>
                                    <button className={"confirm-btn"}
                                            onClick={async () => {
                                                let url = await new Promise(resolve => {
                                                    this.closeDownloadPrompt();
                                                    let box;
                                                    this.alert(<Alert noClose={true}
                                                                      ref={dialog => box = dialog}
                                                                      key={"fuck"}
                                                                      header={"Enter A URL"}>
                                                        <div>
                                                            <input
                                                                value={this.state.cookieURL}
                                                                onChange={this.updateCookies}
                                                                className={"input_standard dl-url mousetrap url"}
                                                                placeholder={"Browse URL"}/>
                                                            <div className={"right"}>
                                                                <button onClick={() => {
                                                                    this.setState({
                                                                        showing: false
                                                                    });
                                                                    resolve(this.state.cookieURL);
                                                                    box.setState({
                                                                        showing: false,
                                                                    });
                                                                }
                                                                }>Ok
                                                                </button>

                                                                <button onClick={() => {
                                                                    this.setState({showing: false});
                                                                    resolve(false);
                                                                    box.setState({
                                                                        showing: false,
                                                                    });
                                                                }}>Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Alert>);
                                                });
                                                this.showDownloadPrompt();
                                                if (url) {
                                                    let cookies = ipcRenderer.sendSync('get-browser-cookies', url);
                                                    this.setState({
                                                        customHeaders: `{'Cookie': '${cookies.map(el => `${el.name}=${el.value}`).join(';')}'}`,
                                                    });
                                                }
                                            }}>Get Cookies
                                    </button>
                                    <div className={"right-align"}>
                                        <Tool left={true} tooltip={"Begin download"} className={"confirm-btn"}
                                              icon={"fas fa-check"}
                                              onClick={async () => {
                                                  if (this.state.downloadName && this.state.downloadURL) {
                                                      let shouldContinue = true;
                                                      if (!DownloadCarrier.JSONparse(this.state.customHeaders)) {
                                                          this.closeDownloadPrompt();
                                                          shouldContinue = await new Promise(resolve => {
                                                              let box;
                                                              this.alert(<Alert noClose={true}
                                                                                ref={dialog => box = dialog}
                                                                                key={new Date().getTime().toLocaleString()}
                                                                                header={"Invalid JSON"}>
                                                                  <div>
                                                                      The custom headers input is not valid JSON. Would
                                                                      you like to continue
                                                                      download <b>without</b> custom headers or cancel?
                                                                      <div className={"right"}>
                                                                          <button onClick={() => {
                                                                              this.setState({
                                                                                  showing: false
                                                                              });
                                                                              this.setState({
                                                                                  customHeaders: "",
                                                                              });
                                                                              resolve(true);
                                                                              box.setState({
                                                                                  showing: false,
                                                                              });
                                                                          }
                                                                          }>Clear Custom Headers
                                                                          </button>

                                                                          <button onClick={() => {
                                                                              this.setState({showing: false});
                                                                              this.showDownloadPrompt();
                                                                              resolve(false);
                                                                              box.setState({
                                                                                  showing: false,
                                                                              });
                                                                          }}>Cancel
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              </Alert>);
                                                          });

                                                      }
                                                      if (shouldContinue) {
                                                          await this.addToDownloadHistory();
                                                          const download = await this.createDownload(this.state.downloadURL, this.state.downloadName, this.state.customHeaders);
                                                          if (download) {
                                                              this.addDownload(download);
                                                              await download.initiateDownload();
                                                              this.next();
                                                          }
                                                      }
                                                  }
                                              }}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        : undefined
                    }
                    {/*------------------------------------------------------------------------------------------------Settings Prompt------------------------------------------------------------------------------------------------*/}
                    <SettingsMenu ref={this.settingsPrompt} settings={{}} />
                    {/*------------------------------------------------------------------------------------------------Past Downloads------------------------------------------------------------------------------------------------*/}
                    {this.state.pastDownloadsVisible ?
                        <div className={"prompt_wrapper"}>
                            <div className={"prompt_content_container"}>
                                <div className={"prompt_content_wrapper"}>
                                    <header className={"prompt_header"}>
                                        <h1>History</h1>

                                        <div className={"flex"}>
                                            {JSON.parse(window.localStorage.downloadHistory).length > 1 ?
                                                <Tool left={true} tooltip={"Clear all history"} icon={"fas fa-trash"}
                                                      onClick={async e => {
                                                          this.setState({pastDownloadsVisible: false});
                                                          await new Promise(resolve => {
                                                              let box;
                                                              this.alert(<Alert noClose={true}
                                                                                ref={dialog => box = dialog}
                                                                                key={new Date().getTime().toLocaleString()}
                                                                                header={"Clear History"}>
                                                                  <div>
                                                                      Are you sure you would like to clear all past
                                                                      downloads from history and suggestions? This
                                                                      cannot be undone.
                                                                      <div className={"right"}>
                                                                          <button onClick={() => {
                                                                              this.setState({showing: false});
                                                                              resolve();
                                                                              box.setState({
                                                                                  showing: false,
                                                                              });
                                                                          }
                                                                          }>No
                                                                          </button>

                                                                          <button onClick={() => {
                                                                              window.localStorage.downloadHistory = "[]";
                                                                              this.setState({showing: false});
                                                                              resolve();
                                                                              box.setState({
                                                                                  showing: false,
                                                                              });
                                                                          }}>Yes
                                                                          </button>

                                                                      </div>
                                                                  </div>
                                                              </Alert>);
                                                          });
                                                          this.setState({pastDownloadsVisible: true});
                                                      }
                                                      }/> : null}
                                            {/*<div className={"prompt_close_button"}>*/}
                                            <Tool left={true} tooltip={"Close the prompt"} icon={"fas fa-times"}
                                                  onClick={e => this.setState({pastDownloadsVisible: false})}/>
                                            {/*</div>*/}
                                        </div>
                                    </header>
                                    <div className={"prompt_content"}>
                                        {JSON.parse(window.localStorage.getItem('downloadHistory')).map((i, a) =>
                                            <div
                                                key={a}
                                                className={"past-download"}>
                                                <div className={"download-details"}>
                                                    <div className={"download-name"}>{i.name}:</div>
                                                    <div className={"download-url"}>{i.url}</div>
                                                </div>

                                                <div className={"delete"}>
                                                    <Tool left={true} tooltip={"Remove item from history"}
                                                          icon={"fas fa-trash"}
                                                          onClick={() => {
                                                              const history = JSON.parse(window.localStorage.downloadHistory);
                                                              history.splice(a, 1);

                                                              window.localStorage.downloadHistory = JSON.stringify(history);
                                                              this.forceUpdate();
                                                          }}/>
                                                </div>
                                            </div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        : null}
                </div>

                <div className={"box-display-area"}>
                    {this.state.box}
                </div>
            </div>
        );
    }
}