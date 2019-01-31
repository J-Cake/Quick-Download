import time
import shutil
import os
import requests
import tempfile
import urllib.parse

from multiprocessing.pool import ThreadPool

url_to_check = ''
path_to_save = ''
parts = []


class Download:
    def __init__(self, url, name, save_location):
        self.save_location = save_location
        self.final_temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.url = url
        self.total_length = Download.get_length(url)
        self.extension = Download.get_extention(url)
        self.name = name
        self.average_percentage = 0
        self.average_index = 0
        self.last_print = 0
        self.parts = []

    @staticmethod
    def get_extention(url):
        return os.path.splitext(urllib.parse.urlparse(url).path)[1]

    @staticmethod
    def get_length(url):
        response = requests.head(url)
        return int(response.headers['Content-Length'])

    @staticmethod
    def byte_requests_supported(url):
        response = requests.head(url)
        return response.status_code == 206

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

    @staticmethod
    def average_download_speed():
        return int((Download.download_speed()))

    @staticmethod
    def throttled_speed(url):
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

    @staticmethod
    def average_throttled_speed(url):
        return int(Download.throttled_speed(url))

    def average_in(self, percent_done_input, from_part):
        if self.average_index == 4:
            self.average_percentage = 0
            self.average_index = 0
        self.average_percentage = ((self.average_percentage * self.average_index)
                                   + percent_done_input) \
                                  / (self.average_index + 1)
        self.average_index += 1
        if self.average_percentage - self.last_print > 0.01:
            print(self.average_percentage)
            self.last_print = self.average_percentage

    def createParts(self):
        # num_of_parts_to_create = int(self.average_download_speed() / self.average_throttled_speed(self.url)) - 1
        # if num_of_parts_to_create <= 0:
        #   num_of_parts_to_create = 1
        num_of_parts_to_create = 26
        last_int = -1
        for i in range(num_of_parts_to_create):
            to_byte = int((self.total_length / num_of_parts_to_create) * (i + 1))
            if i == 1 or i == 0 or 1 == 1:
                self.parts.append(Part(self.url, last_int + 1, to_byte, self))
            last_int = to_byte
        return self

    def download_all(self):
        print("Downloading All Parts")
        print("Num of parts: %d" % len(self.parts))
        results = ThreadPool(len(self.parts)).imap_unordered(Download.call_downloader, self.parts)
        i = 0
        for path in results:
            i += 1
            print("%d of %d complete" % (i, len(self.parts)))
        print("done")
        return self

    def combineParts(self):
        with open(self.final_temp_file.name, "wb") as destination:
            for part in self.parts:
                shutil.copyfileobj(open(part.file.name, 'rb'),
                                   destination)  # https://stackoverflow.com/a/1001587/7886229
            destination.close()
            return self

    def move_to_final(self):
        shutil.move(self.final_temp_file.name, self.save_location + "/" + self.name + self.extension)

    @staticmethod
    def call_downloader(part):
        part.download_bytes()


class Part:

    def __init__(self, url, from_byte, to_byte, parent):
        self.url = url
        self.from_byte = int(from_byte)
        self.to_byte = int(to_byte)
        self.current_byte = int(from_byte)
        self.stop_byte = int(to_byte)
        self.file = tempfile.NamedTemporaryFile(delete=False)
        self.percent_done = 0
        self.parent = parent

    def download_bytes(self):  # https://stackoverflow.com/a/16696317/7886229
        r = requests.get(self.url, headers={'Range': 'bytes=%d-%d' % (self.from_byte, self.to_byte)}, stream=True)
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:  # filter out keep-alive new chunks
                self.file.write(chunk)
                self.file.flush()  # credit to  https://chat.stackoverflow.com/users/5067311/andras-deak
                self.current_byte += len(chunk)
                self.percent_done = (self.current_byte - self.from_byte) / (self.to_byte - self.from_byte)
                self.parent.average_in(self.percent_done, self)
            # f.flush() commented by recommendation from J.F.Sebastian


download = Download(
    "https://download-cf.jetbrains.com/idea/ideaIC-2018.3.4.dmg",
    "Intelij", '/Users/joshuabrown3/Desktop/vid')
download.createParts().download_all().combineParts().move_to_final()
