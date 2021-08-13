import React from "react";
import { Routes, Route } from "react-router-dom";
import CreateGraph from "./CreateGraph";
import AverageGraph from "./AverageGraph";
import Home from "./Home";

import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'

function App() {
  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand>Climbing App</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Home</Nav.Link>
              <Nav.Link href="/creategraph">Create Graph</Nav.Link>
              <Nav.Link href="/averagegraph">Average Graph</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container style={{marginTop: "16px"}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/creategraph" element={<CreateGraph />} />
          <Route path="/averagegraph" element={<AverageGraph />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
