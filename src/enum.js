export default  {
    Menus: {
        NEW_DOWNLOAD: 0,
        SETTINGS: 1,
        HISTORY: 2,
        ABOUT: 3,
        CONTACT: 6,
        OTHER: 4,
        NONE: 5,
    },
    Tabs: {
        QUEUE: 0,
        COMPLETED: 1,
    },

    /**
     * active - currently downloading (should only be one at a time)
     * failed - an error has occurred forcing the download to fail and stop
     * done - the download has successfully completed
     * pending - the download is in the queue and is awaiting other downloading to complete before it will start (purple)
     * awaiting - the download has to be initiated and is not ready to enter the queue
     * stopped - the user has stopped the download and it has been taken out of the queue while it awaits further instruction (either to retry to trash)
     * finishing - the download has completed however more actions are needed (moving to final file, etc.), but the next download in the queue can be started
     */
    DownloadStatus:{
        ACTIVE: "Active",
        FAILED: "Failed",
        DONE: "Done",
        PENDING: "Pending",
        AWAITING: "Awaiting",
        STOPPED: "Stopped",
        FINISHING: "finishing",
    }
}
