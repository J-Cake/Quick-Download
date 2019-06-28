import React from 'react';

import '../../../css/standard_prompt.css';
import Tool from '../tool';

export default class StandardMenu extends React.Component {
    constructor(props){
        super(props);
        this._handleCloseClick = this._handleCloseClick.bind(this);
    }

    _handleCloseClick(e){
       this.props.close(e);
    }

    render(){
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
