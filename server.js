const http = require('http');
const path = require('path');
const fs = require('fs');

const compile = md => require('./mdCompiler.js')().render(md);

const template = fs.readFileSync(path.join(__dirname + "/", "template.html")).toString();

http.createServer(async (req, res) => {
    console.log(req.url);
    if (req.method === "GET") {
        if (req.url === "/") {
            res.writeHead(200, { "Content-type": "text/html" });
            res.write(await format(fs.readFileSync(path.join(__dirname, "public", "index.html")).toString(), "text/html"));
            res.end();
        } else {
            fs.readFile(path.join(__dirname, "public", decodeURI(req.url)), async (e, data) => {
                if (e) {
                    res.writeHead(404);
                    res.write(await format(fs.readFileSync('./404.html').toString(), 'text/html'));
                } else {
                    const type = getContentType(decodeURI(req.url).split('/').pop().split('.').pop());

                    res.writeHead(200, { 'Content-type': type });
                    if (type !== "image/png" && type !== "image/jpeg")
                        res.write(await format(data, type));
                    else
                        res.write(data);
                }
                
                res.end();
            });
        }
    }

}).listen(1080, () => {
    console.log("Listening")
});

function getContentType(extension) {
    switch (extension.toLowerCase()) {
        case 'html':
            return 'text/html';
        case 'json':
            return 'application/json';
        case 'css': 
            return 'text/css';
        case 'js': 
            return 'text/javascript';
        case 'woff':
            return 'application/font-woff';
        case 'woff2':
            return 'application/font-woff2';
        case 'ttf':
            return 'font/ttf';
        case 'png':
            return 'image/png';
        case 'jpg':
            return 'image/jpeg';
        case 'svg':
            return 'image/svg+xml';
        default:
            return 'text/plain';
    }
}

function format(string, type) {

    string = string.toString();

    if (type === "text/html") {
        return new Promise(function (resolve) {
            let output = template
                .replace("#content", string)
                .replace(/#(.[^\s]+)/g, match => /#markdown\(.[^<>:"/\\|?*]*\)/.test(match) ? match : fs.readFileSync(path.join('snippets', match.slice(1) + ".html")).toString())
                .replace(/#markdown\(.[^<>:"/\\|?*]*\)/g, match => compile(fs.readFileSync(path.join('public', match.match(/\((.+)\)/)[1])).toString()));

            resolve(output);
        });

    } else return string;
}