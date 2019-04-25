import React, {Component} from 'react';

import './css/App.css';
import './css/box.css';
import './css/settings.css';
import './css/pastDownloads.css';
import './css/standard_prompt.css';
import './css/tooltip.css';

import Tool from './components/tool';
import Checkbox from './components/checkbox';
import WindowFrame from './components/windowframe';
import Alert from './components/alert';
import {$} from './components/utils';

import DownloadCarrier from './download-carrier';
import Download from "./Download";

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

const path = window.require('path');
const os = window.require('os');
const fs = window.require('fs');

const Mousetrap = window.require('mousetrap');

const _electron = window.require('electron');
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


export default class App extends Component {
    constructor(...args) {
        super(...args);
        document.title = "Quick Downloader";

        // this.me = React.createRef();

        this.state = {
            downloadNums: 0,
            downloads: [],
            promptShowing: false,
            downloadName: "",
            downloadURL: "",
            boxes: [],
            settingsVisible: false,
            currentSelection: 0,
            latestDownloadProgress: 0,
            pastDownloadsVisible: false,
            customHeaders: "",
            showActive: true,
            filter: "name",
            showError: false,
            filterValue: "",
        };

        App.loadSettings();
    }

    static loadSettings() {
        window.localStorage.theme = window.localStorage.getItem("theme") || "dark";
        window.localStorage.saveLocation = window.localStorage.getItem("saveLocation") || path.join(os.homedir(), 'Downloads');
        window.localStorage.proxySettings = window.localStorage.getItem("proxySettings") || "none";
        window.localStorage.proxyRequiresCredentials = window.localStorage.getItem("proxyRequiresCredentials") || false;
        window.localStorage.partsToCreate = Number(window.localStorage.getItem("partsToCreate")) || 10;
        window.localStorage.preferredUnit = window.localStorage.getItem("preferredUnit") || "bin";
        window.localStorage.allowNotifications = window.localStorage.getItem("allowNotifications") || "true";
        window.localStorage.autoHideMenuBar = window.localStorage.getItem("autoHideMenuBar") || "false";
        window.localStorage.showAdvancedDetails = window.localStorage.getItem("showAdvancedDetails") || "true";
    }

    alert(box) {
        this.setState(prev => ({boxes: [...prev.boxes, box]}));
        console.log("showing box");
    }

    showPrompt() {
        if (!this.state.promptShowing) {
            this.setState(prevState => ({promptShowing: !prevState.promptShowing}));
        }
    }

    closePrompt() {
        this.setState({downloadName: "", downloadURL: "", promptShowing: false});
    }

