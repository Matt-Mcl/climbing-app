import React, { Component } from "react";
import Image from 'react-bootstrap/Image'

async function getClimbingCount() {
  const response = await fetch(process.env.REACT_APP_API_SERVER + "/getclimbingcount");
  const text = await response.text();
  return text;
}

class Climbing extends Component {
  constructor() {
    super();
    this.state = {count: null, capacity: null};
  }

  async componentDidMount() {
    let data = await getClimbingCount();
    data = JSON.parse(data);
    this.setState( {count: data.count, capacity: data.capacity} );
  }

  render() {
    if (this.state.count === null) return null;
    return (
      <h1>
        There are {this.state.count}/{this.state.capacity} people climbing.
        <Image src={`${process.env.REACT_APP_API_SERVER}/getgraph?dates=t&type=default`} alt="graph of climbing data" fluid />
      </h1>
    );
  }
}

export default Climbing;