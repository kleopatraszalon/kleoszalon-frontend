import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AccessBoundary from "../components/AccessBoundary";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLanguage } from "../i18n/LanguageProvider";
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
function IdleAiHelpChat({pageTitle}:{pageTitle:string}){const[ready,setReady]=useState(false);useEffect(()=>{const w=window as any;const id=w.requestIdleCallback?w.requestIdleCallback(()=>setReady(true),{timeout:2500}):window.setTimeout(()=>setReady(true),1800);return()=>w.cancelIdleCallback?w.cancelIdleCallback(id):window.clearTimeout(id)},[]);return ready?<Deferred><AiHelpChat pageTitle={pageTitle}/></Deferred>:null}

const pageNameKeys:Record<string,string>={"/":"shell.dashboard","/finance":"shell.finance","/warehouse":"shell.inventory","/services":"shell.services","/masterdata/products":"shell.products","/products":"shell.products","/warehouse/products":"shell.products","/dashboard/notifications":"shell.notifications","/settings/roles":"shell.permissions","/modules/settings/audit-log":"shell.audit","/modules/settings/chat-supervision":"shell.chat"};
const pageNamesHu:Record<string,string>={"/employees":"Munkatársak","/appointments":"Időpontok","/masterdata/services":"Szolgáltatási törzs","/knowledge-base/checklists":"Check listák","/modules/team/timetable":"Saját beosztás","/staff/chat":"Munkatársi chat"};
const pageNamesEn:Record<string,string>={"/employees":"Staff","/appointments":"Appointments","/masterdata/services":"Service master data","/knowledge-base/checklists":"Checklists","/modules/team/timetable":"My schedule","/staff/chat":"Staff chat"};
function roleList(raw:unknown):string[]{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const v=String(raw??"");try{const p=JSON.parse(v);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase())}catch{}return v.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser(); const { language, locale, t } = useLanguage();
  const roles=useMemo(()=>roleList(user?.role),[user?.role]);
  const isElevated=roles.some(r=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto"].includes(r));
  const isStaff=!isElevated&&roles.some(r=>["employee","receptionist"].includes(r));
  const location = useLocation(); const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("kleo.sidebar.collapsed") === "true"); const [mobileOpen, setMobileOpen] = useState(false);
  const serviceView = new URLSearchParams(location.search).get("view") || "services";
  const translatedPath=pageNameKeys[location.pathname]?t(pageNameKeys[location.pathname]):null;
  const baseNames=language==="en"?pageNamesEn:pageNamesHu;
  const currentPage = location.pathname === "/masterdata/services" ? serviceView === "categories" ? (language==="en"?"Service categories":"Szolgáltatási kategóriák") : serviceView === "staff" ? (language==="en"?"Professional–service settings":"Szakember–szolgáltatás beállítások") : t("shell.services") : translatedPath || baseNames[location.pathname] || location.pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || t("shell.dashboard");
  const fullName = localStorage.getItem("kleo_full_name") || (isStaff?(language==="en"?"Staff member":"Munkatárs"):(language==="en"?"Administrator":"Adminisztrátor"));
  const salon = localStorage.getItem("kleo_location_name") || (isStaff?(language==="en"?"Own location":"Saját telephely"):t("shell.all_locations"));
  const today = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());

  const logout = useCallback((reason?: "idle") => {clearAuthenticatedSession();if (reason === "idle") {try { sessionStorage.setItem("kleo_logout_reason", "idle"); } catch {}}navigate(reason === "idle" ? "/login?reason=idle" : "/login", { replace: true });}, [navigate]);
  useEffect(() => { localStorage.setItem("kleo.sidebar.collapsed", String(collapsed)); }, [collapsed]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { if (!mobileOpen) return; const p=document.body.style.overflow; document.body.style.overflow="hidden"; return()=>{document.body.style.overflow=p}; }, [mobileOpen]);

  useEffect(() => {
    if (!hasStoredAuthToken()) return;
    let timer: number | undefined; let lastWriteAt = 0; let fallbackActivityAt = Date.now();
    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;
    const expireIfIdle = () => {if (!hasStoredAuthToken()) {logout();return;}const elapsed = Date.now() - currentLastActivity();if (elapsed >= IDLE_TIMEOUT_MS) {logout("idle");return;}schedule();};
    const schedule = () => {if (timer !== undefined) window.clearTimeout(timer);const elapsed = Date.now() - currentLastActivity();timer = window.setTimeout(expireIfIdle, Math.max(0, IDLE_TIMEOUT_MS - elapsed) + 50);};
    const registerActivity = () => {const now = Date.now();fallbackActivityAt = now;if (now - lastWriteAt >= 1000) {markSessionActivity(now);lastWriteAt = now;}schedule();};
    const onStorage = (event: StorageEvent) => {if (event.key === LAST_ACTIVITY_KEY) {schedule();return;}if ((event.key === "kleo_token" || event.key === "token") && !hasStoredAuthToken()) logout();};
    const onVisibility = () => {if (document.visibilityState === "visible") registerActivity();};
    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt); schedule();
    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);window.addEventListener("keydown", registerActivity);window.addEventListener("touchstart", registerActivity, passive);window.addEventListener("scroll", registerActivity, passive);window.addEventListener("focus", registerActivity);window.addEventListener("storage", onStorage);document.addEventListener("visibilitychange", onVisibility);
    return () => {if (timer !== undefined) window.clearTimeout(timer);window.removeEventListener("pointerdown", registerActivity);window.removeEventListener("keydown", registerActivity);window.removeEventListener("touchstart", registerActivity);window.removeEventListener("scroll", registerActivity);window.removeEventListener("focus", registerActivity);window.removeEventListener("storage", onStorage);document.removeEventListener("visibilitychange", onVisibility);};
  }, [logout]);

  const toggleSidebar = () => window.matchMedia("(max-width: 900px)").matches ? setMobileOpen(v=>!v) : setCollapsed(v=>!v);
  const isMasterServices = location.pathname === "/masterdata/services"; const isProducts = ["/masterdata/products","/products","/warehouse/products"].includes(location.pathname); const showChecklistDashboard = !isStaff && ["/", "/dashboard", "/dashboard/summary", "/dashboard/quick"].includes(location.pathname);
  let pageContent = location.pathname === "/dashboard/notifications" ? <NotificationsPage /> : children;
  if (location.pathname === "/settings/roles") pageContent = <AccessControlPage />; if (location.pathname === "/modules/settings/audit-log") pageContent = <AuditLogPage />; if (location.pathname === "/modules/settings/chat-supervision") pageContent = <StaffChatAdminPage />; if (isMasterServices && serviceView === "staff") pageContent = <EmployeeServicesPage />; if (isMasterServices && serviceView === "services") pageContent = <ServicesCatalogPage />; if (isProducts) pageContent = <ProductCatalogPage />;
  const showImport = !isStaff && (location.pathname === "/services" || (isMasterServices && serviceView === "services")); const showHierarchy = !isStaff && isMasterServices && serviceView === "categories";

  return <div className={`altegio-page-shell app-layout-shell ${collapsed?"is-sidebar-collapsed":""} ${mobileOpen?"is-mobile-sidebar-open":""}`}>
    <Sidebar user={user}/><button className="sidebar-backdrop" type="button" aria-label={language==="en"?"Close menu":"Menü bezárása"} onClick={()=>setMobileOpen(false)}/>
    <div className="app-layout-column"><header className="modern-topbar"><div className="modern-topbar-left"><button className="topbar-collapse" type="button" onClick={toggleSidebar} title={language==="en"?"Toggle menu":"Menü nyitása vagy bezárása"} aria-label={language==="en"?"Toggle menu":"Menü nyitása vagy bezárása"} aria-expanded={mobileOpen||!collapsed}><span className="desktop-sidebar-icon">{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</span><span className="mobile-sidebar-icon">{mobileOpen?<X size={20}/>:<Menu size={20}/>}</span></button><div className="topbar-breadcrumb"><span>{isStaff?t("shell.staff"):t("shell.vir")}</span><ChevronRight size={13}/><b>{currentPage}</b></div></div>
      <div className="modern-topbar-right">{!isStaff&&<div className="topbar-global-search"><Search size={15}/><input placeholder={t("shell.quick_search")}/></div>}<LanguageSwitcher compact/><div className="topbar-location"><Building2 size={15}/><span><small>{t("shell.location")}</small><b>{salon}</b></span></div><Deferred><NotificationBell/></Deferred><div className="topbar-profile"><span>{fullName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</span><div><b>{fullName}</b><small>{today}</small></div></div><button className="topbar-logout" type="button" onClick={()=>logout()} title={t("shell.logout")} aria-label={t("shell.logout")}><LogOut size={16}/><span>{t("shell.logout")}</span></button></div></header>
      <Deferred>{showImport&&<AltegioServiceImportButton/>}{showHierarchy&&<ServiceHierarchyPanel/>}</Deferred><div className="altegio-main app-layout-main"><AccessBoundary>{showHierarchy?null:<Suspense fallback={<div style={{padding:"1rem"}}>{t("common.loading")}</div>}>{showChecklistDashboard&&<DashboardChecklistCard/>}{pageContent}</Suspense>}</AccessBoundary></div>
    </div><IdleAiHelpChat pageTitle={currentPage}/>
  </div>;
}
