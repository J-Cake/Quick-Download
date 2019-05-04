import * as url_lib from 'url';
import * as path from 'path';
import './Part';
import Part from "./Part";

const events = window.require('events');
const http = window.require('http');
const https = window.require('https');
const fs = window.require('fs');
const validFilename = window.require('valid-filename');

export default class Download extends events.EventEmitter {
    constructor() {
        super();
        this.average_percentage = 0;
        this.average_index = 0;
        this.last_print = 0;
        this.parts = [];
        this.parts_done = 0;
        this.progress = 0;
        this.stats = [];
        this.last_update = 0;
        this.last_speed_update_time = 0;
        this.last_speed_progress = 0;
        this.cancelled = false;
    }

    /**
     * @param url
     * @param name
     * @param save_location
     * @param parts
     * @param custom_headers - object of custom headers
     * @param proxyOptions - Object or false
     * @param proxyOptions.awaiting - boolean - if proxy object is still busy. Preferably, wait for object to finish before commencing download
     * @param proxyOptions.auth - Object or false - if proxy requires auth details
     * @param proxyOptions.auth.username - string - required if proxyOptions.auth is true - username for auth
     * @param proxyOptions.auth.password - string - required if proxyOptions.auth is true - password for auth
     * @param proxyOptions.hostname - string required - hostname of proxy (proxy.example.com)
     * @param proxyOptions.port - integer required - port of proxy
     * @param proxyOptions.protocol - string -  "http" || "https"
     * @returns {Promise<Download>}
     */

    init(url, name, save_location, parts, custom_headers, proxyOptions) {
        return new Promise(async resolve => {
            this.emit("init");
            if (!validFilename(name)) {
                this.error("Invalid File Name");
              return  resolve(this);
            }
            this.save_location = save_location;
            this.proxyOptions = (proxyOptions === false || Object.keys(proxyOptions).length === 0) ? false : proxyOptions;
            this.custom_headers = custom_headers || {};
            this.final_file = Download.getFileName(name, save_location, url).replace(/\\/g, '/');
            this.onUpdate({
                path: this.final_file,
            });
            fs.closeSync(fs.openSync(this.final_file, 'w')); /* touches the file to alert everyone that this is my final and no one should touch it */
            this.url = url;
            this.full_fail = false;
            this.speed = 0;
            this.bytes_request_supported = true;
            if (!await Download.byte_request_supported(url, this.custom_headers, this.proxyOptions)
                .catch(
                    err => {
                        this.error(err.toString());
                        return resolve(this);
                    }
                )
            ) {
                this.bytes_request_supported = false;
                this.error("Byte Requests are not supported.");
                return resolve(this);
            }
            this.total_length = await Download.get_length(url, this.custom_headers, this.proxyOptions).catch(err => this.error(err));
            this.onUpdate({
                size: this.total_length,
            });
            this.name = name;
            this.numOfParts = parts || 10;
            this.onUpdate({
                total_chunks: this.numOfParts,
            });
            this.startTime = Date.now();
            if (url_lib.parse(url).protocol === "http:") {
                this.protocol = http;
                this.port = "80";
            } else {
                this.protocol = https;
                this.port = "443";
            }
            this.emit("init-complete");
            return resolve(this);
        });
    }

    onUpdate(e) {
        this.emit('update', e);
    }

    error(e) {
        this.full_fail = true;
        this.onUpdate({
            status: 1,
            error: e
        });
        this.emit('error', e);
    }


    static getFileName(name, saveLocation, url) {
        // Apply download extension if name doesn't have one:
        if (name.split('.').length > 1) {
            return path.join(saveLocation, name);
        } else {
            return path.join(saveLocation, name + Download.get_extension(url));
        }
    }


    static get_lib(url, proxyOptions) {
        proxyOptions = proxyOptions || false;
        if (url_lib.parse(url).protocol === "http:" || proxyOptions) {
            return http;
        } else {
            return https;
        }
    }

