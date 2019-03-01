# quick_download


## Description

We download things quickly.

## Installation

`TODO Explain how to install`

## Usage

1. Open the application
2. Go to preferences and adjust the amount of parts. Default is 15. Try different number of parts and try to find a sweet spot for your connection.  We currently have no way to calculate the best number of the parts, but we are working on that.
3. Click the "+" button
4. Enter a name, location, and URL and click "Done"

**Note:** The server of the download must support byte requests.

## How it works

Using HTTP Byte Requests, Quick Downloader splits the download up into parts and downloads all parts simultaneously.  This allows you to take advantage of a couple different things:

- CDN's (Different servers can handle different parts)
- Connection isn't throttled by server (usually)

## TODO

- [ ] Figure why it still works really well when there is no throttling and no CDN (We have no clue)
- [ ] Auto calculate most efficient number of parts
- [ ] Make better code

## Contributing

Contributions are gladly accepted and encouraged! Please submit pull requests and issues as needed.  Make sure your issue has not been reported yet. 

## Legal Notices

[**Apache License**](https://github.com/jbis9051/quick_download/blob/master/LICENSE)


###tl;dr 

You can do what ever you want with this. Just please give credit to the creators:

- Josh Brown - @jbis9051 - https://joshbrown.info
- Jake Schneider - https://www.jacob-schneider.ga
