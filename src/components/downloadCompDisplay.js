import React from 'react';
import Progress from "./progress";
import Tool from "./tool";

const {shell} = window.require('electron');

const open = path => shell.showItemInFolder(path);

const format = (property, value, noWrap, onClick) => {
    return <div className={"download-detail"}>
        <b>{property}: </b>
        {noWrap ? <pre onClick={onClick}>{value}</pre> : <span onClick={onClick} className={"monospace"}>{value}</span>}
    </div>;
};

const formatHeaders = obj => JSON.stringify(obj, null, 2);

/**
 *
 * @param status
 * @returns {string}
 * active - currently downloading (should only be one at a time)
 * failed - an error has occurred forcing the download to fail and stop
 * done - the download has successfully completed
 * pending - the download is in the queue and is awaiting other downloading to complete before it will start (purple)
 * awaiting - the download has to be initiated and is not ready to enter the queue
 * stopped - the user has stopped the download and it has been taken out of the queue while it awaits further instruction (either to retry to trash)
 * finishing - the download has completed however more actions are needed (moving to final file, etc.), but the next download in the queue can be started
 */

const statusName = status => ["active", "failed", "done", "pending", "awaiting","stopped","finishing"][status];

const getTools = props => {
    switch (props.status) {
        case 0:
        case 3:
        case 4:
        default:
            return [<Tool key={"option1"} left={true} tooltip={"Cancel Download"} icon={"fas fa-times"}
                          onClick={() => props.functions.cancel()}/>];
        case 1:
            return [<Tool key={"option1"} left={true} tooltip={"Retry Download"} icon={"fas fa-redo"}
                          onClick={() => props.functions.retry()}/>,
                <Tool key={"option2"} left={true} tooltip={"Remove Download From List"} icon={"fas fa-trash"}
                      onClick={() => props.functions.remove()}/>];
        case 2:
            return [<Tool key={"option1"} left={true} tooltip={"Show Download in folder"} icon={"fas fa-folder"}
                          onClick={() => open(props.content.path)}/>,
                <Tool key={"option2"} left={true} tooltip={"Remove Download From List"} icon={"fas fa-trash"}
                      onClick={() => props.functions.remove()}/>];
        case 5:
            return [<Tool key={"option1"} left={true} tooltip={"Retry Download"} icon={"fas fa-redo"}
                          onClick={() => props.functions.retry()}/>,
                <Tool key={"option2"} left={true} tooltip={"Remove Download From List"} icon={"fas fa-trash"}
                      onClick={() => props.functions.remove()}/>];
        case 6:
            return [<Tool key={"option1"} left={true} tooltip={"Cancel Download"} icon={"fas fa-times"}
                                 onClick={() => props.functions.cancel()}/>];
    }
};

export default props => {
    return <div
        className={`download ${statusName(props.status)}`}>
        <div className="header">
            <div className={"flex"}>
                <span className={"progress"}>{Math.floor(props.content.percentage || 0)}%</span>
                <h2>{props.content.path.split('/').pop()}</h2>
            </div>

            <div className="flex">
                {getTools(props)}
            </div>
        </div>
        {window.localStorage.getItem('showAdvancedDetails') === 'true' ? <div className="download-details">
            {format("Source", props.content.url)}
            {format("Final File", props.content.path)}
            {format("Headers", formatHeaders(props.content.headers), props.content.headersExpanded, () => props.functions.toggleHeaders())}
            {format("Error", props.content.error)}
            {format("Size", props.content.size)}
            {format("Elapsed Time", props.content.elapsedTime)}
            {format("Estimated Time Of Completion", props.content.eta)}
            {format("Speed", props.content.speed)}
            {format("Parts Done", props.content.parts)}
            {format("Progress", `${props.content.progress} (${props.content.percentage}%)`)}
        </div> : null}

        {props.status === 0  ?
            <Progress className={props.status === 1 ? "failed" : props.status === 2 ? "done" : ""}
                      value={props.content.percentage}/> : null}
    </div>
}
