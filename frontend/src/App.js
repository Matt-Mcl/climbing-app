import React from "react";
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages";
import Climbing from "./Climbing";
import Graph from "./Graph";

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
              <Nav.Link href="/climbing">Climbing</Nav.Link>
              <Nav.Link href="/graph">Graph</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/climbing" element={<Climbing />} />
          <Route path="/graph" element={<Graph />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
