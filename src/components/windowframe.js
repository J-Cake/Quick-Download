import React from 'react';
import '../css/frame.css';
import '../css/nav_bar.css';


import {$} from './utils';

const _electron = window.require('electron');
const remote = _electron.remote;
const _window = remote.getCurrentWindow();

const Mousetrap = window.Mousetrap;

window.localStorage.hasRelaunched = window.localStorage.hasRelaunched || "false";
window.localStorage.withFrame = window.localStorage.withFrame || 'true';

let platform = remote.require('os').platform();

if (platform !== "win32" && platform !== "darwin") {
    platform = "other";
    if (window.localStorage.hasRelaunched === "false") {
        window.localStorage.hasRelaunched = "true";
        window.localStorage.withFrame = "true";
        _electron.ipcRenderer.send('withFrame');
    } else {
        window.localStorage.hasRelaunched = "false";
        window.localStorage.withFrame = "false";
    }
} else {
    if (window.localStorage.withFrame === "true") {
        window.localStorage.withFrame = "false";
        window.localStorage.hasReloaded = "false";
        _electron.ipcRenderer.send('noFrame');
    }

    if (_window.frame) {
        _electron.ipcRenderer.send('noFrame');
    }
}

export default class WindowFrame extends React.Component {
    constructor(...args) {
        super(...args);
        this.state = {
            restore: false,
            showMenu: false,
        }
    }

    componentDidMount() {
        Mousetrap.bind('alt', () => this.setState(prev => ({showMenu: !prev.showMenu})));

        if ($(".titlebar")) {
            $(".min-btn").on("click", e => {
                _window.minimize();
            });
            $(".max-btn").on("click", e => {
                    _window.maximize();
            });
            $(".restore-btn").on("click", e => {
                    _window.restore();
            });
            $(".close-btn").on("click", e => {
                _window.close();
            });

            this.updateButtons();

            _window.on('resize', () => this.updateButtons(), false);
        }
    }

    updateButtons() {
        this.setState({restore: _window.isMaximized()});
    }

    render() {
        if (!_window.frame) {
            return (
                <header style={{display: _window.isFullScreen() ? "none" : "block"}} className={`titlebar`}>
					<div className={`drag-region ${platform}`}>
                        <div className={`window-title`}>
                            <img src={"./favicon.ico"} className={`icon`} alt={"Quick Downloader"}/>
                            <span>Quick Downloader</span>
                        </div>

                        {platform === "win32" ?
                            <div className={"nav_bar_container"}>
                                <div className="nav_bar_wrapper">
                                    <div className="nav_item">File
                                        <div className="nav_dropdown">
											<div onClick={e => this.props.download()}>New Download
											</div>
                                        </div>
                                    </div>
                                    <div className="nav_item">View
                                        <div className="nav_dropdown">
											<div>Theme <i style={{fontSize: "10px"}} className={"more fas fa-chevron-right"}/>
                                                <div className="nav_dropdown toggle">
                                                    <div data-active={window.localStorage.getItem('theme') === 'light' ? 'active' : undefined}>Light</div>
                                                    <div data-active={window.localStorage.getItem('theme') === 'dark' ? 'active' : undefined}>Dark</div>
                                                </div>
                                            </div>
                                            <div onClick={e => _electron.ipcRenderer.send('toggledevtools')}>Toggle Dev Tools</div>
                                        </div>
                                    </div>
                                    <div className="nav_item">Help
                                        <div className="nav_dropdown">
                                            <div onClick={e => this.props.contact()}>Contact Developers</div>
                                            <div onClick={e => this.props.update()}>Check for Updates...</div>
                                            <div onClick={e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download")}>Learn More</div>
                                            <div onClick={e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download")}>Contribute</div>
                                            <div onClick={e => this.props.about()}>About</div>
                                            <div onClick={e => _electron.ipcRenderer.send('openURL', "https://github.com/jbis9051/quick_download")}>Docs</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            : null}
                        <div className={`window-controls ${platform}`}>
                            <div className={`button min-btn`}>
                                <span>{platform === "win32" ? "" : ""} </span>
                            </div>
                            <div className={`button max-btn`}
                                 style={{display: !this.state.restore ? "inherit" : "none"}}>
                                <span>{platform === "win32" ? "" : ""}</span>
                            </div>
                            <div className={`button restore-btn`}
                                 style={{display: !this.state.restore ? "none" : "inherit" }}>
                                <span>{platform === "win32" ? "" : ""}</span>
                            </div>
                            <div className={`button close-btn`}>
                                <span>{platform === "win32" ? "" : ""}</span>
                            </div>
                        </div>
                    </div>
                </header>
            );
        } else {
            return (
                <div>
                    No Header
                </div>
            )
        }
    }
}