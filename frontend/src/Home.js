import React, { Component } from "react";
import CreateChart from "./CreateChart.js";

async function getJSON(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

class ClimbingCount extends Component {
  constructor() {
    super();
    this.state = {count: '---', capacity: '---'};
  }

  async componentDidMount() {
    let data = await getJSON(process.env.REACT_APP_API_SERVER + "/getclimbingcount");
    this.setState( {count: data.count, capacity: data.capacity} );
  }

  render() {
    return <h1> There are {this.state.count}/{this.state.capacity} people climbing.</h1>
  }
}

class ClimingGraph extends Component {
  constructor() {
    super();
    this.state = null;
  }

  async componentDidMount() {
    let data = await getJSON(`${process.env.REACT_APP_API_SERVER}/getgraph?dates=t&type=default`);
    this.setState(data);
  }

  render() {
    if (this.state === null) return "";
    if (this.state.error) return <h4>No data for today yet. Centre opens at 10am</h4>;
    return (
      <>
        <CreateChart graphData={this.state}/>
      </>
    );
  }
}

function Home() {
  return (
    <>
      <ClimbingCount />
      <ClimingGraph />      
    </>
  );
}

export default Home;
