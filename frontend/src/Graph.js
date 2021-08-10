import React, { Component } from "react";
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
// import Container from 'react-bootstrap/Container'
import Image from 'react-bootstrap/Image'

class Graph extends Component {
  constructor() {
    super();
    this.state = {day: 'monday', show: false};
    this.handleDayChange = this.handleDayChange.bind(this)
    this.handleShowChange = this.handleShowChange.bind(this)
  }

  handleDayChange(event) {
    this.setState({day: event.target.value});
  }

  handleShowChange(event) {
    this.setState({show: !this.state.show});
  }

  render() {
    return (
      <>
        <Col md={4}>
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Day:</Form.Label>
              <Form.Select value={this.state.day} onChange={this.handleDayChange}>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Show:</Form.Label>
              <Form.Check type="checkbox" checked={this.state.show} onChange={this.handleShowChange} />
            </Form.Group>
          </Form>
        </Col>
        <Image src={`${process.env.REACT_APP_API_SERVER}/getgraph?day=${this.state.day}&show=${this.state.show}`} alt="graph of climbing data" fluid />
      </>
    );
  }
}

export default Graph;