    confirmExists(fullLocation, name) {
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

                        <b>Note:</b> If you choose to keep it, the file's contents will not be deleted, instead
                        additional
                        content will be appended to it. This will render the resulting and the original files unusable.

                        <br/>
                        <br/>

                        <div className={"right"}>
                            <button onClick={async () => {
                                let newName = name;
                                while (fs.existsSync(Download.getFileName(name, window.localStorage.saveLocation, this.state.url)))
                                    newName += ' 2';

                                this.setState({showing: false});
                                resolve(newName);
                                box.state.showing = false;
                                box.forceUpdate();
                                this.forceUpdate();
                            }}>Rename
                            </button>

                            <button onClick={async () => {
                                fs.unlinkSync(fullLocation);
                                this.setState({showing: false});
                                resolve();
                                box.state.showing = false;
                                box.forceUpdate();
                                this.forceUpdate();
                            }}>Overwrite
                            </button>

                            <button onClick={async () => {
                                this.setState({showing: false});
                                resolve();
                                box.state.showing = false;
                                box.forceUpdate();
                                this.forceUpdate();
                            }}>Keep
                            </button>

                            <button onClick={() => {
                                this.setState({showing: false});
                                resolve();
                                box.state.showing = false;
                                box.forceUpdate();
                                this.forceUpdate();
                            }}>Cancel
                            </button>
                        </div>
                    </div>
                </Alert>);
            } else {
                resolve();
            }
        });
    }

    async createDownload(url, name, headers) {
        url = url || "";
        name = name || "";
        headers = headers || "{}";

        this.closePrompt();

        const newName = await this.confirmExists(Download.getFileName(name, window.localStorage.saveLocation, url), name);

        const download = new DownloadCarrier(url, newName || name, headers);
        download.download.on("init", function () {
            download.status = 4;
            this.forceUpdate();
        });
        download.download.on("create_parts", () => {
            console.log();
        });
        download.download.on("download_all", () => {
            download.status = 0;
            this.forceUpdate();
        });
        download.download.on("complete", () => {
            download.done = true;
            this.next();
            download.status = 2;
            this.forceUpdate();
        });
        download.on("update", info => this.forceUpdate());
        download.on("error", err => {
            download.status = 1;
            this.forceUpdate();
            console.error(err);
        });
        download.on("cancel", () => {
            download.status = 5;
            this.forceUpdate();
            this.next();
        });
        download.on("remove", () => {
            this.state.downloads.splice(this.state.downloads.indexOf(download), 1);
            this.forceUpdate();
        });
        download.on("retry", () => {
            download.constructor(download.url, download.name, download.customHeaders);
            download.status = 3;
            if (this.getReady().length === 1) {
                this.next();
            }
        });
        return download;
    }

    addDownload(download) {
        this.state.downloads.push(download);
        if (this.getReady().length === 1) {
            this.next();
        }
    }


    filter(downloads) {
        const filter = downloads => this.state.filter ? downloads.filter(i => i[this.state.filter].toLowerCase().indexOf(this.state.filterValue.toLowerCase()) > -1) : downloads;
        const getProperty = (obj, prop) => prop.reduce((a, i) => (obj[a] || a)[i]);
        const sort = (downloads, selector) => downloads.sort((a, b) => ((a, b) => a > b ? 1 : (a < b ? -1 : 0))(getProperty(a, selector), getProperty(b, selector)));
        return sort(filter(downloads), (this.state.sortBy || "").split('.')).flip(this.state.reversed);
    }

    getDisplayDownloads() {
        return this.filter(this.state.downloads.filter(i => !i.done));
    }

    getAllDownloads() {
        return this.filter(this.state.downloads);
    }

    getReady() {
        return this.filter(this.state.downloads.filter(i =>
            !i.done
            && i.status !== 1
            && i.status !== 5
        ));
    }

    getInactive() {
        return this.filter(this.state.downloads.filter(i => i.done));
    }

    next() {
        const downloads = this.getReady();

        if (downloads[0])
            downloads[0].startDownload();

        this.forceUpdate();
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

            console.log(this.state.currentSelection);
        }
    }

    async addToDownloadHistory(url = this.state.downloadURL, name = this.state.downloadName, headers = this.state.customHeaders) {
        const _downloadHistory = JSON.parse(window.localStorage.downloadHistory || "[]");
        _downloadHistory.unshift({url, name, headers});

        window.localStorage.downloadHistory = JSON.stringify(_downloadHistory);
    }

    // updateTaskBarValue(index, progress) {
    // 	if (index === this.state.activeDownloads.length) {
    //
    // 		console.log(progress);
    //
    // 		(async function (progress) {
    // 			window.require('electron').remote.getCurrentWindow().setProgressBar(progress / 100);
    // 		})(progress).catch(err => console.error(err) || err);
    //
    // 		if (progress === 100) (async function () {
    // 			window.require('electron').remote.getCurrentWindow().setProgressBar(-1);
    // 		})().catch(err => console.error(err) || err);
    // 	}
    // }

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
            Mousetrap.bind('mod+n', () => this.showPrompt());
            Mousetrap.bind('esc', () => {
                // this.forceUpdate();
                this.closePrompt();
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
            Mousetrap.bind('enter', () => {
                if (this.state.promptShowing) this.acceptSuggestion(this.state.currentSelection)
            });

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
            show: () => this.showPrompt(),
            showPastDownloads: () => this.pastDownloads(),
            close: () => App.confirmExit(),
            toggleFullScreen: () => remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen()),
            about: () => this.about(),
            showSettings: () => this.showSettings(),
            alert: (box) => this.alert(box),
            contact: () => this.contact(),
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
            currentSelection: 0,
            focused: null
        })
    }

    showSettings() {
        this.setState(prev => ({settingsVisible: !prev.settingsVisible}));
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
        console.log("contact");
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

    render() {
        return (
            <div className="wrapper">
                <WindowFrame contact={e => this.contact()} about={e => this.about()} download={e => this.showPrompt()}/>
                <div className={"menu_buttons_container"}>
                    <div className={"menu_buttons_wrapper"}>
                        <Tool tooltip={"New download"} className="icon_button" shortcut="+"
                              onClick={e => this.showPrompt()}
                              icon={"fas fa-plus"}/>
                        <Tool tooltip={"Settings"} className="icon_button"
                              shortcut="*"
                              onClick={() => this.setState(prev => ({settingsVisible: !prev.settingsVisible}))}
                              icon={"fas fa-cog"}/>
                        <Tool tooltip={"Show download history"}
                              className="icon_button"
                              onClick={() => this.setState(prev => ({pastDownloadsVisible: !prev.pastDownloadsVisible}))}
                              icon={"fas fa-history"}/>
                    </div>
                </div>
                <div className="App">
                    <div className={"download-tabs"}>
							<span onClick={() => this.setState({showActive: true})} className={"tab"}
                                  id={this.state.showActive ? "active" : ""}>Queue</span>
                        <span onClick={() => this.setState({showActive: false})} className={"tab"}
                              id={!this.state.showActive ? "active" : ""}>Complete</span>
                    </div>

                    <div className={"downloads-display-options"}>
                        <input value={this.state.filterValue}
                               onChange={text => this.setState({filterValue: text.target.value})}
                               className={"input_standard"} placeholder={"Filter downloads"}/>

                        <Tool left={true} tooltip={"Search by"} icon={"fas fa-search"}
                              menu={{
                                  "Name": () => this.setState({filter: "name"}),
                                  "URL": () => this.setState({filter: "url"})
                              }}/>

                        <Tool left={true} tooltip={"Sort By"} icon={"fas fa-sort-amount-down"}
                              menu={{
                                  "Name": () => this.setState({sortBy: "name"}),
                                  "URL": () => this.setState({sortBy: "url"}),
                                  "Completion Time": () => this.setState({sortBy: "stats.eta"}),
                                  "spacer": () => void 1,
                                  "Reset": () => this.setState({sortBy: null})
                              }}/>

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
                                                  onClick={e => this.closePrompt()}/>

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
                                                  placeholder={'Download Headers (JSON)'} // {"Cookie","token=quickdownloader"}
                                        />
                                        <div className={"suggestions"}>
                                            {
                                                this.getDownloads().map((i, a, x) => {
                                                    if (i && i.headers.length > 1 && this.filterSuggestion(i)) {
                                                        return (<div key={a}
                                                                     onClick={() => this.acceptSuggestion(a)}
                                                                     className={"suggestion"}>
                                                            <span>{i.headers}</span>
                                                            <br/>
                                                        </div>);
                                                    }
                                                })
                                            }
                                        </div>
                                    </div>

                                    <div className={"right-align"}>
                                        <Tool left={true} tooltip={"Begin download"} className={"confirm-btn"}
                                              icon={"fas fa-check"}
                                              onClick={async () => {
                                                  if (this.state.downloadName && this.state.downloadURL) {
                                                      await this.addToDownloadHistory();
                                                      this.addDownload(await this.createDownload(this.state.downloadURL, this.state.downloadName, this.state.customHeaders));
                                                  }
                                              }}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        : undefined
                    }
                    {/*------------------------------------------------------------------------------------------------Settings Prompt------------------------------------------------------------------------------------------------*/}
                    {this.state.settingsVisible ?
                        <div className={"prompt_wrapper"}>
                            <div className={"prompt_content_container"}>
                                <div className={"prompt_content_wrapper"}>
                                    <header className={"settings_header prompt_header"}>
                                        <h1>Settings</h1>
                                        <div className={"prompt_close_button"}>
                                            <Tool left={true} tooltip={"Close the prompt"} icon={"fas fa-times"}
                                                  onClick={e => this.setState({settingsVisible: false})}/>

                                        </div>
                                    </header>

                                    <h2>Appearance</h2>
                                    <div className={"settings-group"}>
                                        <div className={"setting"}>
                                            <label htmlFor="dark">Dark Theme</label>
                                            <input
                                                onChange={field => {
                                                    if (field.target.value === "on")
                                                        window.localStorage.theme = "dark";
                                                    this.forceUpdate();
                                                }}
                                                className={"standard_radio right_aligned"}
                                                name={"theme"}
                                                id={"dark"}
                                                type={"radio"}
                                                checked={window.localStorage.getItem('theme') === 'dark'}/>
                                        </div>
                                        <div className={"setting"}>
                                            <label htmlFor="light">Light Theme</label>
                                            <input
                                                onChange={field => {
                                                    if (field.target.value === "on")
                                                        window.localStorage.theme = "dark";
                                                    this.forceUpdate();
                                                }}
                                                className={"standard_radio right_aligned"}
                                                name={"theme"}
                                                id={"light"}
                                                type={"radio"}
                                                checked={window.localStorage.getItem('theme') === 'light'}/>
                                        </div>
                                    </div>

                                    <Checkbox checked={window.localStorage.getItem('showAdvancedDetails') === "true"}
                                              onChange={value => void window.localStorage.setItem('showAdvancedDetails', value) || this.forceUpdate()}
                                              text={"Show Advanced Download Details"}/>

                                    <br/>

                                    <h2>General</h2>
                                    <div className={"settingsGroup"}>

                                        {/*<div className={"setting"}>*/}
                                        <label htmlFor={"save-location"}>Save Location</label>
                                        <label onClick={() => this.changePath()} htmlFor="save-location"
                                               className={"standard_path_input"}>{window.localStorage.saveLocation}</label>

                                        <label htmlFor={"numOfParts"}>How many parts to use during download</label>
                                        <br/>
                                        <input id={"numOfParts"}
                                               placeholder={"Number of parts to use during download"}
                                               type={"number"}
                                               min={0}
                                               max={50}
                                               className={"inline_input"}
                                               value={window.localStorage.getItem("partsToCreate")}
                                               onChange={field => void (window.localStorage.partsToCreate = (Number(field.target.value))) || this.forceUpdate()}
                                        />
                                        {/* //TODO: Add reference to docs explaining how to find the optimum part number */}

                                        {/*{platform === "win32" ? <div><br/><Checkbox*/}
                                        {/*	checked={window.localStorage.getItem('autoHideMenuBar') === true}*/}
                                        {/*	text={`Auto-hide the menu bar (reveal by pressing Alt`}*/}
                                        {/*	onChange={value => void window.localStorage.setItem('autoHideMenuBar', value) || this.forceUpdate()}/>*/}
                                        {/*</div> : null}*/}

                                        <br/>
                                        <br/>
                                        <h3>Units</h3>

                                        <hr/>

                                        <div className={"setting"}>
                                            <input type={"radio"} className={"standard_radio right_aligned"}
                                                   name={"unit"}
                                                   onChange={field => {
                                                       if (field.target.value === "on") window.localStorage.preferredUnit = "bin";
                                                       this.forceUpdate();
                                                   }} id={"bin"}
                                                   checked={window.localStorage.getItem('preferredUnit') === "bin"}/>
                                            <label htmlFor={"bin"}>Binary Units (MiB = 1024 KiB)</label>
                                        </div>

                                        <div className={"setting"}>
                                            <input type={"radio"} className={"standard_radio right_aligned"}
                                                   name={"unit"}
                                                   onChange={field => {
                                                       if (field.target.value === "on") window.localStorage.preferredUnit = "dec";
                                                       this.forceUpdate();
                                                   }} id={"dec"}
                                                   checked={window.localStorage.getItem('preferredUnit') === "dec"}/>
                                            <label htmlFor={"dec"}>Decimal Units (MB = 1000 KB)</label>
                                        </div>

                                        <hr/>
                                        <br/>

                                        <Checkbox checked={window.localStorage.getItem('allowNotifications') === true}
                                                  text={"Allow Notifications"}
                                                  onChange={value => void window.localStorage.setItem('allowNotifications', value) || this.forceUpdate()}/>

                                        <br/>
                                        <hr/>

                                        <input type={"button"} className={"standard_full_button"} onClick={() => {
                                            if (_electron.ipcRenderer.sendSync('confirmClear'))
                                                window.localStorage.clear();

                                            App.loadSettings();
                                            this.forceUpdate();
                                        }} value={"Reset to default settings"}/>
                                    </div>

                                    <br/>

                                    <h2>Network</h2>

                                    <div className={"setting"}>
                                        <label htmlFor={"none"}>None</label>
                                        <input className={"standard_radio right_aligned"} type={"radio"}
                                               name={"proxy-auth-type"}
                                               checked={window.localStorage.getItem('proxySettings') === 'none'}
                                               id={"none"}
                                               onChange={field => {
                                                   if (field.target.value === "on") {
                                                       window.localStorage.setItem('proxySettings', 'none');
                                                   }
                                                   this.forceUpdate();
                                               }}/>
                                    </div>
                                    {(() => false)() ? (
                                            <div className={"setting"}>
                                                <label htmlFor={"none"}>Pac Script</label>
                                                <input className={"standard_radio right_aligned"} type={"radio"}
                                                       name={"proxy-auth-type"}
                                                       checked={window.localStorage.getItem('proxySettings') === 'pac'}
                                                       id={"pac"}
                                                       onChange={field => {
                                                           if (field.target.value === "on") {
                                                               window.localStorage.setItem('proxySettings', 'pac');
                                                           }
                                                           this.forceUpdate();
                                                       }}/>
                                            </div>)
                                        : null} {/* <-- won't render anything */}

                                    <div className={"setting"}>
                                        <label htmlFor={"none"}>HTTPS Proxy</label>
                                        <input className={"standard_radio right_aligned"}
                                               type={"radio"}
                                               name={"proxy-auth-type"}
                                               checked={window.localStorage.getItem('proxySettings') === 'auth'}
                                               id={"auth"}
                                               onChange={field => {
                                                   if (field.target.value === "on") {
                                                       window.localStorage.setItem('proxySettings', 'auth');
                                                   }
                                                   this.forceUpdate();
                                               }}/>
                                    </div>

                                    {
                                        window.localStorage.getItem('proxySettings') === "pac" ?
                                            <div>
                                                <input placeholder={"https://example.com/proxy/proxy.pac"}
                                                       className={"input_standard"}
                                                       value={window.localStorage.getItem('pacFile') || ""}
                                                       onChange={field => void window.localStorage.setItem('pacFile', field.target.value) || this.forceUpdate()}
                                                       id={"pac-location"}/>

                                                <label htmlFor={"pac-location"}>Pac Script Location</label></div> :
                                            (window.localStorage.getItem('proxySettings') === "auth" ? (
                                                <div>
                                                    <label htmlFor={"proxy-host"}>Proxy Host</label>
                                                    <input placeholder={"proxy.example.com"}
                                                           className={"input_standard"}
                                                           value={window.localStorage.getItem('proxyHost') || ""}
                                                           onChange={field => void window.localStorage.setItem('proxyHost', field.target.value) || this.forceUpdate()}
                                                           id={"proxy-host"}/>

                                                    <label htmlFor={"proxy-port"}>Proxy Port</label>
                                                    <br/>
                                                    <input placeholder={8080}
                                                           className={"inline_input"}
                                                           type={"number"}
                                                           value={window.localStorage.getItem('proxyPort') || ""}
                                                           onChange={field => void window.localStorage.setItem('proxyPort', field.target.value) || this.forceUpdate()}
                                                           id={"proxy-port"}/>
                                                    <br/>
                                                    <br/>

                                                    <Checkbox
                                                        checked={window.localStorage.proxyRequiresCredentials === "true"}
                                                        onChange={value => (void window.localStorage.setItem("proxyRequiresCredentials", value)) || this.forceUpdate()}
                                                        text={"Proxy Requires Credentials"}/>

                                                    {(window.localStorage.proxyRequiresCredentials === "true" ?
                                                        <div>
                                                            <input placeholder={"Proxy Username"}
                                                                   type={"text"}
                                                                   className={"input_standard"}
                                                                   onChange={field => void (window.localStorage.proxyUsername = field.target.value) || this.forceUpdate()}
                                                                   value={window.localStorage.proxyUsername || ""}
                                                                   id={"proxy-username"}/>
                                                            <input placeholder={"Proxy Password"}
                                                                   type={"password"}
                                                                   className={"input_standard"}
                                                                   onChange={field => void (window.localStorage.proxyPassword = field.target.value) || this.forceUpdate()}
                                                                   value={window.localStorage.proxyPassword || ""}
                                                                   id={"proxy-password"}/>
                                                        </div> : null)}

                                                </div>
                                            ) : null)
                                    }

                                </div>
                            </div>
                        </div>
                        : null}
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
                                                          this.forceUpdate();
                                                          await new Promise(resolve => {
                                                              let box;
                                                              this.alert(<Alert noClose={true}
                                                                                ref={dialog => box = dialog}
                                                                                key={new Date().getTime().toLocaleString()}
                                                                                header={"Clear History"}>
                                                                  <div>
                                                                      Are you sure you would like to clear all past downloads from history and suggestions? This cannot be undone.
                                                                      <div className={"right"}>
                                                                          <button onClick={() => {
                                                                              this.setState({showing: false});
                                                                              this.forceUpdate();
                                                                              resolve();
                                                                              box.state.showing = false;
                                                                              box.forceUpdate();
                                                                          }
                                                                          }>No
                                                                          </button>

                                                                          <button onClick={() => {
                                                                              window.localStorage.downloadHistory = "[]";
                                                                              this.setState({showing: false});
                                                                              this.forceUpdate();
                                                                              resolve();
                                                                              box.state.showing = false;
                                                                              box.forceUpdate();
                                                                          }}>Yes
                                                                          </button>

                                                                      </div>
                                                                  </div>
                                                              </Alert>);
                                                          });
                                                          this.setState({pastDownloadsVisible: true});
                                                          this.forceUpdate();
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
                    {this.state.boxes}
                </div>
            </div>
        );
    }
}