const url_lib = require('url');
const EventEmitter = require('events');
const http = require('http');
const https = require('https');
const fs = require('fs');
const validFilename = require('valid-filename');
const request = require('request');
const Part = require("./Part");
const path = require('path');
const rimraf = require("rimraf");
module.exports = class Download extends EventEmitter {
    /**
     * @param url
     * @param parts
     * @param customHeaders
     * @param {Object || boolean}proxyOptions - Object or false
     * @param proxyOptions.awaiting - boolean - if proxy object is still busy. Preferably, wait for object to finish before commencing download
     * @param proxyOptions.auth - Object or false - if proxy requires auth details
     * @param proxyOptions.auth.username - string - required if proxyOptions.auth is true - username for auth
     * @param proxyOptions.auth.password - string - required if proxyOptions.auth is true - password for auth
     * @param proxyOptions.hostname - string required - hostname of proxy (proxy.example.com)
     * @param proxyOptions.port - integer required - port of proxy
     * @param proxyOptions.protocol - string -  "http" || "https"
     */
    constructor(url, parts, customHeaders, proxyOptions) {
        super();
        this.url = url;
        this.numParts = parts;
        this.customHeaders = customHeaders;
        this.proxyOptions = proxyOptions;
        this.downloaded_bytes = 0;
        this.parts_done = 0;
        this.parts = [];
        /* don'tcha just love using libraries that support proxies? */
        if (proxyOptions) {
            if (proxyOptions.auth) {
                this.request = request.defaults({proxy: `${proxyOptions.protocol}://${proxyOptions.auth.username}:${proxyOptions.auth.password}@${proxyOptions.hostname}:${proxyOptions.port}`});
            } else {
                this.request = request.defaults({proxy: `${proxyOptions.protocol}://${proxyOptions.hostname}:${proxyOptions.port}`});
            }
        } else {
            this.request = request;
        }
        /* this.average_percentage = 0;
         this.average_index = 0;
         this.last_print = 0;
         this.parts = [];
         this.parts_done = 0;
         this.progress = 0;
         this.stats = [];
         this.last_update = 0;
         this.last_speed_update_time = 0;
         this.last_speed_progress = 0;
         this.cancelled = false;*/
    }

    async init(file_name, save_location) {
        this.emit("init");
        if (!validFilename(file_name)) {
            this.error("Invalid File Name");
            return false;
        }
        this.final_file = Download.getFileName(file_name, save_location, this.url).replace(/\\/g, '/');
        this.packageLocation = this.final_file + ".quickdownload";
        fs.mkdir(this.packageLocation);
        this.bytes_request_supported = await this.byte_request_supported().catch(err => this.warn(err.toString()));
        this.total_length = await this.get_length().catch(err => this.error(err));
        this.emit("init-complete", {
            final_final: this.final_file,
            packageLocation: this.packageLocation,
            bytes_request_supported: this.bytes_request_supported,
            size: this.total_length,
        });
        return this.full_fail;
    }

    onUpdate(e) {
        this.emit('update', e);
    }

    warn(e) {
        this.emit('warn', e);
    }

    error(e) {
        this.full_fail = true;
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

    static get_extension(url) {
        if (url.split('/').pop().split('?')[0].split('#')[0].indexOf('.') < 0) {
            return '';
        }
        return `.${url.split('/').pop().split('?')[0].split('#')[0].split('.').pop()}`;
    }

    get_length() {
        return new Promise((resolve, reject) => {
            this.request({
                method: 'HEAD',
                url: this.url,
                headers: {
                    ...this.customHeaders,
                }
            }, (_, response) => {
                resolve(parseInt(response.headers['content-length']) || false);
            }).on("error", err => {
                reject(err);
            });
        });
    }

    byte_request_supported() {
        return new Promise((resolve, reject) => {
            const r = this.request({
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1',
                    ...this.customHeaders,
                },
                url: this.url,
            })
                .on('response', response => {
                    resolve(response.statusCode === 206);
                    r.abort();
                })
                .on('error', (e) => {
                    reject(e);
                });
        });
    }

    createParts() {
        this.emit("create_parts");
        let last_int = -1;
        for (let i = 0; i < this.numParts; i++) {
            let to_byte = Math.floor((this.total_length / this.numParts) * (i + 1));
            const part = new Part(this.url, last_int + 1, to_byte, this.packageLocation + `/${i}.part`, request);
            part
                .on("update", e => {
                    this.downloaded_bytes += e.newBytes;
                    this.onUpdate({
                        downloaded_bytes: this.downloaded_bytes,
                        parts_done: this.parts_done,
                    });
                })
                .on('complete', () => {
                    this.parts_done++;
                    if (this.parts_done === this.numParts) {
                        this.emit('parts-done');
                    } else {
                        this.onUpdate({
                            downloaded_bytes: this.downloaded_bytes,
                            parts_done: this.parts_done,
                        });
                    }
                });
            this.parts.push(part);
            last_int = to_byte;
        }
        return this;
    }

    /*
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
    */
    async download_all() {
        this.emit("download_all");
        const promises = [];
        for (let i = 0; i < this.parts.length; i++) {
            promises.push(this.parts[i].download_bytes());
        }
        await Promise.all(promises).catch(err => reject(err));
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

    async cancel() {
        this.emit("cancel");
        this.cancelled = true;
        for (const part of this.parts) {
            part.cancel(); // complete download cancellation
        }
    }

    cleanUp() {
        rimraf(this.packageLocation, () => {
            this.emit('cleaned-up');
            this.emit('complete');
        })
    }

    async download() {
        await this.createParts();
        await this.download_all();
        await this.combineParts_move_to_final().catch(err => this.error(err.toString()));
        await this.cleanUp();
    }

};
