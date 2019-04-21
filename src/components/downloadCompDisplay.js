import React from 'react';

import Tool from './tool';
import Progress from "./progress";

const {shell} = window.require('electron');

const open = path => shell.showItemInFolder(path);

const format = (property, value) => <div className={"download-detail"}>
	<b>{property}: </b>
	<span className={"monospace"}>{value}</span>
</div>;

export default props => <div
	className={"download" + (props.status === 1 ? " failed" : props.status === 2 ? " done" : (props.status === 3 ? " pending" : (props.status === 4 ? " awaiting" : "")))}>
	<div className="header">
		<div className={"flex"}>
			<span className={"progress"}>{Math.floor(props.content.percentage)}%</span>
			<h2>{(props.content.path || "").split('/').pop()}</h2>
		</div>
		<div className="tools">
			{props.status === 2 ?
				<Tool left={true} tooltip={"Show file in folder"} className="open-in-folder"
					  onClick={() => open(props.content.path)}
					  icon={"fas fa-folder"}/> : null}
			{props.status === 1 ?
				<Tool left={true} tooltip={"Retry failed download"} className="retry"
					  onClick={() => console.log("restarting downloads isn't supported yet")}
					  icon={"fas fa-redo-alt"}/> : null}
			{/*<Tool tooltip={"Expand download details"} className="show-download-details" onClick={() => state.showDetails ^= 1}*/}
			{/*	  icon={!props.content.details ? "fas fa-chevron-left" : "fas fa-chevron-down"}/>*/}
			{props.status === 0 ?
				<Tool left={true} tooltip={"Cancel download"} className="download-cancel-btn"
					  onClick={props.functions.cancel()} icon={"fas fa-times"}/> :
				<Tool left={true} tooltip={"Dismiss download"} className="download-trash-btn" onClick={() => {
					props.functions.remove();
				}} icon={"fas fa-trash"}/>
			}
		</div>
	</div>
	<div className="download-details">
		{format("Source", props.content.url)}
	</div>

	{props.status === 0 ?
		<Progress className={props.status === 1 ? "failed" : props.status === 2 ? "done" : ""}
				  value={props.content.percentage}/> : null}
</div>