import time

import requests
import tempfile

url_to_check = ''
path_to_save = ''
parts = []


def length(url):
    response = requests.head(url)
    return response.headers['content-length']


def download_bytes(url, from_byte, to_byte):  # https://stackoverflow.com/a/16696317/7886229
    local_filename = tempfile.NamedTemporaryFile(delete=False)
    if to_byte == '100%':
        to_byte = int(length(url))
    r = requests.get(url, {'Range': 'bytes=%d-%d' % (from_byte, to_byte)}, stream=True)
    length_downloaded = 0
    for chunk in r.iter_content(chunk_size=1024):
        if chunk:  # filter out keep-alive new chunks
            length_downloaded += 1024
            if length_downloaded >= to_byte / 4:
                break
            local_filename.write(chunk)
            # f.flush() commented by recommendation from J.F.Sebastian
    return local_filename.name


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


print(download_bytes('http://speedtest.ftp.otenet.gr/files/test100k.db', 0, '100%'))
