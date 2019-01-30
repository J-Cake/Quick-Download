import time
import shutil
import os
import requests
import tempfile
from multiprocessing.pool import ThreadPool

url_to_check = ''
path_to_save = ''
parts = []


class Download:
    mimetype = {
        "application/octet-stream": "so",
        "application/postscript": "ps",
        "audio/x-aiff": "aiff",
        "audio/basic": "snd",
        "video/x-msvideo": "avi",
        "text/plain": "txt",
        "image/x-ms-bmp": "bmp",
        "application/x-cdf": "cdf",
        "application/x-csh": "csh",
        "text/css": "css",
        "application/msword": "wiz",
        "application/x-dvi": "dvi",
        "message/rfc822": "nws",
        "text/x-setext": "etx",
        "image/gif": "gif",
        "application/x-gtar": "gtar",
        "application/x-hdf": "hdf",
        "text/html": "html",
        "image/jpeg": "jpg",
        "application/x-javascript": "js",
        "application/x-latex": "latex",
        "video/mpeg": "mpg",
        "application/x-troff-man": "man",
        "application/x-troff-me": "me",
        "application/x-mif": "mif",
        "video/quicktime": "qt",
        "video/x-sgi-movie": "movie",
        "audio/mpeg": "mp3",
        "video/mp4": "mp4",
        "application/x-troff-ms": "ms",
        "application/x-netcdf": "nc",
        "application/oda": "oda",
        "image/x-portable-bitmap": "pbm",
        "application/pdf": "pdf",
        "application/x-pkcs12": "pfx",
        "image/x-portable-graymap": "pgm",
        "image/png": "png",
        "image/x-portable-anymap": "pnm",
        "application/vnd.ms-powerpoint": "pwz",
        "image/x-portable-pixmap": "ppm",
        "text/x-python": "py",
        "application/x-python-code": "pyo",
        "audio/x-pn-realaudio": "ra",
        "application/x-pn-realaudio": "ram",
        "image/x-cmu-raster": "ras",
        "application/xml": "xsl",
        "image/x-rgb": "rgb",
        "application/x-troff": "tr",
        "text/richtext": "rtx",
        "text/x-sgml": "sgml",
        "application/x-sh": "sh",
        "application/x-shar": "shar",
        "application/x-wais-source": "src",
        "application/x-shockwave-flash": "swf",
        "application/x-tar": "tar",
        "application/x-tcl": "tcl",
        "application/x-tex": "tex",
        "application/x-texinfo": "texinfo",
        "image/tiff": "tiff",
        "text/tab-separated-values": "tsv",
        "application/x-ustar": "ustar",
        "text/x-vcard": "vcf",
        "audio/x-wav": "wav",
        "image/x-xbitmap": "xbm",
        "application/vnd.ms-excel": "xlsx",
        "text/xml": "xml",
        "image/x-xpixmap": "xpm",
        "image/x-xwindowdump": "xwd",
        "application/zip": "zip"
    }

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
        response = requests.head(url)
        return Download.mimetype[response.headers['Content-Type']]

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
        return int((Download.download_speed()) / 3)

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
        return int((Download.throttled_speed(url) + Download.throttled_speed(url) + Download.throttled_speed(url)) / 3)

    def average_in(self, percent_done_input, from_part):
        if self.average_index == 8:
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
        num_of_parts_to_create = int(self.average_download_speed() / self.average_throttled_speed(self.url)) - 1
        num_of_parts_to_create = 4
        last_int = -1
        for i in range(num_of_parts_to_create):
            to_byte = int((self.total_length / num_of_parts_to_create) * (i + 1))
            if i == 1 or i == 0 or 1 == 1:
                self.parts.append(Part(self.url, last_int + 1, to_byte, self))
            last_int = to_byte
        return self

    def download_all(self):
        print("Downloading All Parts")
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
        shutil.move(self.final_temp_file.name, self.save_location + "/" + self.name + "." + self.extension)

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
    "http://127.0.0.1/test.png",
    "test2", '/Users/joshuabrown3/Desktop')
download.createParts().download_all().combineParts().move_to_final()
