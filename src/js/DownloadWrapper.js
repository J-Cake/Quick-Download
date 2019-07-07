const {shell} = require('electron');
const Download = require('./Download.js');
const EventEmitter = require('events');

const _window = require('electron').remote.getCurrentWindow();

module.exports = class DownloadWrapper extends EventEmitter {
    constructor(url, parts, customHeaders, proxyOptions, file_name, save_location) {
        super();

        this.last_update = {
            time: 0,
            bytes_progress: 0,
        };

        this.file_name = file_name;
        this.save_location = save_location;
        const download = new Download(url, parts, customHeaders, proxyOptions);
        this.download = download;
        this.failed = false;
        this.status = DownloadStatus.AWAITING;
        const downloadEl = document.createElement('div');
        downloadEl.classList.add('download', 'awaiting');

        downloadEl.innerHTML = require('./download-template').bind(this)(file_name, customHeaders, url); // keeping it clean.

        document.querySelector('#queue-downloads').append(downloadEl);
        this.element = downloadEl;
        this.element.querySelector('.retry').addEventListener('click', evt => this.retry());
        this.element.querySelector('.remove').addEventListener('click', evt => {
            this.emit('remove');
            this.element.parentNode.removeChild(this.element);
            _window.setProgressBar(0);
        });
        this.element.querySelector('.show-in-folder').addEventListener('click', evt => this.showInFolder());
        this.element.querySelector('.cancel').addEventListener('click', evt => this.cancel());

        download
            .on('init-complete', data => this.handleDownloadInit(data))
            .on('update', data => this.handleDownloadUpdate(data))
            .on('parts-done', () => this.handleDownloadFinishing())
            .on('complete', () => this.handleDownloadComplete())
            .on('error', error => this.handleDownloadError(error))
            .on('warn', warning => console.warn(warning));
        download.init(file_name, save_location).then(val => this.emit('startNextDownload'));

    }


    retry() {
        _window.setProgressBar(0);
        this.download.cancel();
        this.download.init(this.file_name, this.save_location).then(val => this.emit('startNextDownload'));
    }

    showInFolder() {
        shell.showItemInFolder(this.download.final_file);
    }

    cancel() {
        _window.setProgressBar(1, {mode: "paused"});
        if (this.elapsed_time_interval) {
            clearInterval(this.elapsed_time_interval);
        }
        this.updateStatus(DownloadStatus.STOPPED);
        this.download.cancel();
    }

    start() {
        _window.setProgressBar(0);
        this.updateStatus(DownloadStatus.ACTIVE);
        this.download.download();
    }


    updateStatus(status_type) {
        this.status = status_type;
        this.element.className = "download " + status_type.toLowerCase();
        this.element.querySelector('.download-detail[data-type=status] .value').innerText = status_type;
    }

    static getActiveDownloads(downloadsArray) {
        return downloadsArray.filter(d => d.status === DownloadStatus.ACTIVE);
    }

    static getReadyDownloads(downloadsArray) {
        return downloadsArray.filter(d => d.status === DownloadStatus.PENDING);
    }

    static bytesToHumanReadable(format, bytes) {
        let output = bytes;
        let steps = 0;

        let units = [];

        if (format === "bin") {
            units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];

            while (output > 1024) {
                output /= 1024;
                steps++;
            }
        } else if (format === "dec") {
            units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];

            while (output > 1000) {
                output /= 1000;
                steps++;
            }
        }
        return parseFloat(output).toFixed(2) + " " + units[steps];
    }

    static milliToHumanReadable(milliseconds) {
        const date = new Date(milliseconds);
        return `${date.getUTCHours() || 0}h:${date.getUTCMinutes() || 0}m:${date.getUTCSeconds() || 0}s`;
    }

    handleDownloadInit(data) {
        this.last_update.time = Date.now();
        this.start_time = Date.now();
        this.elapsed_time_interval = setInterval(() => {
            this.element.querySelector('.download-detail[data-type=elapsed-time] .value').innerText = DownloadWrapper.milliToHumanReadable((Date.now() - this.start_time)).trim();
        }, 1000);
        if (this.failed) {
            return;
        }
        this.BRR = data.bytes_request_supported;

        this.updateStatus(DownloadStatus.PENDING);
        this.element.querySelector('.download-detail[data-type=final-file] .value').innerText = data.final_file;
        this.element.querySelector('.download-detail[data-type=size] .value').innerText =
            DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, data.size).trim();
    }

    handleDownloadUpdate(update) {
        if (this.failed) {
            return;
        }
        if (Date.now() - this.last_update.time > 800) {
            const speed = (update.downloaded_bytes - this.last_update.bytes_progress) / (Date.now() - this.last_update.time); // bytes per millisecond
            const time_left = ((this.download.total_length - update.downloaded_bytes) / speed); // milliseconds
            const eta = Date.now() + time_left; // milliseconds
            const percentProgress = Math.floor((update.downloaded_bytes / this.download.total_length) * 10000) / 100;

            _window.setProgressBar(percentProgress / 100);

            this.element.querySelector('.progress-bar-inner').style.width = percentProgress + "%";
            this.element.querySelector('.progress').innerText = percentProgress + "%";
            this.element.querySelector('.download-detail[data-type=speed] .value').innerText = DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, Math.floor(speed * 1000)) + " / s"; //convert to per second
            this.element.querySelector('.download-detail[data-type=eta] .value').innerText = `${new Date(eta).toLocaleString()}(${DownloadWrapper.milliToHumanReadable(time_left)})`;
            this.element.querySelector('.download-detail[data-type=progress] .value').innerText = `${DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, update.downloaded_bytes)} / ${DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, this.download.total_length)}`;
            this.element.querySelector('.download-detail[data-type=parts-done] .value').innerText = `${update.parts_done} / ${this.download.numParts}`;
            this.last_update.time = Date.now();
            this.last_update.bytes_progress = update.downloaded_bytes;
        }
    }

    handleDownloadError(error) {
        clearInterval(this.elapsed_time_interval);

        _window.setProgressBar(1, {mode: "error"});

        this.updateStatus(DownloadStatus.FAILED);
        this.failed = true;
        this.element.querySelector('.download-detail[data-type=error] .value').innerText = error.toString();
        this.download.cancel();
        this.emit('notify', 'Download Failed', `${this.file_name} has failed!`);
    }

    handleDownloadFinishing() {
        _window.setProgressBar(2, {mode: "normal"});
        if (this.failed) {
            this.emit('startNextDownload');
            return;
        }
        this.updateStatus(DownloadStatus.FINISHING);
        this.emit('startNextDownload');
    }

    handleDownloadComplete() {
        _window.setProgressBar(-1, {mode: "normal"});
        if (this.failed) {
            return;
        }
        clearInterval(this.elapsed_time_interval);
        this.updateStatus(DownloadStatus.COMPLETE);
        this.emit('notify', 'Download Complete', `${this.file_name} is complete!`);
        this.element.querySelector('.progress').innerText = "100%";
        this.element.querySelector('.download-detail[data-type=eta] .value').innerText = `${new Date().toLocaleString()}`;
        this.element.querySelector('.download-detail[data-type=progress] .value').innerText =
            `${DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, this.download.total_length)}/ ${DownloadWrapper.bytesToHumanReadable(settings.items.preferredUnit, this.download.total_length)}`;
        this.element.querySelector('.download-detail[data-type=parts-done] .value').innerText = `${this.download.numParts} / ${this.download.numParts}`;

        document.querySelector('#complete-downloads').append(this.element);
    }
};
