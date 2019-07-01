module.exports = {
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
     * awaiting - the download has to be initiated and is not ready to enter the queue
     * pending - the download is in the queue and is awaiting other downloading to complete before it will start (purple)
     * active - currently downloading (should only be one at a time)
     * finishing - the download has completed however more actions are needed (moving to final file, etc.), but the next download in the queue can be started
     * COMPLETE - the download has successfully completed
     * stopped - the user has stopped the download and it has been taken out of the queue while it awaits further instruction (either to retry to trash)
     * failed - an error has occurred forcing the download to fail and stop
     */
    DownloadStatus:{
        ACTIVE: "Active",
        FAILED: "Failed",
        COMPLETE: "Done",
        PENDING: "Pending",
        AWAITING: "Awaiting",
        STOPPED: "Stopped",
        FINISHING: "finishing",
    }
};
