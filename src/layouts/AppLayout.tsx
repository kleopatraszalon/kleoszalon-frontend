import React, { useEffect, useState } from "react";
import { Bell, Building2, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useCurrentUser } from "../hooks/useCurrentUser";
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
  const currentPage = pageNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Irányítópult";
  const fullName = localStorage.getItem("kleo_full_name") || "Adminisztrátor";
  const salon = localStorage.getItem("kleo_location_name") || "Minden telephely";
  const today = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

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

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileOpen(value => !value);
    } else {
      setCollapsed(value => !value);
    }
  };

  const logout = () => {
    ["token", "kleo_token", "kleo_role", "kleo_location_id", "kleo_location_name", "kleo_full_name", "email", "userId"]
      .forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    navigate("/login", { replace: true });
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
            <button className="topbar-logout" type="button" onClick={logout} title="Kijelentkezés" aria-label="Kijelentkezés"><LogOut size={16}/><span>Kijelentkezés</span></button>
          </div>
        </header>
        <div className="altegio-main app-layout-main">{children}</div>
      </div>
    </div>
  );
}
