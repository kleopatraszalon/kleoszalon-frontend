import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageProvider";
import VirCustomizationRuntime from "./components/VirCustomizationRuntime";
import CopyrightNotice from "./components/CopyrightNotice";
import AppLayout from "./layouts/AppLayout";
import BookingV4TaxonomyOptimizerPage from "./pages/BookingV4TaxonomyOptimizerPage";
import { hasStoredAuthToken } from "./utils/authSession";
import { initializeFontScale } from "./utils/fontScale";
import { hasStoredRole } from "./utils/roles";
import "./config/adminMenuSecurityPatch";

import "./styles/kleo-theme.css";
import "./styles/vir-altegio.css";
import "./App.css";
import "./styles/kleopatra-brand-2026.css";
import "./styles/mobile-admin-menu-hotfix.css";

const BOOKING_V4_PATH = "/admin/booking-v4";
const ROUTE_CHANGE_EVENT = "kleo:route-change";

declare global {
  interface Window {
    __kleoRouteBridgeInstalled?: boolean;
  }
}

function installRouteBridge() {
  if (window.__kleoRouteBridgeInstalled) return;
  window.__kleoRouteBridgeInstalled = true;
  const notify = () => window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (...args) => {
    originalPushState(...args);
    notify();
  };
  window.history.replaceState = (...args) => {
    originalReplaceState(...args);
    notify();
  };
}

initializeFontScale();
installRouteBridge();

function bookingV4AdminEntry() {
  if (window.location.pathname !== BOOKING_V4_PATH) return null;
  if (!hasStoredAuthToken()) {
    window.location.replace("/login");
    return <></>;
  }
  if (!hasStoredRole(["admin", "manager"])) {
    window.location.replace("/");
    return <></>;
  }
  return (
    <BrowserRouter>
      <AppLayout>
        <BookingV4TaxonomyOptimizerPage />
      </AppLayout>
    </BrowserRouter>
  );
}

function RootApplication() {
  const [, setRouteVersion] = useState(0);
  useEffect(() => {
    const syncRoute = () => setRouteVersion((value) => value + 1);
    window.addEventListener(ROUTE_CHANGE_EVENT, syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  return bookingV4AdminEntry() || <App />;
}

const container = document.getElementById("root");
if (!container) throw new Error("Hiányzik a #root elem az index.html-ből");

createRoot(container).render(
  <React.StrictMode>
    <LanguageProvider>
      <VirCustomizationRuntime />
      <RootApplication />
      <CopyrightNotice />
    </LanguageProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js?v=1.5.2", { updateViaCache: "none" });
      await registration.update();
    } catch {
      // A service worker frissítése nem blokkolhatja az alkalmazás indulását.
    }
  });
}
