import Tool from "../Shared/tool";
import React from 'react';


export default class IconMenu extends React.Component{
    render(){
        return (
            <div className={"menu_buttons_container"}>
                <div className={"menu_buttons_wrapper"}>
                    <Tool tooltip={"New download"} className="icon_button" shortcut="+"
                          onClick={e => this.props.downloadPrompt.current.menu.current.show()}
                          icon={"fas fa-plus"}/>
                    <Tool tooltip={"Settings"} className="icon_button"
                          shortcut="*"
                          onClick={() => this.props.settingsPrompt.current.menu.current.show()}
                          icon={"fas fa-cog"}/>
                    <Tool tooltip={"Show download history"}
                          className="icon_button"
                          onClick={() => this.props.historyPrompt.current.menu.current.show()}
                          icon={"fas fa-history"}/>
                </div>
            </div>
        )
    }
}