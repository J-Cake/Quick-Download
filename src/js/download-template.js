module.exports = function (file_name, customHeaders, url) {
    return `<div class="header">
        <div class="titlebar">
            <h2 class="name">${file_name} (${this.file_name})</h2>
            <span class="progress">0%</span>
        </div>
        <div class="download-actions">
            <button class="tool retry"><i class="fas fa-redo"></i><span class="tool-tip left">Retry Download</span></button>
            <button class="tool remove"><i class="fas fa-trash"></i><span class="tool-tip left">Remove Download From List</span></button>
            <button class="tool show-in-folder"><i class="fas fa-folder"></i><span class="tool-tip left">Show Download in folder</span></button>
            <button class="tool cancel"><i class="fas fa-times"></i><span class="tool-tip left">Cancel Download</span></button>
        </div>
    </div>
    <div class="download-details" data-enabled>
        <div class="download-detail" data-type="status"><b class="name">Status: </b><span class="value">Awaiting</span></div>
        <div class="download-detail" data-type="source"><b class="name">Source: </b><span class="value">${url}</span></div>
        <div class="download-detail" data-type="final-file"><b class="name">Final File: </b><span class="value"></span></div>
        <div class="download-detail" data-type="headers"><b class="name">Headers: </b><span class="value">${JSON.stringify(customHeaders).trim()}</span></div>
        <div class="download-detail" data-type="error"><b class="name">Error: </b><span class="value">None</span></div>
        <div class="download-detail" data-type="size"><b class="name">Size: </b><span class="value">0.00 B</span></div>
        <div class="download-detail" data-type="elapsed-time"><b class="name">Elapsed Time: </b><span class="value">0</span></div>
        <div class="download-detail" data-type="eta"><b class="name">Estimated Time Of Completion: </b><span class="value">Loading...</span></div>
        <div class="download-detail" data-type="speed"><b class="name">Speed: </b><span class="value">0.00 B/s</span></div>
        <div class="download-detail" data-type="parts-done"><b class="name">Parts Done: </b><span class="value">0 / 0</span></div>
        <div class="download-detail" data-type="progress"><b class="name">Progress: </b><span class="value">0.00 B / 0.00 B (0%)</span></div>
    </div>
    <div class="progress-bar">
        <div class="progress-bar-wrapper">
            <div class="progress-bar-inner" style="width: 0"></div>
            <div class="progress-bar-dividers">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>`;
};