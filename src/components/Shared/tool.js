import React from 'react';

export default class Tool extends React.Component {
    state = {
        menuVisible: false
    };

    render() {
        if (this.props.menu) {
            const active = this.props.getActive && this.props.getActive();
            return <button ref={"button"}
                           className={"tool menu-container" + (this.props.className ? ` ${this.props.className}` : "")}>
                <i className={this.props.icon}/>
                {this.props.tooltip && !this.props.noToolTip ? <span
                    className={`tool-tip ${this.props.left ? "left" : "bottom"}`}>{this.props.tooltip}</span> : ""}

                <div className={"tool-menu"}>
                    <div className={"nav_bar_dropdown"}>
                        {Object.keys(this.props.menu)
                            .filter(i => typeof this.props.menu[i] === "function")
                            .map((i, a) => <div className={"menu-item"} key={"menu-item" + a}
                                                onClick={() => void this.props.menu[i]() || setTimeout(() => this.refs.button.blur(), 50)}>{active[i] &&
                            <i className="fas fa-check"/>}<span className={"content"}>{i}</span></div>)}
                    </div>
                </div>
            </button>;
        } else
            return <button className={"tool" + (this.props.className ? ` ${this.props.className}` : "")}
                           onClick={this.props.onClick}>
                <i className={this.props.icon}/>
                {this.props.tooltip && !this.props.noToolTip ? <span
                    className={`tool-tip ${this.props.left ? "left" : "buttom"}`}>{this.props.tooltip}</span> : ""}
            </button>;
    }
}