import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AccountingSidebar from "../components/AccountingSidebar";
import AccessBoundary from "../components/AccessBoundary";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { translateMenuLabel, useLanguage } from "../i18n/LanguageProvider";
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

// A korábbi részleges menüválaszok böngésző-cache-e nem írhatja felül a friss
// backend menüt. A cache csak gyorsító réteg, ezért új shell betöltéskor töröljük.
try {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("kleo.menu.cache.")) localStorage.removeItem(key);
  }
} catch {}

const AiHelpChat=lazy(()=>import("../components/AiHelpChat"));
const NotificationBell=lazy(()=>import("../components/NotificationBell"));
const AltegioServiceImportButton=lazy(()=>import("../components/AltegioServiceImportButton"));
const ServiceHierarchyPanel=lazy(()=>import("../components/ServiceHierarchyPanel"));
const DashboardChecklistCard=lazy(()=>import("../components/DashboardChecklistCard"));
const EmployeeServicesPage=lazy(()=>import("../pages/EmployeeServicesPage"));
const ServicesCatalogPage=lazy(()=>import("../pages/ServicesCatalogPage"));
const ProductCatalogPage=lazy(()=>import("../pages/ProductCatalogPage"));
const NotificationsPage=lazy(()=>import("../pages/NotificationsPage"));
const AccessControlPage=lazy(()=>import("../pages/AccessControlPage"));
const AuditLogPage=lazy(()=>import("../pages/AuditLogPage"));
const StaffChatAdminPage=lazy(()=>import("../pages/StaffChatAdminPage"));
const Deferred=({children}:{children:React.ReactNode})=><Suspense fallback={null}>{children}</Suspense>;
function IdleAiHelpChat({pageTitle}:{pageTitle:string}){
  const[ready,setReady]=useState(false);
  useEffect(()=>{
    const w=window as any;
    const id=w.requestIdleCallback?w.requestIdleCallback(()=>setReady(true),{timeout:2500}):window.setTimeout(()=>setReady(true),1800);
    return()=>w.cancelIdleCallback?w.cancelIdleCallback(id):window.clearTimeout(id);
  },[]);
  return ready?<Deferred><AiHelpChat pageTitle={pageTitle}/></Deferred>:null;
}

