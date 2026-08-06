import React, { useCallback, useEffect, useState } from "react";
import { Bell, Building2, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import withBase from "../utils/apiBase";
import "./AppLayout.css";

const pageNames: Record<string, string> = {
  "/": "Irányítópult", "/employees": "Munkatársak", "/appointments": "Időpontok",
  "/finance": "Pénzügy", "/warehouse": "Raktár és készlet", "/services": "Szolgáltatások",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("kleo.sidebar.collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [idleLogoutMinutes, setIdleLogoutMinutes] = useState(() => {
    const stored = Number(localStorage.getItem("kleo.idle_logout_minutes"));
    return Number.isFinite(stored) && stored >= 1 ? stored : 5;
  });
  const currentPage = pageNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Irányítópult";
  const fullName = localStorage.getItem("kleo_full_name") || "Adminisztrátor";
  const salon = localStorage.getItem("kleo_location_name") || "Minden telephely";
  const today = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  const logout = useCallback((reason?: "idle") => {
    ["token", "kleo_token", "kleo_role", "kleo_location_id", "kleo_location_name", "kleo_full_name", "email", "userId"]
      .forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    if (reason === "idle") sessionStorage.setItem("kleo.login.notice", "Biztonsági okból inaktivitás után kijelentkeztettük.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("kleo.sidebar.collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
    fetch(withBase("vir-modules/settings.application?limit=1"), {
      credentials: "include",
      signal: controller.signal,
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(response => response.ok ? response.json() : [])
      .then((rows: any[]) => {
        const configured = Number(rows?.[0]?.data?.idle_logout_minutes ?? rows?.[0]?.idle_logout_minutes);
        if (!Number.isFinite(configured) || configured < 1 || configured > 240) return;
        localStorage.setItem("kleo.idle_logout_minutes", String(configured));
        setIdleLogoutMinutes(configured);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let timer = 0;
    let lastReset = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => logout("idle"), idleLogoutMinutes * 60_000);
    };
    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return;
      lastReset = now;
      schedule();
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach(eventName => window.addEventListener(eventName, onActivity, { passive: true }));
    const onVisibility = () => { if (document.visibilityState === "visible") onActivity(); };
    document.addEventListener("visibilitychange", onVisibility);
    schedule();
    return () => {
      window.clearTimeout(timer);
      events.forEach(eventName => window.removeEventListener(eventName, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [idleLogoutMinutes, logout]);

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileOpen(value => !value);
    } else {
      setCollapsed(value => !value);
    }
  };

  return (
    <div className={`altegio-page-shell app-layout-shell ${collapsed ? "is-sidebar-collapsed" : ""} ${mobileOpen ? "is-mobile-sidebar-open" : ""}`}>
      <Sidebar user={user} />
      <button className="sidebar-backdrop" type="button" aria-label="Menü bezárása" onClick={() => setMobileOpen(false)} />
      <div className="app-layout-column">
        <header className="modern-topbar">
          <div className="modern-topbar-left">
            <button className="topbar-collapse" type="button" onClick={toggleSidebar} title="Menü nyitása vagy bezárása" aria-label="Menü nyitása vagy bezárása" aria-expanded={mobileOpen || !collapsed}>
              <span className="desktop-sidebar-icon">{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}</span>
              <span className="mobile-sidebar-icon">{mobileOpen ? <X size={20}/> : <Menu size={20}/>}</span>
            </button>
            <div className="topbar-breadcrumb"><span>Kleoszalon VIR</span><ChevronRight size={13}/><b>{currentPage}</b></div>
          </div>
          <div className="modern-topbar-right">
            <div className="topbar-global-search"><Search size={15}/><input placeholder="Gyorskeresés…"/></div>
            <div className="topbar-location"><Building2 size={15}/><span><small>Telephely</small><b>{salon}</b></span></div>
            <button className="topbar-notification"><Bell size={18}/><i/></button>
            <div className="topbar-profile"><span>{fullName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><b>{fullName}</b><small>{today}</small></div></div>
            <button className="topbar-logout" type="button" onClick={() => logout()} title="Kijelentkezés" aria-label="Kijelentkezés"><LogOut size={16}/><span>Kijelentkezés</span></button>
          </div>
        </header>
        <div className="altegio-main app-layout-main">{children}</div>
      </div>
    </div>
  );
}
