import * as url_lib from 'url';
import * as TempFile from './tempfile';
import * as path from 'path';

const http = window.require('http');
const https = window.require('https');
const fs = window.require('fs');

export default class Download {
    constructor() {
        this.average_percentage = 0;
        this.average_index = 0;
        this.last_print = 0;
        this.parts = [];
        this.parts_done = 0;
        this.progress = 0;
    }

    /**
     *
     * @param url
     * @param name
     * @param save_location
     * @param parts
     * @param onUpdate
     * @param proxyOptions - Object or false
     * @param proxyOptions.awaiting - boolean - if proxy object is still busy
     * @param proxyOptions.auth - boolean - if proxy requires auth details
     * @param proxyOptions.auth.username - string - required if proxyOptions.auth is true - username for auth
     * @param proxyOptions.auth.password - string - required if proxyOptions.auth is true - password for auth
     * @param proxyOptions.hostname - string required - hostname of proxy (proxy.example.com)
     * @param proxyOptions.port - integer required - port of proxy
     * @param proxyOptions.protocol - string -  "http" || "https"
     * @returns {Promise<Download>}
     */
    async init(url, name, save_location, parts, onUpdate, proxyOptions) {
        this.save_location = save_location;
        this.proxyOptions = proxyOptions || false;
        this.extension = Download.get_extension(url);
        this.final_file = path.join(save_location, name + this.extension);
        this.url = url;
        this.total_length = await Download.get_length(url, this.proxyOptions);
        this.name = name;
        this.onUpdate = onUpdate;
        this.numOfParts = parts || 10;
        this.startTime = Date.now();

        if (url_lib.parse(url).protocol === "http:") {
            this.protocol = http;
            this.port = "80";
        } else {
            this.protocol = https;
            this.port = "443";
        }
        return this;
    }

    static get_lib(url, proxyOptions) {
        proxyOptions = proxyOptions || false;
        if (url_lib.parse(url).protocol === "http:" || proxyOptions) {
            return http;
        } else {
            return https;
        }
    }

    static get_extension(url) { // https://stackoverflow.com/a/6997591/7886229
        return `.${url.split('/').pop().split('.').pop()}`;
        // 	// Remove everything to the last slash in URL
        // 	url = url.substr(1 + url.lastIndexOf("."));
        //
        // 	// Break URL at ? and take first part (file name, extension)
        // 	url = url.split('?')[0];
        //
        // 	// Sometimes URL doesn't have ? but #, so we should also do the same for #
        // 	url = url.split('#')[0];
        //
        // 	// Now we have only extension
        // 	return "."+url;
    }

    static async get_length(url, proxyOptions) {
        return await new Promise(resolve => {
            const q = url_lib.parse(url);
            Download.get_lib(url, proxyOptions).request(Download.proxify_headers({
                method: 'HEAD',
                path: q.pathname,
                host: q.hostname,
                port: (q.protocol === "http:") ? 80 : 443,
                url: url,
            }, proxyOptions), res => {
                resolve(Number(res.headers['content-length'] || "0"));
            }).end();
        });
    }

