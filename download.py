import time

import requests
import tempfile
from multiprocessing.pool import ThreadPool

url_to_check = ''
path_to_save = ''
parts = []


class Download:
    def __init__(self, url, name):
        print("Download Starting Creation")
        self.url = url
        self.total_length = Download.get_length(url)
        self.name = name
        self.average_percentage = 0
        self.average_index = 0
        self.throttled_speed = Download.throttled_speed(url)
        self.last_print = 0
        self.parts = []
        print("Download Finished Creation")

    @staticmethod
    def get_length(url):
        response = requests.head(url)
        return int(response.headers['content-length'])

    @staticmethod
    def byte_requests_supported(url):
        response = requests.head(url)
        return response.status_code == 206

    @staticmethod
    def download_speed():  # https://codereview.stackexchange.com/a/139336/180601
        url = "http://speedtest.ftp.otenet.gr/files/test100k.db"
        start = time.time()
        file = requests.get(url)
        end = time.time()

        time_difference = end - start
        file_size = int(file.headers['Content-Length'])
        print(file_size / time_difference)
        return round(file_size / time_difference)

    @staticmethod
    def throttled_speed(url):
        start = time.time()
        file = requests.get(url, headers={'Range': 'bytes=0-1024000'})
        end = time.time()
        time_difference = end - start
        file_size = int(file.headers['Content-Length'])
        print(file_size / time_difference)
        return round(file_size / time_difference)

    def average_in(self, percent_done_input, from_part):
        self.average_percentage = ((self.average_percentage * self.average_index)
                                   + percent_done_input) \
                                  / self.average_index + 1
        self.average_index += 1
        if self.average_percentage - self.last_print > 0.01:
            print("%d%%" % round(self.average_percentage * 100))
            self.last_print = self.average_percentage

    def createParts(self):
        print("Download Creating Parts")
        num_of_parts_to_create = int(self.download_speed() / self.throttled_speed) - 1
        num_of_parts_to_create = 32
        print(num_of_parts_to_create)
        last_int = 0
        for i in range(num_of_parts_to_create):
            to_byte = int((self.total_length/num_of_parts_to_create) * (i + 1))
            self.parts.append(Part(self.url, last_int + 1, to_byte))
            last_int = to_byte
            print(i)
        print("Download Done Creating Parts")
        return self

    def download_all(self):
        print("Downloading All Parts")
        results = ThreadPool(len(self.parts)).imap_unordered(Download.call_downloader, self.parts)
        for path in results:
            print(path)
        print("done")


    @staticmethod
    def call_downloader(part):
        part.download_bytes()


class Part(Download):

    def __init__(self, url, from_byte, to_byte):
        self.url = url
        self.from_byte = int(from_byte)
        self.to_byte = int(to_byte)
        self.current_byte = int(from_byte)
        self.stop_byte = int(to_byte)
        self.file = tempfile.NamedTemporaryFile(delete=False)
        self.percent_done = 0

    def download_bytes(self):  # https://stackoverflow.com/a/16696317/7886229
        r = requests.get(self.url, headers={'Range': 'bytes=%d-%d' % (self.from_byte, self.to_byte)}, stream=True)
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
               # super().average_in(self.percent_done, self)
                # f.flush() commented by recommendation from J.F.Sebastian


download = Download(
    "")
download.createParts().download_all()
