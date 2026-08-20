import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageProvider";
import VirCustomizationRuntime from"./components/VirCustomizationRuntime";
import CopyrightNotice from "./components/CopyrightNotice";
import AppLayout from "./layouts/AppLayout";
import BookingV4TaxonomyOptimizerPage from "./pages/BookingV4TaxonomyOptimizerPage";
import { hasStoredRole } from "./utils/roles";

// Globális stílusok visszakötése
import "./styles/kleo-theme.css";
import "./styles/vir-altegio.css";
import "./App.css";
import "./styles/kleopatra-brand-2026.css";
import "./styles/mobile-admin-menu-hotfix.css";

const container = document.getElementById("root");
if (!container) throw new Error("Hiányzik a #root elem az index.html-ből");

function bookingV4AdminEntry(){
  if(window.location.pathname!=="/admin/booking-v4")return null;
  const token=localStorage.getItem("kleo_token")||localStorage.getItem("token");
  if(!token){window.location.replace("/login");return <></>;}
  if(!hasStoredRole(["admin","manager"])){window.location.replace("/");return <></>;}
  return <AppLayout><BookingV4TaxonomyOptimizerPage/></AppLayout>;
}

const specialEntry=bookingV4AdminEntry();
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <VirCustomizationRuntime/>
      {specialEntry||<App />}
      <CopyrightNotice />
    </LanguageProvider>
  </React.StrictMode>
);
if("serviceWorker" in navigator)window.addEventListener("load",async()=>{try{const registration=await navigator.serviceWorker.register("/sw.js?v=1.5.2",{updateViaCache:"none"});await registration.update()}catch{}});