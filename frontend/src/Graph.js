import React, { Component } from "react";

class Graph extends Component {
    constructor() {
        super();
        this.state = {day: 'monday', show: 'false'};
        this.handleDayChange = this.handleDayChange.bind(this)
        this.handleShowChange = this.handleShowChange.bind(this)
    }

    handleDayChange(event) {
        this.setState({day: event.target.value});
    }

    handleShowChange(event) {
        this.setState({show: event.target.value});
    }

    render() {
        return (
            <>
                <div>
                    <label>Day: </label>
                    <select name="day" value={this.state.day} onChange={this.handleDayChange}>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                    </select>
                    <label> Show: </label>
                    <select name="day" value={this.state.show} onChange={this.handleShowChange}>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                
                <div>
                    <img src={`${process.env.REACT_APP_API_SERVER}/getgraph?day=${this.state.day}&show=${this.state.show}`} alt="graph of climbing data"></img>,
                </div>
            </>
        );
    }
}

export default Graph;