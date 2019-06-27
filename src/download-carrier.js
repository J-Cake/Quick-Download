import Download from './Download';
import DownloadItem from './components/DownloadItem/DownloadItem.js';
import React from "react";

import Enum from './enum.js';
import DownloadTabsContent from "./components/DownloadTabs/DownloadTabsContent";

const {DownloadStatus} = Enum;

const events = window.require('events');

Date.prototype.print = function () {
    return `${this.getUTCHours() || 0}h:${this.getUTCMinutes() || 0}m:${this.getUTCSeconds() || 0}s`;
};

export default class DownloadCarrier extends React.Component {
    constructor(url, name, headers, saveLocation,proxyOptions) {
        super(null);

        this.emitter = new events.EventEmitter();

        this.state = {
            status: DownloadStatus.AWAITING,

            percentage: 0,
            progress: 0,
            size: 0,
            speed: 0,
            eta: null,
            elapsedTime: 0,
            chunks_done: 0,
            total_chunks: null,
            path: saveLocation,
            error: null,

        };

        this.url = url;
        this.name = name;
        this.saveLocation = saveLocation;
        this.customHeaders = (typeof headers === "string") ? DownloadCarrier.JSONparse(headers) : headers;
        if (this.download) {
            this.download.constructor(); // retry download, need to reset everything
        } else {
            this.download = new Download();
            this.download.on('update', info => this.update(info));
            this.download.on('error', err => this.error(err));

            this.download.on("init-complete", () => {
                this.setState({
                    status: DownloadStatus.PENDING,
                });
                this.emitter.emit('next');
            });
            this.download.on("download_all", () => {
                this.setState({
                    status: DownloadStatus.ACTIVE,
                });
            });
            this.download.on("downloads_complete", () => {
                this.setState({
                    status: DownloadStatus.FINISHING,
                });
                this.emitter.emit('next');
            });
            this.download.on("complete", () => {
                this.download.done = true;
                this.setState({
                    status: DownloadStatus.DONE,
                });
                this.emitter.emit('next');
            });
        }
        this.headersExpanded = false;

        this.done = false;

        this.last_update = 0;

        this.functions = {
            cancel: this.cancel.bind(this),
            remove: this.remove.bind(this),
            retry: this.retry.bind(this),
            toggleHeaders: this.toggleHeaders.bind(this),
        };
        /*
                if (window.localStorage.proxySettings === "auth") {
                    this.proxyOptions = {
                        hostname: window.localStorage.proxyHost,
                        port: window.localStorage.proxyPort,
                        auth: (window.localStorage.proxyRequiresCredentials === "true") ? {
                            username: window.localStorage.proxyUsername,
                            password: window.localStorage.proxyPassword,
                        } : false,
                    };
                }
                */
    }


    async initiateDownload(parts) {
       this.emitter.emit("init");
       await this.download.init(this.url, this.name, this.saveLocation, parts, this.customHeaders, this.proxyOptions || false);
       this.setState({
            status: DownloadStatus.PENDING,
       });
    }

    async startDownload() {
        await this.download.beginDownload();
    }

    toggleHeaders() {
        this.headersExpanded = !this.headersExpanded;
    }

    update(info) {
        this.stateProxy = Object.assign({}, this.stateProxy, info);
        if (Date.now() - this.last_update > 800 || info.done) {
            this.last_update = Date.now();
            this.setState(this.stateProxy);
            this.emitter.emit("update", this.stateProxy);
        }
    }

    error(err) {
        this.setState({
            status: DownloadStatus.FAILED,
            error: err,
        });
        this.download.cancel();
        this.emitter.emit("error", err);
    }

    static calculateSize(bytes) {
        let output = bytes;
        let steps = 0;

        let units = [];

        if (window.localStorage.getItem('preferredUnit') === "bin") {
            units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];

            while (output > 1024) {
                output /= 1024;
                steps++;
            }
        } else if (window.localStorage.getItem('preferredUnit') === "dec") {
            units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

            while (output > 1000) {
                output /= 1000;
                steps++;
            }
        }

        return parseFloat(output).toFixed(2) + " " + units[steps];
    }

    async cancel() {
        if(this.state.status !== DownloadStatus.FAILED){
            this.setState({
                status: DownloadStatus.STOPPED,
            })
        }
        if (this.download) {
            await this.download.cancel();
        }
        this.emitter.emit('cancel');
        this.emitter.emit('next');
    }

    remove() {
        this.emitter.emit('remove');
    }

    async retry() {
        this.download.constructor();
        this.setState({
            status: DownloadStatus.PENDING
        });
        await this.initiateDownload();
        this.emitter.emit('retry');
        this.emitter.emit('next');
    }

    static JSONparse(str) {
        str = str || "{}";
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return JSON.parse(str);
    }

    formatProps(props) {
        return {
            percentage: Number(parseFloat(props.percentage || 0).toFixed(7)),
            filename: this.name,
            progress: `${DownloadCarrier.calculateSize(props.progress || 0)} / ${DownloadCarrier.calculateSize(props.size || 0)}`,
            size: DownloadCarrier.calculateSize(props.size || 0),
            speed: `${DownloadCarrier.calculateSize(props.speed || 0)}/s`,
            eta: `${new Date(props.eta || Date.now()).toLocaleString()} (${new Date(props.eta - Date.now()).print()})` || 0,
            elapsedTime: props.elapsedTime || 0,
            parts: `${props.chunks_done || 0} / ${props.total_chunks || 0}`,
            path: props.path || "",
            url: this.url || "",
            headers: this.customHeaders || "",
            headersExpanded: this.headersExpanded || false,
            error: props.error || "None",
        };
    }

/*
    render(key) {
        return <DownloadItem key={key} status={this.status} functions={this.functions}
                             stats={this.formatProps(this.state)}/>
    }*/

}

/*
        if (window.localStorage.proxySettings === "auth") {
            this.proxyOptions = {
                hostname: window.localStorage.proxyHost,
                port: window.localStorage.proxyPort,
                auth: (window.localStorage.proxyRequiresCredentials === "true") ? {
                    username: window.localStorage.proxyUsername,
                    password: window.localStorage.proxyPassword,
                } : false,
            };
        }
        */
