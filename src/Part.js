import * as TempFile from "./tempfile";
import * as url_lib from "url";
import Download from "./Download";

const http = window.require('http');
const https = window.require('https');

export default class Part {
    constructor(url, from_byte, to_byte, parent) {
        this.url = url;
        this.from_byte = parseInt(from_byte);
        this.to_byte = parseInt(to_byte);
        this.current_byte = parseInt(from_byte);
        this.stop_byte = parseInt(to_byte);
        this.done = false;
        this.file = new TempFile.TmpFile(Date.now() + from_byte);
        // console.log(this.file.path);
        this.percent_done = 0;
        this.parent = parent;
        if (url_lib.parse(url).protocol === "http:") {
            this.protocol = http;
            this.port = "80";
        } else {
            this.protocol = https;
            this.port = "443";
        }

        this.download = null
    };

    async download_bytes() {
        return await new Promise((resolve, reject) => {
            try {
                const q = url_lib.parse(this.url);
                this.download = this.protocol.get(Download.proxify_headers({
                    port: this.port,
                    protocol: q.protocol,
                    path: q.path,
                    host: q.hostname,
                    headers: {
                        ...this.parent.custom_headers,
                        'Range': `bytes=${this.from_byte}-${this.to_byte}`
                    }
                }, this.parent.proxyOptions), res => {
                    res.on('data', res => {
                        this.file.writeSync(res);
                        void this.parent.madeProgress(res.length);
                        this.current_byte += res.length;
                        this.percent_done = (this.current_byte - this.from_byte) / (this.to_byte - this.from_byte);
                        this.parent.average_in(this.percent_done, this);
                    });
                    res.on('end', () => {
                        this.parent.imDone();
                        this.done = true;
                        resolve();
                    });
                });
                this.download.on("error", (e) => {
                    console.error(e);
                    // debugger;
                })
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

    cancel() {
        this.download.abort();
    }

    async cleanup() {
        this.file.deleteSync();
    }
}