const fetch = require('node-fetch');

class tmp {
	static async downloadSpeed() {
		const url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db";
		const start = Date.now();

		let dl = 0;

		// let file =

	}
}

/*
	@staticmethod
    def download_speed():  # https://codereview.stackexchange.com/a/139336/180601
        url = "http://speedtest.ftp.otenet.gr/files/test1Gb.db"
        start = time.time()
        dl = 0
        file = requests.get(url, stream=True)
        time_difference = 0
        for chunk in file.iter_content(1024):
            dl += len(chunk)
            time_difference = time.time() - start
            if time_difference > 10:
                break
        return round(dl / time_difference)
 */