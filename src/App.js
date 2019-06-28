import React, {Component} from 'react';

import './css/App.css';
import './css/box.css';
import './css/SettingsMenu.css';
import './components/HistoryMenu/HistoryMenu.css';
import './css/standard_prompt.css';
import './css/tooltip.css';
import './css/DownloadItem.css';

import IconMenu from "./components/IconMenu/IconMenu";

import AboutMenu from "./components/AboutMenu/AboutMenu";
import AlertMenu from "./components/AlertMenu/AlertMenu";
import ContactMenu from "./components/ContactMenu/ContactMenu";

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

import Enum from './enum.js';

const {Menus, Tabs} = Enum;

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


export default class App extends Component {
    constructor(...args) {
        super(...args);


        ipcRenderer.on('menu-about', e =>{
            this.changeMenu(Menus.ABOUT);
        });
        ipcRenderer.on('menu-settings', e =>{
            this.changeMenu(Menus.SETTINGS);
        });
        ipcRenderer.on('menu-new_download', e =>{
            this.changeMenu(Menus.NEW_DOWNLOAD);
        });
        ipcRenderer.on('menu-close', e =>{
            App.confirmExit();
        });
        ipcRenderer.on('menu-contact', fe =>{
            this.changeMenu(Menus.CONTACT);
        });
        ipcRenderer.on('check-update', e =>{
            this.CheckForUpdate(true);
        });




        document.title = "Quick Downloader";
        this.alert = this.alert.bind(this);

        this._defaults = {
            theme: "dark",
            saveLocation: path.join(os.homedir(), 'Downloads'),
            proxySettings: "none",
            proxyUsername: "",
            proxyPassword: "",
            proxyRequiresCredentials: false,
            partsToCreate: 15,
            preferredUnit: (os.platform() === "win32" ? "bin" : "dec"),
            allowNotifications: true,
            autoHideMenuBar: false,
            showAdvancedDetails: true
        };

        this.state = {
            downloadNums: 0,
            customMenu: null,
            currentSelection: -1,
            latestDownloadProgress: 0,
            filters: {name: true},
            showError: false,
            filterValue: "",
            sortBy: "stats.eta",
            settings: Object.assign({}, this._defaults, App.getSavedSettings()),


            downloads: [],
            pastDownloads: [],
            viewTab: Tabs.QUEUE,
        };

        this.changeMenu = this.changeMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.updateSettings = this.updateSettings.bind(this);

        this.CheckForUpdate(false);
    }

    updateSettings(settingsObj) {
        if (typeof settingsObj == "object") {
            this.setState(prev => ({
                settings: Object.assign({}, prev.settings, settingsObj)
            }));
        } else {
            this.setState(prev => ({
                settings: Object.assign({}, prev.settings, settingsObj(prev.settings))
            }));
        }
        App.saveSettings();
    }

    static saveSettings() {
        // TODO: save somehow
        return {};
    }

    static getSavedSettings() {
        // TODO: get somehow
        return {};
    }

    alert(menu) {
        this.setState({customMenu: menu});
        this.changeMenu(Menus.OTHER);
    }

    clearDownloadPrompt() {
        this.setState({downloadName: "", downloadURL: ""});
    }