    static get_extension(url) {
        if (url.split('/').pop().split('?')[0].split('#')[0].indexOf('.') < 0) {
            return '';
        }
        return `.${url.split('/').pop().split('?')[0].split('#')[0].split('.').pop()}`;
    }


    static async get_length(url, customHeaders, proxyOptions) {
        return await new Promise((resolve, reject) => {
            const q = url_lib.parse(url);
            // console.log(JSON.stringify(q));
            Download.get_lib(url, proxyOptions).request(Download.proxify_headers({
                method: 'HEAD',
                path: q.path,
                host: q.hostname,
                port: (q.protocol === "http:") ? 80 : 443,
                url: url,
                headers: {
                    ...customHeaders,
                }
            }, proxyOptions), res => {
                res.on("error", err => {
                    reject(err);
                });
                resolve(Number(res.headers['content-length'] || "0"));
            }).end();
        });
    }

    static byte_request_supported(url, customHeaders, proxyOptions) {
        return new Promise((resolve, reject) => {
            const q = url_lib.parse(url);
            const request = Download.get_lib(url, proxyOptions).request(Download.proxify_headers({
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1',
                    ...customHeaders
                },
                path: q.path,
                host: q.hostname,
                port: (q.protocol === "http:") ? 80 : 443,
                url: url,
            }, proxyOptions), res => {
                resolve(res.statusCode === 206);
                res.on("data", () => {
                    resolve(res.statusCode === 206);
                    res.destroy();
                });
            });
            request.on('error', (e) => {
                reject(e);
            });
            request.end();
            // resolve(true);
            // reject("False");
        });
    }

    static proxify_headers(headers, proxyOptions) {
        if (!proxyOptions) {
            // console.log("No Proxy");
            delete headers.url;
            return headers;
        }
//		const proxySplit = url_lib.parse(proxyOptions.url);
        let returnHeaders = {
            method: headers.method,
            host: proxyOptions.hostname,
            port: proxyOptions.port,
            path: headers.url,
            headers: {
                ...headers.headers,
                Host: headers.host
            }
        };
        if (proxyOptions.auth) {
            const username = proxyOptions.auth.username;
            const password = proxyOptions.auth.password;
            const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
            returnHeaders = {
                ...returnHeaders,
                'Proxy-Authorization': auth
            };
        }
        // // debugger;
        return returnHeaders;
    }

    static async download_speed() {
        const url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db";
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise((resolve, reject) => {
            http.get(url, (resp) => {
                setTimeout(function () {
                    resp.destroy();
                }, 5000);
                resp.on("data", (chunk => {
                    dl += chunk.length;
                }));
                resp.on("end", function () {
                    time_difference = (Date.now() - start) / 1000;
                    resolve(Math.round(dl / time_difference));
                });
                resp.on('err', err => {
                    reject(err);
                })
            });
        });
    }

    static async throttled_speed(url) {
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise((resolve, reject, proxyOptions) => {
            Download.get_lib(url, proxyOptions).get(url, (resp) => {
                setTimeout(function () {
                    resp.destroy();
                }, 5000);
                resp.on("data", (chunk => {
                    dl += chunk.length;
                }));
                resp.on("end", function () {
                    time_difference = (Date.now() - start) / 1000;
                    resolve(Math.round(dl / time_difference));
                });
                resp.on('err', err => {
                    reject(err);
                })
            });
        });
    }

    average_in(percent_done_input) {
        if (this.average_index === 4) {
            this.average_index = 0;
            this.average_index = 0;
        }
        this.average_percentage = ((this.average_percentage * this.average_index) + percent_done_input) / (this.average_index + 1);
        this.average_index += 1;

        if (this.average_percentage - this.last_print > 0.01) {
            void this.madeProgress(0);

            this.last_print = this.average_percentage;
        }
    }

    createParts() {
        this.emit("create_parts");
        this.num_of_parts_to_create = this.numOfParts;
        let last_int = -1;
        for (let i = 0; i < this.num_of_parts_to_create; i++) {
            let to_byte = (this.total_length / this.num_of_parts_to_create) * (i + 1);
            this.parts.push(new Part(this.url, last_int + 1, to_byte, this));
            last_int = to_byte;
        }
        return this;
    }

    async madeProgress(amount, done, forceUpdate) {
        if (this.full_fail) {
            return;
        }
        this.progress += amount;

        const now = Date.now();
        const time = new Date(now - this.startTime);
        this.onUpdate({
            percentage: ((this.progress / this.total_length) * 100) || 0,
            progress: this.progress,
            speed: this.speed,
            chunks_done: this.parts.map(i => Number(i.done)).reduce((a, i) => a + i, 0),
            done: done || false,
            elapsedTime: `${String(time.getUTCHours()).padStart(2)}h ${String(time.getUTCMinutes()).padStart(2)}m ${String(time.getUTCSeconds()).padStart(2)}s`
        });
        if (Date.now() - this.last_update > 800 || done || forceUpdate) {
            this.last_update = Date.now();
            this.onUpdate({
                eta: this.ETA,
            });
        }
    }

    get ETA() {
        const elapsedTime = (Date.now() - this.last_speed_update_time);
        const speed = (this.progress - this.last_speed_progress) / elapsedTime;
        const remainingTime = ((this.total_length - this.last_speed_progress) / speed) - elapsedTime;
        this.last_speed_update_time = Date.now();
        this.last_speed_progress = this.progress;

        this.stats.push({
            time: elapsedTime,
            progress: this.progress
        });

        this.speed = Math.floor(speed) * 1000;

        const eta = Date.now() + remainingTime;

        if (eta === Infinity)
            return 0;
        else
            return eta;
    };

    async forceUpdate(done) {
        await this.madeProgress(0, done);
    }

    download_all() {
        this.emit("download_all");
        return new Promise((resolve, reject) => {
            const promises = [];
            for (let i = 0; i < this.parts.length; i++) {
                promises.push(new Promise(async (resolve, reject) => {
                    await this.parts[i].download_bytes().catch(reject);
                    resolve();
                }));
            }
            Promise.all(promises).then(() => resolve(this)).catch(err => reject(err));
        });
    }

    imDone() {
        // console.log(++this.parts_done + " of " + this.parts.length + " completed");
        this.madeProgress(0);
    }

    combineParts_move_to_final() {
        this.emit("combine_parts");
        return new Promise((resolve, reject) => {
            let final = fs.createWriteStream(this.final_file, {flags: 'a'});
            final.on('finish', resolve);
            final.on('open', async () => {
                for (const part of this.parts) {
                    await new Promise(resolve => {
                        const r = fs.createReadStream(part.file.path);
                        r.on('close', resolve);
                        r.on('error', (err) => {
                            reject(err);
                        });
                        r.pipe(final, {end: false});
                    });
                }
                final.end();
            });
        });
    }

    async cleanup() {
        this.emit("cleanup");
        for (const part of this.parts) {
            part.cleanup();
        }
    }

    async cancel() {
        this.emit("cancel");
        this.cancelled = true;
        for (const part of this.parts) {
            part.cancel(); // complete download cancellation

        }
        await this.cleanup();
    }

    async beginDownload() {
        if (this.bytes_request_supported) {

            await this.createParts();
            await this.forceUpdate();
            const updateInterval = setInterval(() => {
                this.madeProgress(0, false, true);
            }, 800);
            await this.download_all();
            clearInterval(updateInterval);
            await this.forceUpdate();
            if (!this.cancelled) {
                this.emit("downloads_complete");
                await this.combineParts_move_to_final().catch(err => this.error(err.toString()));
                await this.forceUpdate();

                await this.cleanup();
                await this.madeProgress(0, true);
                this.emit("complete");
            }
        } else {
            console.error("beginDownload called even though bytes requests aren't supported")
        }
    }

}