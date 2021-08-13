import React, { Component } from "react";
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import CreateChart from "./CreateChart.js";

async function getJSON(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

class AverageGraph extends Component {
  constructor() {
    super();
    this.state = { query: {day: 'today', show: true}, graphData: null };
    this.handleDayChange = this.handleDayChange.bind(this)
    this.handleShowChange = this.handleShowChange.bind(this)
  }

  componentDidMount() {
    this.getGraph(this.state);
  }

  handleDayChange(event) {
    if (event.target.value) this.getGraph({query: {day: event.target.value, show: this.state.query.show}});
  }

  handleShowChange() {
    this.getGraph({query: {day: this.state.query.day, show: !this.state.query.show}});
  }

  async getGraph(newState) {
    let data = await getJSON(`${process.env.REACT_APP_API_SERVER}/getgraph?day=${newState.query.day}&show=${newState.query.show}&type=average`);
    this.setState({query: {day: newState.query.day, show: newState.query.show}, graphData: data});
  }

  render() {
    return (
      <>
        <Form style={{marginBottom: "16px"}}>
          <Row>
            <Col xs="auto">
              <Form.Label>Day:</Form.Label>
              <Form.Select value={this.state.query.day} onChange={this.handleDayChange}>
                <option></option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Form.Label>Show:</Form.Label>
              <Form.Check type="checkbox" checked={this.state.query.show} onChange={this.handleShowChange} />
            </Col>
          </Row>
        </Form>
        <CreateChart graphData={this.state.graphData} />
      </>
    );
  }
}

export default AverageGraph;
