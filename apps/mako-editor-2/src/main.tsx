import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useProjectStore } from "./store/projectStore";
import "./index.css";

// Expose store for testing
(window as any).__zustandStore = useProjectStore;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
