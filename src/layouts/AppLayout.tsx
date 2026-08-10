import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AiHelpChat from "../components/AiHelpChat";
import NotificationBell from "../components/NotificationBell";
import AltegioServiceImportButton from "../components/AltegioServiceImportButton";
import ServiceHierarchyPanel from "../components/ServiceHierarchyPanel";
import AccessBoundary from "../components/AccessBoundary";
import DashboardChecklistCard from "../components/DashboardChecklistCard";
import EmployeeServicesPage from "../pages/EmployeeServicesPage";
import ServicesCatalogPage from "../pages/ServicesCatalogPage";
import ProductCatalogPage from "../pages/ProductCatalogPage";
import NotificationsPage from "../pages/NotificationsPage";
import AccessControlPage from "../pages/AccessControlPage";
import AuditLogPage from "../pages/AuditLogPage";
import StaffChatAdminPage from "../pages/StaffChatAdminPage";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  clearAuthenticatedSession,
  getLastActivityAt,
  hasStoredAuthToken,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  markSessionActivity,
} from "../utils/authSession";
import "./AppLayout.css";
import "./MobileSidebarFix.css";

const pageNames: Record<string, string> = {
  "/": "Irányítópult", "/employees": "Munkatársak", "/appointments": "Időpontok",
  "/finance": "Pénzügy", "/warehouse": "Raktár és készlet", "/services": "Szolgáltatások",
  "/masterdata/services": "Szolgáltatási törzs", "/masterdata/products": "Termékek", "/products": "Termékek", "/warehouse/products": "Termékek",
  "/dashboard/notifications": "Értesítési központ",
  "/settings/roles": "Jogosultságok és hozzáférések",
  "/modules/settings/audit-log": "Audit és rendszeresemény-napló",
  "/modules/settings/chat-supervision": "Munkatársi chat felügyelet",
  "/knowledge-base/checklists": "Check listák",
  "/modules/team/timetable": "Saját beosztás",
  "/staff/chat": "Munkatársi chat",
};
function roleList(raw:unknown):string[]{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase())}catch{}return t.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const roles=useMemo(()=>roleList(user?.role),[user?.role]);
  const isElevated=roles.some(r=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto"].includes(r));
  const isStaff=!isElevated&&roles.some(r=>["employee","receptionist"].includes(r));
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("kleo.sidebar.collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const serviceView = new URLSearchParams(location.search).get("view") || "services";
  const currentPage = location.pathname === "/masterdata/services"
    ? serviceView === "categories" ? "Szolgáltatási kategóriák" : serviceView === "staff" ? "Szakember–szolgáltatás beállítások" : "Szolgáltatások"
    : pageNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Irányítópult";
  const fullName = localStorage.getItem("kleo_full_name") || (isStaff?"Munkatárs":"Adminisztrátor");
  const salon = localStorage.getItem("kleo_location_name") || (isStaff?"Saját telephely":"Minden telephely");
  const today = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  const logout = useCallback((reason?: "idle") => {
    clearAuthenticatedSession();
    if (reason === "idle") {
      try { sessionStorage.setItem("kleo_logout_reason", "idle"); } catch {}
    }
    navigate(reason === "idle" ? "/login?reason=idle" : "/login", { replace: true });
  }, [navigate]);

  useEffect(() => { localStorage.setItem("kleo.sidebar.collapsed", String(collapsed)); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { if (!mobileOpen) return; const p=document.body.style.overflow; document.body.style.overflow="hidden"; return()=>{document.body.style.overflow=p}; }, [mobileOpen]);

  // VIR specifikáció: 5 perc felhasználói tétlenség után automatikus kijelentkezés.
  // Az aktivitás időbélyege localStorage-ban közös a böngészőfülek között, így az
  // egyik fülben végzett munka nem jelentkezteti ki tévesen a másik aktív fület.
  useEffect(() => {
    if (!hasStoredAuthToken()) return;

    let timer: number | undefined;
    let lastWriteAt = 0;
    let fallbackActivityAt = Date.now();

    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;

    const expireIfIdle = () => {
      if (!hasStoredAuthToken()) {
        logout();
        return;
      }
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) {
        logout("idle");
        return;
      }
      schedule();
    };

    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const elapsed = Date.now() - currentLastActivity();
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
      timer = window.setTimeout(expireIfIdle, remaining + 50);
    };

    const registerActivity = () => {
      const now = Date.now();
      fallbackActivityAt = now;
      // A folyamatos egér/scroll események miatt legfeljebb másodpercenként írunk storage-ba.
      if (now - lastWriteAt >= 1000) {
        markSessionActivity(now);
        lastWriteAt = now;
      }
      schedule();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        schedule();
        return;
      }
      if ((event.key === "kleo_token" || event.key === "token") && !hasStoredAuthToken()) {
        logout();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") registerActivity();
    };

    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt);
    schedule();

    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity, passive);
    window.addEventListener("scroll", registerActivity, passive);
    window.addEventListener("focus", registerActivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("focus", registerActivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logout]);

  const toggleSidebar = () => window.matchMedia("(max-width: 900px)").matches ? setMobileOpen(v=>!v) : setCollapsed(v=>!v);

  const isMasterServices = location.pathname === "/masterdata/services";
  const isProducts = ["/masterdata/products","/products","/warehouse/products"].includes(location.pathname);
  const showChecklistDashboard = !isStaff && ["/", "/dashboard", "/dashboard/summary", "/dashboard/quick"].includes(location.pathname);
  let pageContent = location.pathname === "/dashboard/notifications" ? <NotificationsPage /> : children;
  if (location.pathname === "/settings/roles") pageContent = <AccessControlPage />;
  if (location.pathname === "/modules/settings/audit-log") pageContent = <AuditLogPage />;
  if (location.pathname === "/modules/settings/chat-supervision") pageContent = <StaffChatAdminPage />;
  if (isMasterServices && serviceView === "staff") pageContent = <EmployeeServicesPage />;
  if (isMasterServices && serviceView === "services") pageContent = <ServicesCatalogPage />;
  if (isProducts) pageContent = <ProductCatalogPage />;
  const showImport = !isStaff && (location.pathname === "/services" || (isMasterServices && serviceView === "services"));
  const showHierarchy = !isStaff && isMasterServices && serviceView === "categories";

  return <div className={`altegio-page-shell app-layout-shell ${collapsed?"is-sidebar-collapsed":""} ${mobileOpen?"is-mobile-sidebar-open":""}`}>
    <Sidebar user={user}/><button className="sidebar-backdrop" type="button" aria-label="Menü bezárása" onClick={()=>setMobileOpen(false)}/>
    <div className="app-layout-column">
      <header className="modern-topbar"><div className="modern-topbar-left"><button className="topbar-collapse" type="button" onClick={toggleSidebar} title="Menü nyitása vagy bezárása" aria-label="Menü nyitása vagy bezárása" aria-expanded={mobileOpen||!collapsed}><span className="desktop-sidebar-icon">{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</span><span className="mobile-sidebar-icon">{mobileOpen?<X size={20}/>:<Menu size={20}/>}</span></button><div className="topbar-breadcrumb"><span>{isStaff?"Kleoszalon munkatársi felület":"Kleoszalon VIR"}</span><ChevronRight size={13}/><b>{currentPage}</b></div></div>
      <div className="modern-topbar-right">{!isStaff&&<div className="topbar-global-search"><Search size={15}/><input placeholder="Gyorskeresés…"/></div>}<div className="topbar-location"><Building2 size={15}/><span><small>Telephely</small><b>{salon}</b></span></div><NotificationBell/><div className="topbar-profile"><span>{fullName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><b>{fullName}</b><small>{today}</small></div></div><button className="topbar-logout" type="button" onClick={()=>logout()} title="Kijelentkezés" aria-label="Kijelentkezés"><LogOut size={16}/><span>Kijelentkezés</span></button></div></header>
      {showImport&&<AltegioServiceImportButton/>}{showHierarchy&&<ServiceHierarchyPanel/>}
      <div className="altegio-main app-layout-main"><AccessBoundary>{showHierarchy?null:<>{showChecklistDashboard&&<DashboardChecklistCard/>}{pageContent}</>}</AccessBoundary></div>
    </div><AiHelpChat pageTitle={currentPage}/>
  </div>;
}
