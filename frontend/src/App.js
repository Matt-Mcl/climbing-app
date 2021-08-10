import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Home } from "./pages";
import Climbing from "./Climbing";
import Graph from "./Graph";

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> |
        <Link to="/climbing"> Climbing </Link> |
        <Link to="/graph"> Graph </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/climbing" element={<Climbing />} />
        <Route path="/graph" element={<Graph />} />
      </Routes>
    </>
  );
}

export default App;
