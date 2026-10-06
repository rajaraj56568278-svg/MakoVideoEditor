import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// The house style first, the app's own rules after it so they win.
import "@makoai/app-sdk/ui.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
