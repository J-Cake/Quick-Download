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

const statusName = status => ["active", "failed", "done", "pending", "awaiting"][status];

const getTools = props => {
    switch (props.status) {
        case 0:
        case 3:
        case 4:
        default:
            return [<Tool key={"option1"} left={true} tooltip={"Cancel Download"} icon={"fas fa-times"} onClick={() => props.functions.cancel()}/>];
        case 1:
            return [<Tool key={"option1"} left={true} tooltip={"Retry Download"} icon={"fas fa-redo"} onClick={() => props.functions.retry}/>,
                    <Tool key={"option2"} left={true} tooltip={"Remove Download From List"} icon={"fas fa-ban"} onClick={() => props.functions.remove()}/>];
        case 2:
            return [<Tool key={"option1"} left={true} tooltip={"Show Download in folder"} icon={"fas fa-folder"} onClick={() => open(props.content.path)}/>,
                    <Tool key={"option2"} left={true} tooltip={"Remove Download From List"} icon={"fas fa-ban"} onClick={() => props.functions.remove()}/>];
    }
};

export default props => <div
    className={`download ${statusName(props.status)}`}>
    <div className="header">
        <div className={"flex"}>
            <span className={"progress"}>{Math.floor(props.content.percentage) || 0}%</span>
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
        {format("Size", props.content.size)}
        {format("Error", props.content.error || "None")}
        {format("Elapsed Time", props.content.elapsedTime)}
        {format("Estimated Time Of Completion", props.content.eta)}
        {format("Speed", props.content.speed)}
        {format("Parts Done", props.content.parts)}
        {format("Progress", `${props.content.progress} (${props.content.percentage}%)`)}
    </div> : null}

    {props.status === 0 ?
        <Progress className={props.status === 1 ? "failed" : props.status === 2 ? "done" : ""}
                  value={props.content.percentage}/> : null}
</div>
