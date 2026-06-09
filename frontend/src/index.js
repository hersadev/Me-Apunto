// punto de entrada de la app - aqui se monta todo en el html
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";
import { register as registerSW } from "./serviceWorkerRegistration";

// montamos la app en el div con id root del index.html publico
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerSW();