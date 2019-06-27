import Tool from "../Shared/tool";
import React from 'react';
import Enum from '../../enum.js';
const {Menus} = Enum;

export default class IconMenu extends React.Component{
    render(){
        return (
            <div className={"menu_buttons_container"}>
                <div className={"menu_buttons_wrapper"}>
                    <Tool tooltip={"New download"} className="icon_button" shortcut="+"
                          onClick={e => this.props.select(Menus.NEW_DOWNLOAD)}
                          icon={"fas fa-plus"}/>
                    <Tool tooltip={"Settings"} className="icon_button"
                          shortcut="*"
                          onClick={e => this.props.select(Menus.SETTINGS)}
                          icon={"fas fa-cog"}/>
                    <Tool tooltip={"Show download history"}
                          className="icon_button"
                          onClick={e => this.props.select(Menus.HISTORY)}
                          icon={"fas fa-history"}/>
                </div>
            </div>
        )
    }
}
