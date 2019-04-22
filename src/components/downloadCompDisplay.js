import React from 'react';

import Tool from './tool';
import Progress from "./progress";

const {shell} = window.require('electron');

const open = path => shell.showItemInFolder(path);

const format = (property, value, noWrap, onClick) => <div className={"download-detail"}>
    <b>{property}: </b>
    {noWrap ? <pre onClick={onClick}>{value}</pre> : <span onClick={onClick} className={"monospace"}>{value}</span>}
</div>;

const formatHeaders = obj => JSON.stringify(obj, null, 2);

export default props => <div
    className={"download" + (props.status === 1 ? " failed" : props.status === 2 ? " done" : (props.status === 3 ? " pending" : ""))}>
    <div className="header">
        <div className={"flex"}>
            <span className={"progress"}>{Math.floor(props.content.percentage)}%</span>
            <h2>{props.content.path}</h2>
        </div>
        <div className="tools">
            {props.status === 2 ?
                <Tool className="open-in-folder" onClick={() => open(props.content.path)}
                      icon={"fas fa-folder"}/> : null}
        </div>
    </div>
    <div className="download-details">
        {format("Source", props.content.url)}
        {format("Final File", props.content.path)}
        {format("Headers", formatHeaders(props.content.headers), props.content.headersExpanded, () => props.functions.toggleHeaders())}
        {format("Size", props.content.size)}
        {format("Elapsed Time", props.content.elapsedTime)}
        {format("Estimated Time Of Completion", props.content.eta)}
        {format("Speed", props.content.speed)}
        {format("Parts Done", props.content.parts)}
        {format("Progress", `${props.content.progress} (${props.content.percentage}%)`)}
    </div>

	{props.status === 0 ?
		<Progress className={props.status === 1 ? "failed" : props.status === 2 ? "done" : ""}
				  value={props.content.percentage}/> : null}
</div>
