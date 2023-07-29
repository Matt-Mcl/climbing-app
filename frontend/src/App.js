import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import CreateGraph from "./CreateGraph";
import AverageGraph from "./AverageGraph";
import Home from "./Home";
import Switch from "./Switch";
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, GlobalStyles } from "./Themes.js"

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'


function App() {

  const [isToggled, setIsToggled] = useState(window.localStorage.getItem('themeSwitch') === 'true');

  const [theme, setTheme] = useState(window.localStorage.getItem('themeSwitch') === 'true' ? 'dark' : 'light');

  const themeSwitchToggle = () => {
    if (isToggled) {
      setTheme('light');
      window.localStorage.setItem('themeSwitch', false)
    } else {
      setTheme('dark');
      window.localStorage.setItem('themeSwitch', true)
    }
    setIsToggled(!isToggled);
  }

  return (
    <>
      <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <GlobalStyles />
        <Navbar expand="lg">
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

        <Container style={{marginTop: "32px"}}>
          <Row>
            <Col>
              <p>Note: No data is available beyond 05/03/2022 (UK) as no count is currently being exposed by Oakwood. See <a href="https://www.oakwoodclimbingcentre.com/">Oakwood's Website</a> and <a href="https://portal.rockgympro.com/portal/public/2660c1de4a602e808732f0bcd3fea712/occupancy">the tracker</a></p>
              <p>{new Date().getFullYear()} Copyright: <a href="https://climbing.manysite.net">climbing.manysite.net</a></p>
            </Col>
            <Col xs="auto">
              <Switch isToggled={isToggled} onToggle={() => themeSwitchToggle()}/>
            </Col>
          </Row>
        </Container>
      </ThemeProvider>
    </>
  );
}

export default App;
