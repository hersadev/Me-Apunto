// punto de entrada de la app - aqui se monta todo en el html
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// montamos la app en el div con id root del index.html publico
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);