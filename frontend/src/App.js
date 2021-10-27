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
        <Navbar>
          <Container>
            <Navbar.Brand>Climbing App</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav>
                <Nav.Link href="/">Home</Nav.Link>
                <Nav.Link href="/creategraph">Create Graph</Nav.Link>
                <Nav.Link href="/averagegraph">Average Graph</Nav.Link>
              </Nav>
              <Switch isToggled={isToggled} onToggle={() => themeSwitchToggle()} />
              { console.log(isToggled) }
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
          <p>Note: No data available for 23/10/2021 - 24/10/2021</p>
          <p>{new Date().getFullYear()} Copyright: <a href="https://climbing-app.co.uk">climbing-app.co.uk</a></p>
        </Container>
      </ThemeProvider>
    </>
  );
}

export default App;
