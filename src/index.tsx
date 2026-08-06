import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Globális stílusok visszakötése
import "./styles/kleo-theme.css";
import "./styles/vir-altegio.css";
import "./App.css";
import "./styles/kleo-brand-2026.css";

const container = document.getElementById("root");
if (!container) throw new Error("Hiányzik a #root elem az index.html-ből");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
