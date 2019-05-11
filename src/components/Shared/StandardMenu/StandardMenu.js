import React from 'react';

import './standard_prompt.css';
import Tool from '../tool';

const EventEmitter = require('events');

export default class StandardMenu extends React.Component {
    constructor(props){
        super(props);

        this._handleCloseClick = this._handleCloseClick.bind(this);

        this.emiter = new EventEmitter();

        this.state = {
            display: false
        }
    }

    _handleCloseClick(e){
        this.hide();
    }

    show(){
        this.emiter.emit("show");
        this.setState({
            display: true
        });
    }
    hide(){
        this.emiter.emit("close");
        this.setState({
            display: false
        });
    }

    render(){
        if(!this.state.display){
            return null;
        }
        return (
            <div className={"prompt_wrapper"}>
                <div className={"prompt_content_container"}>
                    <div className={"prompt_content_wrapper"}>
                        <header className={"prompt_header"}>
                            <h1>{this.props.title}</h1>
                            {this.props.header}
                            <div className={"prompt_close_button"}>
                                <Tool left={true} tooltip={"Close the prompt"} icon={"fas fa-times"}
                                      onClick={this._handleCloseClick}
                                />

                            </div>
                        </header>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}