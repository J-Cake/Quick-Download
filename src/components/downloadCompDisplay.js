import React from 'react';

import Tool from './tool';
import DownloadComp from './downloadComp';

const {shell} = window.require('electron');

const open = path => shell.showItemInFolder(path);

export default props => <div
	className={"download" + (props.contents.status === 1 ? " failed" : props.contents.status === 2 ? " done" : (props.contents.status === 3 ? " pending" : ""))}>
	<div className="header">
		<div className={"flex"}>
			<h3>{Math.floor(props.contents.progress)}%</h3>t
			<h2>{props.contents.fileName}</h2>
		</div>
		<div className="tools">
			{props.contents.status === 2 ?
				<Tool className="open-in-folder" onClick={() => open()}
					  icon={"fas fa-folder"}/> : null}
		</div>
	</div>
	<div className="download-details">
						<span className="download-detail"><b>Elapsed Time: </b>
							{props.contents.elapsedTime}</span>
		<span className={"download-detail"}><b>Speed: </b>
							<span
								className={"monospace"}>{DownloadComp.calculateSize(props.contents.speed)}/s {props.contents.speed} B/s</span></span>
		<span className="download-detail"><b>Final File Destination: </b>
			{props.contents.path}</span>
		<span className="download-detail"><b>Source: </b>
			{props.contents.url}</span>
		<span className="download-detail"><b>Error: </b>
			{props.contents.error}</span>
		<span className="download-detail"><b>Size: </b>
			{props.contents.friendlySize} ({props.contents.size} bytes)</span>
		<span className="download-detail"><b>Estimated Time of completion: </b>
							<span className={"monospace"}> {new Date(props.contents.eta).toLocaleString()} </span></span>
		<span className="download-detail"><b>Parts downloaded: </b>
			{props.contents.chunks_done} of {props.contents.total_chunks}</span>
		<span className="download-detail"><b>Progress: </b>
							<span className={"monospace"}>{props.contents.progress}%</span></span>
	</div>
</div>