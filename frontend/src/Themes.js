import { createGlobalStyle } from "styled-components";

export const lightTheme = {
  background: "#fff",
  navBackground: "#f8f9fa",
  fontColor: "#000",
  graph: "#f0f0f0",
  borders: "#d1cdc6"
};

export const darkTheme = {
  background: "#1a1d1e",
  navBackground: "#1e2122",
  fontColor: "#fff",
  graph: "#232729",
  borders: "#42484b"
};

export const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${(props) => props.theme.background};
    color: ${(props) => props.theme.fontColor};
  }
  .navbar.navbar-expand.navbar-light {
    background-color: ${(props) => props.theme.navBackground};
  }
  .nav-link {
    color: ${(props) => props.theme.fontColor} !important;
  }
  .navbar-brand {
    color: ${(props) => props.theme.fontColor} !important;
  }
  .line-chart {
    background-color: ${(props) => props.theme.graph};
  }
  .form-control, .form-select {
    color: ${(props) => props.theme.fontColor};
    background-color: ${(props) => props.theme.graph};
    border-color: ${(props) => props.theme.borders};
  }
  .switch {
    position: relative;
    top: 4px;
    display: inline-block;
    width: 60px;
    height: 34px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 26px;
    background-color: gray;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    border-radius: 50%;
    transition: 0.2s;
  }
  input:checked + .slider {
    background-color: 
  }
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;
