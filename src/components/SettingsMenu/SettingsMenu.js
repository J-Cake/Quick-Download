import React from 'react';
import StandardMenu from '../Shared/StandardMenu/StandardMenu';
import Checkbox from "../Shared/checkbox";

const path = window.require('path');
const os = window.require('os');
const _electron = window.require('electron');



export default class SettingsMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    changePath() {
        let dir = _electron.ipcRenderer.sendSync('pickDir');
        this.props.updateSettings(prev => ({
            saveLocation: dir || prev.saveLocation
        }));
    }

    resetToDefaults(e) {
        if (_electron.ipcRenderer.sendSync('confirmClear')) {
            this.props.updateSettings(this._defaults);
        }
    }

    render() {
        return (
            <StandardMenu title={"Settings"} close={e => this.props.close()}>
                <h2>Appearance</h2>
                <div className={"settings-group"}>
                    <div className={"setting"}>
                        <label htmlFor="dark">Dark Theme</label>
                        <input
                            onChange={field => {
                                if (field.target.value === "on") {
                                   this.props.updateSettings({
                                        theme: "dark"
                                    });
                                }
                            }}
                            className={"standard_radio right_aligned"}
                            name={"theme"}
                            id={"dark"}
                            type={"radio"}
                            checked={this.props.settings.theme === 'dark'}/>
                    </div>
                    <div className={"setting"}>
                        <label htmlFor="light">Light Theme</label>
                        <input
                            onChange={field => {
                                if (field.target.value === "on") {
                                   this.props.updateSettings({
                                        theme: "light"
                                    });
                                }
                            }}
                            className={"standard_radio right_aligned"}
                            name={"theme"}
                            id={"light"}
                            type={"radio"}
                            checked={this.props.settings.theme === 'light'}/>
                    </div>
                </div>

                <Checkbox checked={this.props.settings.advanced}
                          onChange={value =>this.props.updateSettings({
                              advanced: value
                          })}
                          text={"Show Advanced Download Details"}/>

                <br/>

                <h2>General</h2>
                <div className={"settingsGroup"}>
                    <label htmlFor={"save-location"}>Save Location</label>
                    <label onClick={e => this.changePath()} htmlFor="save-location"
                           className={"standard_path_input"}>{this.props.settings.saveLocation}</label>
                    <label htmlFor={"numOfParts"}>How many parts to use during download</label>
                    <br/>
                    <input id={"numOfParts"}
                           placeholder={"Number of parts to use during download"}
                           type={"number"}
                           min={0}
                           max={50}
                           className={"inline_input"}
                           value={this.props.settings.partsToCreate}
                           onChange={field =>this.props.updateSettings({
                               partsToCreate: Number(field.target.value)
                           })}
                    />
                    {/* //TODO: Add reference to docs explaining how to find the optimum part number */}

                    <br/>
                    <br/>
                    <h3>Units</h3>

                    <hr/>

                    <div className={"setting"}>
                        <input type={"radio"} className={"standard_radio right_aligned"}
                               name={"unit"}
                               onChange={field => {
                                   if (field.target.value === "on") {
                                      this.props.updateSettings({
                                           preferredUnit: "bin"
                                       });
                                   }
                               }} id={"bin"}
                               checked={this.props.settings.preferredUnit === "bin"}/>
                        <label htmlFor={"bin"}>Binary Units (MiB = 1024 KiB)</label>
                    </div>

                    <div className={"setting"}>
                        <input type={"radio"} className={"standard_radio right_aligned"}
                               name={"unit"}
                               onChange={field => {
                                   if (field.target.value === "on") {
                                      this.props.updateSettings({
                                           preferredUnit: "dec"
                                       });
                                   }
                               }} id={"bin"}
                               checked={this.props.settings.preferredUnit === "dec"}/>
                        <label htmlFor={"dec"}>Decimal Units (MB = 1000 KB)</label>
                    </div>

                    <hr/>
                    <br/>

                    <Checkbox checked={this.props.settings.allowNotifications}
                              text={"Allow Notifications"}
                              onChange={value =>this.props.updateSettings({
                                  allowNotifications: value
                              })}/>

                    <br/>
                    <hr/>

                    <input type={"button"} className={"standard_full_button"} onClick={this.resetToDefaults}
                           value={"Reset to default settings"}/>
                </div>

                <br/>

                <h2>Network</h2>

                <div className={"setting"}>
                    <label htmlFor={"none"}>None</label>
                    <input className={"standard_radio right_aligned"} type={"radio"}
                           name={"proxy-auth-type"}
                           checked={this.props.settings.proxySettings === 'none'}
                           id={"none"}
                           onChange={field => {
                               if (field.target.value === "on") {
                                  this.props.updateSettings({
                                       proxySettings: 'none'
                                   });
                               }
                           }}/>
                </div>
                {/*
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
                                   }}/>
                        </div>)
                    : null} {/* <-- won't render anything */}

                <div className={"setting"}>
                    <label htmlFor={"none"}>HTTPS Proxy</label>
                    <input className={"standard_radio right_aligned"}
                           type={"radio"}
                           name={"proxy-auth-type"}
                           checked={this.props.settings.proxySettings === 'auth'}
                           id={"auth"}
                           onChange={field => {
                               if (field.target.value === "on") {
                                  this.props.updateSettings({
                                       proxySettings: 'auth'
                                   });
                               }
                           }}/>
                </div>

                {(() => {
                    if (this.props.settings.proxySettings === "pac") {
                        return (
                            <div>
                                <input placeholder={"https://example.com/proxy/proxy.pac"}
                                       className={"input_standard"}
                                       value={this.props.settings.pacFile}
                                       onChange={field =>this.props.updateSettings({
                                           pacFile: field.target.value
                                       })}
                                       id={"pac-location"}/>

                                <label htmlFor={"pac-location"}>Pac Script Location</label></div>
                        )
                    } else if (this.props.settings.proxySettings === "auth") {

                        return (
                            <div>
                                <label htmlFor={"proxy-host"}>Proxy Host</label>
                                <input placeholder={"proxy.example.com"}
                                       className={"input_standard"}
                                       value={this.props.settings.proxyHost}
                                       onChange={field =>this.props.updateSettings({
                                           proxyHost: field.target.value
                                       })}
                                       id={"proxy-host"}/>
                                <label htmlFor={"proxy-port"}>Proxy Port</label>
                                <br/>
                                <input placeholder={8080}
                                       className={"inline_input"}
                                       type={"number"}
                                       value={this.props.settings.proxyPort}
                                       onChange={field =>this.props.updateSettings({
                                           proxyPort: field.target.value
                                       })}
                                       id={"proxy-port"}/>
                                <br/>
                                <br/>

                                <Checkbox
                                    checked={this.props.settings.proxyRequiresCredentials}
                                    onChange={value =>this.props.updateSettings({
                                        proxyRequiresCredentials: value
                                    })}
                                    text={"Proxy Requires Credentials"}/>
                                {this.props.settings.proxyRequiresCredentials ?
                                   <div>
                                    <input placeholder={"Proxy Username"}
                                           type={"text"}
                                           className={"input_standard"}
                                           onChange={field =>this.props.updateSettings({
                                               proxyUsername: field.target.value
                                           })}
                                           value={this.props.settings.proxyUsername}
                                           id={"proxy-username"}/>
                                    <input placeholder={"Proxy Password"}
                                    type={"password"}
                                    className={"input_standard"}
                                    onChange={field =>this.props.updateSettings({
                                    proxyPassword: field.target.value
                                })}
                                    value={this.props.settings.proxyPassword}
                                    id={"proxy-password"}/>
                                   </div>: null
                                }
                            </div>
                        )
                    } else {
                        return null;
                    }
                })()}
            </StandardMenu>
        )
    }
}