
const fetch = require('node-fetch');
const AbortController  = require('abort-controller');
class Download{
    async constructor(url, name, save_location){
        this.save_location = save_location;
        this.final_temp_file = tempfile.NamedTemporaryFile(false);
        this.url = url;
        this.total_length = await Download.get_length(url);
        this.extension = Download.get_extension(url);
        this.name = name;
        this.average_percentage = 0;
        this.average_index = 0;
        this.last_print = 0;
        this.parts = [];
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
               });
       });
    }

    static byte_request_supported(url){
        request.head(url,function (error,response,body) {
            return response.statusCode === 206;
        })
    }
    static download_speed(){
        const url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db";
        const start = (new Date()).getMilliseconds();
        let dl = 0;
        let time_difference = 0;
        const controller = new AbortController();
      /*  const timeout = setTimeout(
            () => { controller.abort(); },
            10000,
        );
        */
        fetch(url,{ signal:controller.signal })
            .then(body => console.log(body))
            .then(res => {
                //dl += res.length;
                time_difference = (new Date()).getMilliseconds();
                console.log(res);
            });
        return Math.round(dl / time_difference)
    }

}
async function Main(){
    let length = await Download.get_length("http://speedtest.ftp.otenet.gr/files/test1Gb.db");

}
Main();