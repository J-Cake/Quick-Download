import time

import requests
import tempfile
from multiprocessing.pool import ThreadPool

url_to_check = ''
path_to_save = ''
parts = []


class Part:
    average = 0
    amount = 0
    last_print = 0

    def __init__(self, url, from_byte, to_byte, name):
        self.url = url
        self.from_byte = int(from_byte)
        self.to_byte = int(to_byte)
        self.length = int(get_length(url))
        self.current_byte = int(from_byte)
        self.stop_byte = int(to_byte)
        self.file = tempfile.NamedTemporaryFile(delete=False)
        self.percent_done = 0
        self.name = name

    def download_bytes(self):  # https://stackoverflow.com/a/16696317/7886229
        r = requests.get(self.url, {'Range': 'bytes=%d-%d' % (self.from_byte, self.to_byte)}, stream=True)
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:  # filter out keep-alive new chunks
                chunk_len = len(chunk)
                if self.current_byte + chunk_len == self.to_byte:
                    self.file.write(chunk)
                    break
                if self.current_byte + chunk_len > self.to_byte:
                    self.file.write(chunk[:int(self.to_byte - self.current_byte)])
                    break
                self.file.write(chunk)
                self.current_byte += len(chunk)
                self.percent_done = (self.current_byte - self.from_byte) / (self.to_byte - self.from_byte)
                Part.amount += 1
                Part.average = ((Part.average * Part.amount) + self.percent_done) / Part.amount
                if Part.average - Part.last_print > 0.01:
                    Part.last_print = Part.average
                    print("Average : %s%%" % (round((self.average*100))))
                # f.flush() commented by recommendation from J.F.Sebastian


def get_length(url):
    response = requests.head(url)
    return int(response.headers['content-length'])


def byte_requests_supported(url):
    response = requests.head(url)
    return response.status_code == 206


def downspeed():  # https://codereview.stackexchange.com/a/139336/180601
    url = "http://speedtest.ftp.otenet.gr/files/test100k.db"

    start = time.time()
    file = requests.get(url)
    end = time.time()

    time_difference = end - start
    file_size = int(file.headers['Content-Length']) / 1000
    return round(file_size / time_difference)


total_length = get_length("http://speedtest.ftp.otenet.gr/files/test100Mb.db")

test1 = Part("http://speedtest.ftp.otenet.gr/files/test100Mb.db", 0,
             total_length / 4, "Part 1")
test2 = Part("http://speedtest.ftp.otenet.gr/files/test100Mb.db", (total_length / 4) + 1,
             (total_length / 4) * 2, "Part 2")
test3 = Part("http://speedtest.ftp.otenet.gr/files/test100Mb.db", (total_length / 4) * 2 + 1,
             (total_length / 4) * 3, "Part 3")
test4 = Part("http://speedtest.ftp.otenet.gr/files/test1Gb.db", (total_length / 4) * 3 + 1,
             total_length, "Part 4")
test5 = Part("http://speedtest.ftp.otenet.gr/files/test100Mb.db", 0,
             total_length, "Part 5")


def call_downloader(part):
    part.download_bytes()


parts_test = [
    test1,
    test2,
    test3,
    test4
]

results = ThreadPool(8).imap_unordered(call_downloader, parts_test)
for path in results:
    print(path)