const pageNames: Record<string, string> = {
  "/": "Irányítópult", "/employees": "Munkatársak", "/appointments": "Időpontok",
  "/finance": "Pénzügy", "/warehouse": "Raktár és készlet", "/services": "Szolgáltatások",
  "/warehouse/lots": "Sarzs és lejárat (FEFO)",
  "/masterdata/services": "Szolgáltatási törzs", "/masterdata/products": "Termékek", "/products": "Termékek", "/warehouse/products": "Termékek",
  "/dashboard/notifications": "Értesítési központ",
  "/settings/roles": "Jogosultságok és hozzáférések",
  "/modules/settings/audit-log": "Audit és rendszeresemény-napló",
  "/modules/settings/chat-supervision": "Munkatársi chat felügyelet",
  "/knowledge-base/checklists": "Check listák",
  "/modules/team/timetable": "Saját beosztás",
  "/staff/chat": "Munkatársi chat",
};
function roleList(raw:unknown):string[]{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase())}catch{}return t.split(",").map(x=>x.replace(/[[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const { language, locale, t } = useLanguage();
  const roles=useMemo(()=>roleList(user?.role),[user?.role]);
  const isAccounting=roles.some(r=>["accounting","bookkeeper","konyveles","könyvelés"].includes(r));
  const isElevated=roles.some(r=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto"].includes(r));
  const isReceptionist=roles.some(r=>["receptionist","reception","recepciós","recepcios"].includes(r));
  const isStaff=isReceptionist||(!isAccounting&&!isElevated&&roles.some(r=>["employee","staff","munkatárs","munkatars","professional","specialist"].includes(r)));
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const serviceView = new URLSearchParams(location.search).get("view") || "services";
  const currentPageHu = location.pathname === "/masterdata/services"
    ? serviceView === "categories" ? "Szolgáltatási kategóriák" : serviceView === "staff" ? "Szakember–szolgáltatás beállítások" : "Szolgáltatások"
    : pageNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Irányítópult";
  const currentPage = translateMenuLabel(currentPageHu, language);
  const fullName = localStorage.getItem("kleo_full_name") || (isAccounting?"Könyvelés":isStaff?"Munkatárs":"Adminisztrátor");
  const salon = localStorage.getItem("kleo_location_name") || (isAccounting?(language==="en"?"All locations":"Minden telephely"):isStaff?(language==="en"?"Own location":"Saját telephely"):(language==="en"?"All locations":"Minden telephely"));
  const today = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  const logout = useCallback((reason?: "idle") => {
    clearAuthenticatedSession();
    if (reason === "idle") {
      try { sessionStorage.setItem("kleo_logout_reason", "idle"); } catch {}
    }
    navigate(reason === "idle" ? "/login?reason=idle" : "/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!hasStoredAuthToken()) return;
    let timer: number | undefined;
    let lastWriteAt = 0;
    let fallbackActivityAt = Date.now();
    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;
    const expireIfIdle = () => {
      if (!hasStoredAuthToken()) { logout(); return; }
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) { logout("idle"); return; }
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
      if (now - lastWriteAt >= 1000) { markSessionActivity(now); lastWriteAt = now; }
      schedule();
    };
    const verifyThenRegisterActivity = () => {
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) { logout("idle"); return; }
      registerActivity();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) { schedule(); return; }
      if ((event.key === "kleo_token" || event.key === "token") && !hasStoredAuthToken()) logout();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") verifyThenRegisterActivity(); };
    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt);
    schedule();
    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity, passive);
    window.addEventListener("scroll", registerActivity, passive);
    window.addEventListener("focus", verifyThenRegisterActivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("focus", verifyThenRegisterActivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logout]);

  const toggleSidebar = () => setCollapsed(v=>!v);
  const isMasterServices = location.pathname === "/masterdata/services";
  const isProducts = ["/masterdata/products","/products","/warehouse/products"].includes(location.pathname);
  const showChecklistDashboard = !isStaff && !isAccounting && ["/", "/dashboard", "/dashboard/summary", "/dashboard/quick"].includes(location.pathname);
  let pageContent = location.pathname === "/dashboard/notifications" ? <NotificationsPage /> : children;
  if (location.pathname === "/settings/roles") pageContent = <AccessControlPage />;
  if (location.pathname === "/modules/settings/audit-log") pageContent = <AuditLogPage />;
  if (location.pathname === "/modules/settings/chat-supervision") pageContent = <StaffChatAdminPage />;
  if (isMasterServices && serviceView === "categories") pageContent = <ServiceHierarchyPanel />;
  if (isMasterServices && serviceView === "staff") pageContent = <EmployeeServicesPage />;
  if (isMasterServices && serviceView === "services") pageContent = <ServicesCatalogPage />;
  if (isProducts) pageContent = <ProductCatalogPage />;
  const showImport = !isStaff && !isAccounting && (location.pathname === "/services" || (isMasterServices && serviceView === "services"));

  return <div className={`altegio-page-shell app-layout-shell ${collapsed?"is-sidebar-collapsed":""}`}>
    {isAccounting?<AccountingSidebar/>:<Sidebar user={user}/>}<button className="sidebar-backdrop" type="button" aria-label={language==="en"?"Close menu":"Menü bezárása"} onClick={()=>setCollapsed(true)}/>
    <div className="app-layout-column">
      <header className="modern-topbar"><div className="modern-topbar-left"><button className="topbar-collapse" type="button" onClick={toggleSidebar} title={language==="en"?"Open or close menu":"Menü nyitása vagy bezárása"} aria-label={language==="en"?"Open or close menu":"Menü nyitása vagy bezárása"} aria-expanded={!collapsed}><span className="desktop-sidebar-icon">{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</span><span className="mobile-sidebar-icon">{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}</span></button><div className="topbar-breadcrumb"><span>{isAccounting?"Könyvelési VIR":isStaff?t("shell.staff"):t("shell.vir")}</span><ChevronRight size={13}/><b>{currentPage}</b></div></div>
      <div className="modern-topbar-right"><LanguageSwitcher compact/>{!isStaff&&<div className="topbar-global-search"><Search size={15}/><input placeholder={t("shell.quick_search")}/></div>}<div className="topbar-location"><Building2 size={15}/><span><small>{t("shell.location")}</small><b>{salon}</b></span></div><Deferred><NotificationBell/></Deferred><div className="topbar-profile"><span>{fullName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><b>{fullName}</b><small>{today}</small></div></div><button className="topbar-logout" type="button" onClick={()=>logout()} title={t("shell.logout")} aria-label={t("shell.logout")}><LogOut size={16}/><span>{t("shell.logout")}</span></button></div></header>
      <Deferred>{showImport&&<AltegioServiceImportButton/>}</Deferred>
      <div className="altegio-main app-layout-main"><AccessBoundary><Suspense fallback={<div style={{padding:"1rem"}}>{language==="en"?"Loading…":"Betöltés…"}</div>}>{showChecklistDashboard&&<DashboardChecklistCard/>}{pageContent}</Suspense></AccessBoundary></div>
    </div><IdleAiHelpChat pageTitle={currentPage}/>
  </div>;
}