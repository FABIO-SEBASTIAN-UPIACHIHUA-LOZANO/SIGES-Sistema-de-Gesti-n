import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme } from "./utils/preferences";

// IMPLEMENTACIÓN: el arranque público siempre es claro. App.jsx aplica la
// preferencia individual cuando AuthContext identifica la cuenta activa.
applyTheme("light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