    static async byte_request_supported(url, proxyOptions) {
        return await new Promise(resolve => {
            const q = url_lib.parse(url);
            Download.get_lib(url, proxyOptions).request(Download.proxify_headers({
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1'
                },
                path: q.pathname,
                host: q.hostname,
                port: (q.protocol === "http:") ? 80 : 443,
                url: url,
            }, proxyOptions), res => {
                res.on("data", () => {
                    res.destroy();
                    resolve(res.statusCode);
                });
            }).end();
        });
    }

    static proxify_headers(headers, proxyOptions) {
        console.log("Proxifiying");
        if (!proxyOptions) {
            console.log("No Proxy");
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
                'Authorization': auth
            };
        }
        return returnHeaders;
    }

    static async download_speed() {
        const url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db";
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise(resolve => {
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
                    console.warn(err);
                })
            });
        });
    }

    static async throttled_speed(url) {
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise((resolve, proxyOptions) => {
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
                    throw err;
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
            // console.log(this.average_percentage);

            this.madeProgress(0);

            this.last_print = this.average_percentage;
        }
    }

    createParts() {
        /* let num_of_parts_to_create = parseInt( DownloadComp.download_speed() / DownloadComp.throttled_speed(this.url)) - 1;
        this.totalParts = num_of_parts_to_create;
        if (num_of_parts_to_create <= 0) {
            num_of_parts_to_create = 1;
        } */
        this.num_of_parts_to_create = this.numOfParts || 10;
        let last_int = -1;
        console.log(this.parts);
        for (let i = 0; i < this.num_of_parts_to_create; i++) {
            let to_byte = parseInt((this.total_length / this.num_of_parts_to_create) * (i + 1));
            this.parts.push(new Part(this.url, last_int + 1, to_byte, this));
            last_int = to_byte;
        }
        return this;
    }

    async madeProgress(amount, done) {
        this.progress += amount;

        // console.log(this.progress, this.total_length, this.parts);
        //console.log((this.progress / this.total_length) * 100);
        const now = Date.now();
        const time = new Date(now - this.startTime);
        if (now % 100 === 0 || done) {
            this.onUpdate({
                percentage: (this.progress / this.total_length) * 100,
                average_percentage: this.average_percentage,
                size: this.total_length,
                chunks_done: this.parts_done,
                total_chunks: this.num_of_parts_to_create,
                done: done || false,
                path: this.final_file,
                elapsedTime: `${String(time.getUTCHours()).padStart(2)}h ${String(time.getUTCMinutes()).padStart(2)}m ${String(time.getUTCSeconds()).padStart(2)}s`
            });
        }
    }
    async forceUpdate(done){
        const now = Date.now();
        const time = new Date(now - this.startTime);
        this.onUpdate({
            percentage: (this.progress / this.total_length) * 100,
            average_percentage: this.average_percentage,
            size: this.total_length,
            chunks_done: this.parts_done,
            total_chunks: this.num_of_parts_to_create,
            done: done || false,
            path: this.final_file,
            elapsedTime: `${String(time.getUTCHours()).padStart(2)}h ${String(time.getUTCMinutes()).padStart(2)}m ${String(time.getUTCSeconds()).padStart(2)}s`
        });
    }

    download_all() {
        // console.log("Downloading All Parts");
        // console.log("Num of parts: " + this.parts.length);
        return new Promise((resolve, reject) => {
            const promises = [];
            for (let i = 0; i < this.parts.length; i++) {
                promises.push(new Promise(async resolve => {
                    await this.parts[i].download_bytes();
                    resolve();
                }));
            }
            Promise.all(promises).then(() => resolve(this)).catch(err => reject(err));
        });
    }

    imDone() {
        console.log(++this.parts_done + " of " + this.parts.length + " completed");
        this.madeProgress(0);
    }

    combineParts_move_to_final() {
        return new Promise((resolve => {
            let final = fs.createWriteStream(this.final_file, {flags: 'a'});
            final.on('finish', resolve);
            final.on('open', async () => {
                for (const part of this.parts) {
                    console.log(part.file.path);
                    await new Promise(resolve => {
                        const r = fs.createReadStream(part.file.path);
                        r.on('close', resolve);
                        r.on('error', (err) => {
                            console.log(err)
                        });
                        r.pipe(final, {end: false});
                    });
                }
                final.end();
            });
        }));
    }

    async cleanup(){
        for (const part of this.parts) {
            part.cleanup().then(()=>{
                this.madeProgress(0);
                this.forceUpdate();
            });
        }
    }

    cancel() {
        console.log("Canceling parts...");
        for (const part of this.parts) {
            part.cancel(); // complete download cancellation

        }
        this.cleanup();
        try {
            this.onUpdate({
                status: 1
            });
        } catch (e) {
            console.error(e);
        }

    }

    async beginDownload() {
        try {
            console.log("Creating parts...");
            await this.createParts();
            this.forceUpdate();
            console.log("Downloading parts...");
            await this.download_all();
            this.forceUpdate();
            console.log("Combining parts...");
            await this.combineParts_move_to_final();
            this.forceUpdate();
            console.log("Cleaning up parts...");
            await this.cleanup();
            await this.madeProgress(0, true);
        } catch (e) {
            await this.cleanup();
            throw Error(e);
        }
    }

}

class Part {
	constructor(url, from_byte, to_byte, parent) {
		this.url = url;
		this.from_byte = parseInt(from_byte);
		this.to_byte = parseInt(to_byte);
		this.current_byte = parseInt(from_byte);
		this.stop_byte = parseInt(to_byte);
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
            const startTimer = () => {
                setTimeout(function () {
                }, 100);
            };
            startTimer();
            try {
                const q = url_lib.parse(this.url);
                this.download = this.protocol.get(Download.proxify_headers({
                    port: this.port,
                    protocol: q.protocol,
                    path: q.pathname,
                    host: q.hostname,
                    headers: {
                        'Range': `bytes=${this.from_byte}-${this.to_byte}`
                    }
                }, this.parent.proxyOptions), res => {
                    res.on('data', res => {
                        this.file.writeSync(res);
                        this.parent.madeProgress(res.length);
                        this.current_byte += res.length;
                        this.percent_done = (this.current_byte - this.from_byte) / (this.to_byte - this.from_byte);
                        this.parent.average_in(this.percent_done, this);
                    });
                    res.on('end', () => {
                        // console.log(data);
                        this.parent.imDone();
                        resolve();
                    });
                })
            } catch (e) {
                reject(e);
            }
        });
    }

    async cancel() {
        this.download.abort();
    }

    async cleanup() {
        this.file.deleteSync();
    }
}

/* export default async function beginDownload(url, name, saveLocation, parts, onUpdate) {
	const download = await new Download().init(url, name, saveLocation || (path.join(os.homedir(), 'Downloads')), parts, onUpdate);
	try {
		await download.createParts().download_all();
		await download.combineParts_move_to_final();
		await download.cleanup();
		download.madeProgress(0, true);
	} catch (e) {
		onUpdate({
			status: 1
		});
		await download.cleanup();
	}
} */