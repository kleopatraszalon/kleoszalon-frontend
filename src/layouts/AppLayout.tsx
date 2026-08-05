import React, { useState } from "react";
import { Bell, Building2, ChevronRight, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
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
  const [collapsed, setCollapsed] = useState(false);
  const currentPage = pageNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Irányítópult";
  const fullName = localStorage.getItem("kleo_full_name") || "Adminisztrátor";
  const salon = localStorage.getItem("kleo_location_name") || "Minden telephely";
  const today = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return (
    <div className={`altegio-page-shell app-layout-shell ${collapsed ? "is-sidebar-collapsed" : ""}`}>
      <Sidebar user={user} />
      <div className="app-layout-column">
        <header className="modern-topbar">
          <div className="modern-topbar-left">
            <button className="topbar-collapse" onClick={() => setCollapsed(value => !value)} title={collapsed ? "Menü kinyitása" : "Menü összecsukása"}>{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}</button>
            <div className="topbar-breadcrumb"><span>Kleoszalon VIR</span><ChevronRight size={13}/><b>{currentPage}</b></div>
          </div>
          <div className="modern-topbar-right">
            <div className="topbar-global-search"><Search size={15}/><input placeholder="Gyorskeresés…"/></div>
            <div className="topbar-location"><Building2 size={15}/><span><small>Telephely</small><b>{salon}</b></span></div>
            <button className="topbar-notification"><Bell size={18}/><i/></button>
            <div className="topbar-profile"><span>{fullName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><b>{fullName}</b><small>{today}</small></div></div>
          </div>
        </header>
        <div className="altegio-main app-layout-main">{children}</div>
      </div>
    </div>
  );
}
