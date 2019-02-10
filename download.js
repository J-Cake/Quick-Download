const fetch = require('node-fetch');
const https = require('https');
const http = require('http');
const url_lib = require('url');
const os = require('os');

/**
 * @var protocol
 * @var port
 */
class Download{
    constructor(url, name, save_location){
        this.init(url,name,save_location);
    }
    async init(url, name, save_location){
        this.save_location = save_location;
        this.final_temp_file = tempfile.NamedTemporaryFile({deleteWhenDone: false});

        this.url = url;
        this.total_length = await Download.get_length(url);
        this.extension = Download.get_extension(url);
        this.name = name;
        this.average_percentage = 0;
        this.average_index = 0;
        this.last_print = 0;
        this.parts = [];
        if(url_lib.parse(url).protocol === "http:") {
            this.protocol = http;
            this.port = "80";
        } else {
            this.protocol = https;
            this.port = "443";
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
        return url;
    }
    static async get_length(url){
       return await new Promise(resolve => {
           fetch(url, {method: 'HEAD'})
               .then(res => {
                   resolve(res.headers.get('content-length'));
                   // ^ what're ye doin buddy? res.headers['content-length'] would be perfectly adequate
               });
       });
    }
    static byte_request_supported(url){
        const q = url_lib.parse(url);
        this.protocol.request({
            method: 'HEAD',
            path: q.pathname,
            host: q.hostname,
            port: this.port
        },(res)=>{
            console.log(res.statusCode);
        }).end();
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
        let num_of_parts_to_create = parseInt(Download.download_speed() / Download.throttled_speed(this.url)) - 1;
        if (num_of_parts_to_create <= 0){
            num_of_parts_to_create = 1;
        }
        num_of_parts_to_create = 26;
        let last_int = -1;
        for (let i = 0; i < num_of_parts_to_create; i++) {
            let to_byte = parseInt((this.total_length / num_of_parts_to_create) * (i + 1));
            this.parts.append(new Part(this.url,last_int + 1, to_byte, this));
            last_int = to_byte;
        }
        return this;
    }
    download_all(){
        console.log("Downloading All Parts");
        console.log("Num of parts: " + this.parts.length);
        for (let i = 0; i < self.parts.length; i++) {
            self.parts.download_bytes(i,length,(i,length)=>{
                console.log(i+1 + " of " + length + "complete");
            });
        }
        return this
    }
    combineParts(){
        //TODO: write this
        return this;
    }
    move_to_final(){
        //TODO: write this
    }

}

class Part {
    constructor(url, number, to_byte,parent){
        this.url = url;
        this.from_byte = parseInt(from_byte);
        this.to_byte = parseInt(to_byte);
        this.current_byte = parseInt(from_byte);
        this.stop_byte = parseInt(to_byte);
        this.file = tempfile.NamedTemporaryFile({deleteAfterUse: false});
        this.percent_done = 0;
        this.parent = parent;
        if(url_lib.parse(url).protocol === "http:") {
            this.protocol = http;
            this.port = "80";
        } else {
            this.protocol = https;
            this.port = "443";
        }
    }
    download_bytes(){
        this.protocol.get(this.url,{
            headers: {
                'Range':`bytes=${this.from_byte}-${this.to_byte}`
            }
        },(res) => {
            res.on('data',(res) =>{
                this.file.write(res);
                this.current_byte+= res.length;
                this.percent_done = (this.current_byte - this.from_byte) / (this.to_byte - this.from_byte);
                this.parent.average_in(this.percent_done, this);
            })
        });
    }
}

process.on('exit', () => {
    // cleanup code here. delete all temporary files and directories
});

async function Main(){
   console.log(os.tmpdir());
}
Main();