    generateUniqueFileName(name, saveLocation, url) {
        const fullLocation = Download.getFileName(name, saveLocation, url);
        return new Promise(resolve => {
            if (fs.existsSync(fullLocation)) {
                this.alert(<Alert noClose={true}
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
                                this.closeMenu();
                                resolve(name + " " + num);
                            }}>Rename
                            </button>

                            <button onClick={async () => {
                                fs.unlinkSync(fullLocation);
                                resolve(name);
                                this.closeMenu();
                            }}>Overwrite
                            </button>

                            <button onClick={() => {
                                resolve(false);
                                this.closeMenu();
                                this.changeMenu(Menus.NEW_DOWNLOAD);
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
                    const maxSelection = this.getDownloadNames().customFilter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
            else if (this.state.focused.classList.contains('dl-url'))
                this.setState(prev => {
                    const maxSelection = this.getDownloadUrls().customFilter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
            else if (this.state.focused.classList.contains('dl-headers'))
                this.setState(prev => {
                    const maxSelection = this.getDownloadHeaders().customFilter(i => !!i).length;
                    return {currentSelection: (maxSelection + (prev.currentSelection + dir) % maxSelection) % maxSelection};
                });
        }
    }

    componentDidMount() {
        remote.getCurrentWindow().setProgressBar(-1);

        Mousetrap.bind('mod+n', () => this.changeMenu(Menus.NEW_DOWNLOAD));
        Mousetrap.bind('esc', () => {
            this.clearDownloadPrompt();
            this.closeMenu();
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
        });
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

    next() {
        const downloads = DownloadTabsContent.getReadyDownloads(this.state.downloads);
        debugger;
        if (downloads[0] && DownloadTabsContent.getActive(this.state.downloads).length === 0) {
            const download = downloads[0];
            download.startDownload().catch(err => {
                console.error(err);
            });
        }
    }


    async createDownload(url, name, headers) {
        url = url || "";
        name = name || "";
        headers = headers || "{}";

        this.closeMenu();
        this.clearDownloadPrompt();

        const uniqueName = await this.generateUniqueFileName(name, this.state.settings.saveLocation, url);
        if (!uniqueName) {
            return false;
        }

        const download = new DownloadCarrier(url, uniqueName, headers,this.state.settings.saveLocation);

        download.emitter.on("error", err => {
            console.error(err);
        });
        download.emitter.on("next", () => {
            this.next();
        });
        download.emitter.on("remove", () => {
            this.setState({
                downloads: [...this.state.downloads.filter(d => d !== download)],
            });
        });
        return download;
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
            this.alert(
                // TODO turn this into a component
                <Alert noClose={true}
                              ref={dialog => box = dialog}
                              key={new Date().getTime().toLocaleString()}
                              header={"Update Available"}>
                <div>
                    An update is available. You are currently on version {version}. The current version
                    is {currentVersion}. Would you like to update?
                    <div className={"right"}>
                        <button onClick={() => {
                            this.changeMenu(Menus.NONE);
                        }
                        }>No
                        </button>

                        <button onClick={() => {
                            this.changeMenu(Menus.NONE);
                            _electron.ipcRenderer.send('openURL', 'https://jbis9051.github.io/quick_download/');
                        }}>Yes
                        </button>

                    </div>
                </div>
            </Alert>
            );
        } else {
            if (displayFailPrompt) {
                let box;
                this.alert(
                    <Alert noClose={false}
                                  ref={dialog => box = dialog}
                                  key={new Date().getTime().toLocaleString()}
                                  header={"Current Version"}>
                    <div>
                        You have the current version, {version}.
                    </div>
                </Alert>
                );
            }
        }
        return true;
    }

    changeMenu(MenuType) {
        this.setState({
            currentMenu: MenuType
        });
    }

    closeMenu(MenuType) {
        console.log("Closing menu called: " + !!MenuType);
        if (MenuType) {
            if (this.state.currentMenu === MenuType) {
                this.changeMenu(Menus.NONE);
            }
        } else {
            // TODO handle alerts that shouldn't be closed without being resolved
            this.changeMenu(Menus.NONE);
        }
    }

    changeViewTab(TabType) {
        this.setState({viewTab: TabType})
    }

    queueDownload(download) {
        if (download) {
            this.setState(prev => ({
                downloads: [
                    ...prev.downloads,
                    download
                ]
            }));
        }
    }

    render() {
        return (
            <div className="wrapper">
                <WindowFrame select={this.changeMenu} update={e => this.CheckForUpdate(true)}/>
                <IconMenu
                    select={this.changeMenu}
                />

                <div className="App">
                    <DownloadTabsSelector
                        changeTab={(TabType) => {
                            this.changeViewTab(TabType)
                        }}
                        currentTab={this.state.viewTab}
                    />
                    {/*
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
                    */}

                    {(() => {
                        switch (this.state.currentMenu) {
                            case Menus.NEW_DOWNLOAD: {
                                return <DownloadMenu
                                    pastDownloads={this.state.pastDownloads}
                                    createDownload={(url,name,headers) => this.createDownload(url,name,headers)}
                                    queueDownload={download => this.queueDownload(download)}
                                    changeMenu={this.changeMenu}
                                    close={this.closeMenu}
                                    alert={this.alert}
                                />
                            }
                            case Menus.SETTINGS: {
                                return <SettingsMenu updateSettings={this.updateSettings}
                                                     settings={this.state.settings}
                                                     close={this.closeMenu}/>
                            }
                            case Menus.HISTORY: {
                                return <HistoryMenu pastDownloads={this.state.pastDownloads} close={this.closeMenu}/>
                            }
                            case Menus.ABOUT: {
                                return <AboutMenu version={version} close={this.closeMenu}/>
                            }
                            case Menus.CONTACT: {
                                return <ContactMenu close={this.closeMenu}/>;
                            }
                            case Menus.OTHER: {
                                return this.state.customMenu;
                            }
                            default: {
                                return null;
                            }
                        }
                    })()}

                    <DownloadTabsContent
                        currentTab={this.state.viewTab}
                        downloads={this.state.downloads}
                        addDownload={(download) => {
                            this.queueDownload(download)
                        }}
                        customFilter={null /* pass the custom filter function */}
                    /> {/* this guy needs to display all the shit like current downloads */}

                </div>
                {/* wtf does this do?
                <div className={"box-display-area"}>
                    {this.state.box}
                </div>*/}
            </div>
        );
    }
}
