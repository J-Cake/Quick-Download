const os = require('os');

const _window = require("electron").remote.getCurrentWindow();
const DownloadWrapper = require('./DownloadWrapper');

class Win {
    static init() {
        const platform = os.platform();

        _window.setProgressBar(-1);

        _window.on("close", function (e) {
            e.preventDefault();
        });

        if (platform === "win32" || platform === "win64") {
            document.head.innerHTML += `<link rel="stylesheet" href="./css/windows.css"/>`;

            document.querySelector("#window-titlebar").innerHTML += `
            <div class="window-buttons">
                <div class="window-btn" id="minimise"></div>
                <div class="window-btn" id="maximise"></div>
                <div class="window-btn" id="restore"></div>
                <div class="window-btn" id="close"></div>
            </div>`;

            Win.setBtns();

            document.querySelector("#minimise").addEventListener("click", () => _window.minimize());
            document.querySelector("#maximise").addEventListener("click", () => _window.maximize());
            document.querySelector("#restore").addEventListener("click", () => _window.restore());
            document.querySelector("#close").addEventListener("click", () => Win.close());

            document.querySelector("#close").addEventListener("click", function () {
                Win.close();
            });

            window.addEventListener("resize", () => Win.setBtns());
        } else {
            document.querySelector(".window-buttons").outerHTML = "";
        }
    }

    static getPlatform() {
        return os.platform();
    }

    static close() {
        if (DownloadWrapper.getActiveDownloads(downloads).length > 0) {
            if (dialog.showMessageBox(
                _window, {
                    type: 'question', buttons: ['Ok', 'Cancel'], title: 'Exit?',
                    message: 'Are you sure you want to quit? Any active downloads will be cancelled.'
                }) === 0)
                window.close();
        } else
            window.close();
    }

    static setBtns() {
        if (_window.isMaximized()) {
            document.querySelector("#restore").style.display = "block";
            document.querySelector("#maximise").style.display = "none";
        } else {
            document.querySelector("#restore").style.display = "none";
            document.querySelector("#maximise").style.display = "block";
        }
    }
}

module.exports = Win;