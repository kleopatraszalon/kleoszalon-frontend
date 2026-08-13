import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Globális stílusok visszakötése
import "./styles/kleo-theme.css";
import "./styles/vir-altegio.css";
import "./App.css";
import "./styles/kleopatra-brand-2026.css";
import "./styles/mobile-admin-menu-hotfix.css";

const container = document.getElementById("root");
if (!container) throw new Error("Hiányzik a #root elem az index.html-ből");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if("serviceWorker" in navigator)window.addEventListener("load",async()=>{try{const registration=await navigator.serviceWorker.register("/sw.js?v=1.4.6",{updateViaCache:"none"});await registration.update()}catch{}});
