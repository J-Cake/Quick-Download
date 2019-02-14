const fetch = require('node-fetch');
const https = require('https');
const http = require('http');
const url_lib = require('url');
const os = require('os');
const fs = require('fs');
const TempFile = require('./src/tempfile');
const path = require('path');

/**
 * @var protocol
 * @var port
 */
class Download{
    constructor(){

    }
    async init(url, name, save_location){
        return await new Promise(async resolve => {
            this.save_location = save_location;
            this.extension = Download.get_extension(url);
            this.final_temp_file = path.join(save_location,name + this.extension);
            this.url = url;
            this.name = name;
            this.average_percentage = 0;
            this.average_index = 0;
            this.last_print = 0;
            this.parts = [];
            this.parts_done = 0;
            if (url_lib.parse(url).protocol === "http:") {
                this.protocol = http;
                this.port = "80";
            } else {
                this.protocol = https;
                this.port = "443";
            }
            this.total_length = await Download.get_length(url);
            resolve(this);
        });
    }
    static get_lib(url){
        if(url_lib.parse(url).protocol === "http:") {
            return http;
        } else {
            return https;
        }
    }
    static get_extension(url){ // https://stackoverflow.com/a/6997591/7886229
        // Remove everything to the last slash in URL
        url = url.substr(1 + url.lastIndexOf("/"));

        // Break URL at ? and take first part (file name, extension)
        url = url.split('?')[0];

        // Sometimes URL doesn't have ? but #, so we should aslo do the same for #
        url = url.split('#')[0];

        // Now we have only extension
        return path.extname(url);
    }
    static async get_length(url){
       return await new Promise(resolve => {
           const q = url_lib.parse(url);
           Download.get_lib(url).request({
               method: 'HEAD',
               path: q.pathname,
               host: q.hostname,
               port: (q.protocol === "http:") ? 80 : 443
           },(res)=>{
             resolve(res.headers['content-length']);
           }).end();
       });
    }
    static async byte_request_supported(url) {
        return await new Promise(resolve => {
            const q = url_lib.parse(url);
            Download.get_lib(url).request({
                method: 'GET',
                headers: {
                    'Range': 'bytes=0-1'
                },
                path: q.pathname,
                host: q.hostname,
                port: (q.protocol === "http:") ? 80 : 443
            }, (res) => {
                res.on("data",(chunk) => {
                    res.destroy();
                    resolve(res.statusCode);
                });

            }).end();
        });
    }
    static async download_speed(){
        const url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db";
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise(resolve => {
            http.get(url, (resp) => {
                setTimeout(function () {
                    resp.destroy();
                },5000);
                resp.on("data", (chunk => {
                    dl += chunk.length;
                }));
                resp.on("end", function () {
                    time_difference = (Date.now() - start)/1000;
                    resolve(Math.round(dl / time_difference));
                });
            });
        });
    }
    static async throttled_speed(url) {
        const start = Date.now();
        let dl = 0;
        let time_difference = 0;
        return await new Promise(resolve => {
            Download.get_lib(url).get(url, (resp) => {
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
            });
        });
    }
    average_in(percent_done_input, from_part){
        if(this.average_index === 4){
            this.average_index = 0;
            this.average_index = 0;
        }
        this.average_percentage = ((this.average_percentage * this.average_index) + percent_done_input) / (this.average_index + 1);
        this.average_index += 1;
        if(this.average_percentage - this.last_print > 0.01){
            console.log(this.average_percentage);
            this.last_print = this.average_percentage;
        }
    }
    createParts(){
       /* let num_of_parts_to_create = parseInt(Download.download_speed() / Download.throttled_speed(this.url)) - 1;
        if (num_of_parts_to_create <= 0){
            num_of_parts_to_create = 1;
        } */
        let num_of_parts_to_create = 26;
        let last_int = -1;
        for (let i = 0; i < num_of_parts_to_create; i++) {
            let to_byte = parseInt((this.total_length / num_of_parts_to_create) * (i + 1));
            this.parts.push(new Part(this.url,last_int + 1, to_byte, this));
            last_int = to_byte;
        }
        return this;
    }
    async download_all(){
        console.log("Downloading All Parts");
        console.log("Num of parts: " + this.parts.length);
        let promises = [];
        for (let i = 0; i < this.parts.length; i++) {
            promises.push(new Promise(async resolve => {
               await this.parts[i].download_bytes();
               resolve();
            }));
        }
        await Promise.all(promises).then(function () {

        });
        return this
    }
    imDone() {
        console.log(++this.parts_done + " of " + this.parts.length + " completed");
    }
    async combineParts_move_to_final() {
        let final = fs.createWriteStream(this.final_temp_file, {flags: 'a'});
        for (const part of this.parts) {
            await Download.pipeFileToWriteStream(part.file.path, final);
        }
        return this;
    }
    static async pipeFileToWriteStream(path, stream) {
        return await new Promise((resolve, reject) => {
            const r = fs.createReadStream(path);
            r.on('close', resolve);
            r.on('error', reject);
            r.pipe(stream);
        });
    }
    async cleanup(){
        for (const part of this.parts) {
            part.cleanup();
        }
    }
}

class Part {
    constructor(url, from_byte, to_byte,parent){
        this.url = url;
        this.from_byte = parseInt(from_byte);
        this.to_byte = parseInt(to_byte);
        this.current_byte = parseInt(from_byte);
        this.stop_byte = parseInt(to_byte);
        this.file = new TempFile.TmpFile(Date.now()*to_byte);
        this.percent_done = 0;
        this.parent = parent;
        if(url_lib.parse(url).protocol === "http:") {
            this.protocol = http;
            this.port = "80";
        } else {
            this.protocol = https;
            this.port = "443";
        }
    };
    async download_bytes(){
      return await new Promise(resolve => {
            const q = url_lib.parse(this.url);
            this.protocol.get({
                port: this.port,
                protocol: q.protocol,
                path: q.pathname,
                host: q.hostname,
                headers: {
                    'Range': `bytes=${this.from_byte}-${this.to_byte}`
                }
            }, (res) => {
                res.on('data', (res) => {
                    this.file.writeSync(res);
                    this.current_byte += res.length;
                    this.percent_done = (this.current_byte - this.from_byte) / (this.to_byte - this.from_byte);
                    this.parent.average_in(this.percent_done, this);
                });
                res.on('end', () => {
                    this.parent.imDone();
                    resolve();
                })
            });
        });
    }
    async cleanup(){
        this.file.deleteSync();
    }
}

process.on('exit', () => {
    // cleanup code here. delete all temporary files and directories
});

async function Main(){
    let download = await new Download().init("http://ipv4.download.thinkbroadband.com/100MB.zip",
        "100mbzip", '/Users/joshuabrown3/Desktop/vid');
    await download.createParts().download_all();
    await download.combineParts_move_to_final();
    await download.cleanup();
}
Main();