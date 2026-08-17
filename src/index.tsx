import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageProvider";
import VirCustomizationRuntime from"./components/VirCustomizationRuntime";

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
    <LanguageProvider>
      <VirCustomizationRuntime/>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
if("serviceWorker" in navigator)window.addEventListener("load",async()=>{try{const registration=await navigator.serviceWorker.register("/sw.js?v=1.5.2",{updateViaCache:"none"});await registration.update()}catch{}});
