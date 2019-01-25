import requests
import tempfile

url_to_check = ''
path_to_save = ''
parts = []


def download_bytes(url, from_byte, to_byte):  # https://stackoverflow.com/a/16696317/7886229
    local_filename = tempfile.NamedTemporaryFile(delete=False)
    r = requests.get(url, {'Range': 'bytes=%d-%d' % (from_byte, to_byte)}, stream=True)
    for chunk in r.iter_content(chunk_size=1024):
        if chunk:  # filter out keep-alive new chunks
            local_filename.write(chunk)
            # f.flush() commented by recommendation from J.F.Sebastian
    return local_filename.name


def byte_requests_supported(url):
    response = requests.head(url)
    return response.status_code == 206
