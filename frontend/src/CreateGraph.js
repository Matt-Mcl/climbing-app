import React, { Component } from "react";
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Button from 'react-bootstrap/Button'
import CreateChart from "./CreateChart.js";

async function getJSON(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

function formatDate(input) {
  let date = new Date(input);
  let locale = date.toLocaleString('en-GB', { hour12: false, timeZone: 'Europe/London' });
  
  return locale.substring(0, 10);
}

function getDay(offset) {
  let d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().substring(0, 10);
}

class CreateGraph extends Component {
  constructor() {
    super();
    this.state = { dates: {startDate: getDay(6), endDate: getDay(0)}, graphData: null, error: '' };
    this.handleStartDateChange = this.handleStartDateChange.bind(this);
    this.handleEndDateChange = this.handleEndDateChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async componentDidMount() {
    this.getGraph(this.state);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.getGraph({dates: {startDate: event.target[0].value, endDate: event.target[1].value}});
  }

  handleStartDateChange(event) {
    this.setState({dates: {startDate: event.target.value, endDate: this.state.dates.endDate}});
  }

  handleEndDateChange(event) {
    this.setState({dates: {startDate: this.state.dates.startDate, endDate: event.target.value}});
  }

  async getGraph(newState) {
    let data = await getJSON(`${process.env.REACT_APP_API_SERVER}/getgraph?startdate=${formatDate(newState.dates.startDate)}&enddate=${formatDate(newState.dates.endDate)}&type=range`);
    if (data.error) {
      this.setState({ error: data.error });
    } else {
      this.setState({ dates: { startDate: newState.dates.startDate, endDate: newState.dates.endDate }, graphData: data, error: '' });
    }
  }

  render() {
    return (
      <>
        <Form style={{marginBottom: "16px"}} onSubmit={this.handleSubmit}>
          <Row className="align-items-end">
            <Col xs="auto">
              <Form.Label>Start Date:</Form.Label>
              <Form.Control type="date" value={this.state.dates.startDate} onChange={this.handleStartDateChange}/>
              </Col>
            <Col xs="auto">
              <Form.Label>End Date:</Form.Label>
              <Form.Control type="date" value={this.state.dates.endDate} onChange={this.handleEndDateChange}/>
            </Col>
            <Col xs="auto">
              <Button type="submit">Submit</Button>
            </Col>
            <Col xs="auto">
              {this.state.error}
            </Col>
          </Row>
        </Form>
        <CreateChart graphData={this.state.graphData} />
      </>
    );
  }
}

export default CreateGraph;
