# Quick Downloader


## Description

We download things quickly.

https://jbis9051.github.io/quick_download/

## Installation

### macOS

1. Click "Releases" tab (or "Download Binary" on the website)
2. Go to the latest release and click to download `Quick.Downloader.macOS.X.Y.Z.dmg`
3. Open the DMG file
4. Drag the Quick Downloader application icon to the Applications folder icon (shown by an arrow)
5. Eject DMG (optional, but suggested)
6. Open the application by using Launchpad, Spotlight search, or Finder

**Note:** If you receive the following message, try the steps below
![Unknown Developer Error](https://github.com/jbis9051/quick_download/raw/master/_layouts/apple_is_annoying.png)

1. System Preferences (Apple Logo > System Preferences)
2. Click "Security & Privacy"
3. In the "General" tab, click "Open Anyway"
![Fix Unknown Developer Error](https://github.com/jbis9051/quick_download/raw/master/_layouts/fix_apple_is_annoying.png)
(You should only have to do this once)
4. Click "Open" on the prompt

alternatively...

1. Open `/Applicaitons` in Finder
2. Scroll until you find the `Quick Downloader.app` application (possibly without the `.app` extention)
3. Secondary click (right click) on the application and click "Open"
4. Click "Open" on the prompt

**You should only have to do this the first time you open the application**

### Windows

Coming soon...

### Development Installation

To install and run the source code, just clone the repository, install the packages, and run electron.

    git clone https://github.com/jbis9051/quick_download.git
    cd quick_download
    npm install
    npm run electron

## Usage

1. Open the application
2. Go to preferences and adjust the amount of parts. Default is 10. Try different number of parts and try to find a *sweet spot* for your connection and download. It will vary on each download. We currently have no way to calculate the best number of the parts, but we are working on that.
3. Click the "+" button
4. Enter a name, location, and URL and click the checkmark to add the download to the queue.

**Note:** Not all downloads will work with Quick Downloader. The server of the download must support byte requests and send `content-length` headers.

## How it works

Using HTTP Byte Requests, Quick Downloader splits the download up into parts and downloads all parts simultaneously.  This allows you to take advantage of a couple different things:

- CDN's (Different servers can handle different parts)
- Connection isn't throttled by server (usually)

For example, if your are attempting to download a 1000Mb (1Gb) file and your download speed is 50Mbps, however the server throttles the download speed so you only get 10Mbps, a traditional download (the process used by Chrome, Safari, or most downloaders) is going to take 100 seconds (1000Mb/10Mbps = 100s).  Quick Downloader however, will split the file up into to, lets say, 5 parts.  Each part will be throttled download to 10Mbps, but since all 5 are simultaneously, your true download speed will be 50Mbps (10Mbps * 5 parts = 50Mbps).  At this speed, the download will only take 20 seconds (100Mb/50Mbps = 20s), reducing the download by 80%.  

## Proven Results

We conducted thorough<sup>\*</sup> testing and here are some of the results we have gotten<sup>\*\*</sup>:

----

**Test 1**

File Size: ~1.5GB

Standard Download (Safari): ~ 13 Hours (Estimated)
Quick Downloader: 10 min

**Test 2**

File Size: ~7.67GB

Standard Download (Chrome): ~ 12 Hours (Estimated)
Quick Downloader: 4 Hours

----

<sup>\*</sup> Our definition of thorough is very loose... 

<sup>\*\*</sup>We make no guarantees that the above data is 100% accurate and that you will get the same results.

## TODO

Please Check `Projects` tab on GitHub for upcoming features.

## Contributing

Contributions are gladly accepted and encouraged! Please submit pull requests and issues as needed. It is usually best to open an issue first to discuss your idea before you submit a PR. Also, look at the closed issues to make sure your issue has not been reported yet.

## Legal Notices

[**Apache License**](https://github.com/jbis9051/quick_download/blob/master/LICENSE)

### tl;dr

You can do what ever you want with this. Just please give credit to the creators:

- Josh Brown - @jbis9051 - https://joshbrown.info
- Jake Schneider - @J-Cake - https://www.jacob-schneider.ga
