import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ReceptionSidebar from "../components/ReceptionSidebar";
import HrSidebar from "../components/HrSidebar";
import AccountingSidebar from "../components/AccountingSidebar";
import AccessBoundary from "../components/AccessBoundary";
import AppTopbar from "../components/AppTopbar";
import { VirHungarianPageGuide, resolveVirGuidePage } from "../components/VirHungarianPageGuide";
import { translateMenuLabel, useLanguage } from "../i18n/LanguageProvider";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSessionIdleGuard } from "../hooks/useSessionIdleGuard";
import { deriveRoleFlags, resolveCurrentPageHu } from "./appLayoutModel";
import { resolveBackFallback } from "./appLayoutModel";
import "./AppLayout.css";

try {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("kleo.menu.cache.")) localStorage.removeItem(key);
  }
} catch {}

const AiHelpChat = lazy(() => import("../components/AiHelpChat"));
const AltegioServiceImportButton = lazy(() => import("../components/AltegioServiceImportButton"));
const ServiceHierarchyPanel = lazy(() => import("../components/ServiceHierarchyPanel"));
const DashboardChecklistCard = lazy(() => import("../components/DashboardChecklistCard"));
const EmployeeServicesPage = lazy(() => import("../pages/EmployeeServicesPage"));
const ServicesCatalogPage = lazy(() => import("../pages/ServicesCatalogPage"));
const ProductCatalogPage = lazy(() => import("../pages/ProductCatalogPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const AccessControlPage = lazy(() => import("../pages/AccessControlPage"));
const AuditLogPage = lazy(() => import("../pages/AuditLogPage"));
const StaffChatAdminPage = lazy(() => import("../pages/StaffChatAdminPage"));
const LegalEntitiesSettingsPage = lazy(() => import("../pages/LegalEntitiesSettingsPage"));

const Deferred = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

function IdleAiHelpChat({ pageTitle }: { pageTitle: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const runtime = window as any;
    const id = runtime.requestIdleCallback
      ? runtime.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      : window.setTimeout(() => setReady(true), 1800);
    return () => runtime.cancelIdleCallback
      ? runtime.cancelIdleCallback(id)
      : window.clearTimeout(id);
  }, []);

  return ready ? (
    <Deferred>
      <AiHelpChat pageTitle={pageTitle} />
    </Deferred>
  ) : null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const { language, locale } = useLanguage();
  const { isAccounting, isElevated, isReceptionist, isHr, isStaff } = useMemo(
    () => deriveRoleFlags(user?.role),
    [user?.role],
  );
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useSessionIdleGuard();
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((value) => !value);

  const serviceView = new URLSearchParams(location.search).get("view") || "services";
  const currentPage = translateMenuLabel(
    resolveCurrentPageHu(location.pathname, serviceView),
    language,
  );
  const fullName = localStorage.getItem("kleo_full_name")
    || (isAccounting ? "Könyvelés" : isHr ? "HR" : isStaff ? "Munkatárs" : "Adminisztrátor");
  const salon = localStorage.getItem("kleo_location_name")
    || (isAccounting
      ? language === "en" ? "All locations" : "Minden telephely"
      : isStaff
        ? language === "en" ? "Own location" : "Saját telephely"
        : language === "en" ? "All locations" : "Minden telephely");
  const today = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const isMasterServices = location.pathname === "/masterdata/services";
  const isProducts = ["/masterdata/products", "/products", "/warehouse/products"].includes(location.pathname);
  const showChecklistDashboard = !isStaff
    && !isAccounting
    && ["/", "/dashboard", "/dashboard/summary", "/dashboard/quick"].includes(location.pathname);
  const isSettingsArea = ["/settings", "/settings/tenant", "/settings/legal-entities"].includes(location.pathname);
  const canViewLegalEntities = isElevated || isAccounting;
  const showBack = location.pathname !== "/";

  const goBack = () => {
    const historyIndex = Number(window.history.state?.idx);
    if (Number.isFinite(historyIndex) && historyIndex > 1) {
      navigate(-1);
      return;
    }
    navigate(resolveBackFallback(location.pathname), { replace: true });
  };

  let pageContent = location.pathname === "/dashboard/notifications" ? <NotificationsPage /> : children;
  if (location.pathname === "/settings/legal-entities" && canViewLegalEntities) pageContent = <LegalEntitiesSettingsPage />;
  if (location.pathname === "/settings/roles") pageContent = <AccessControlPage />;
  if (location.pathname === "/modules/settings/audit-log") pageContent = <AuditLogPage />;
  if (location.pathname === "/modules/settings/chat-supervision") pageContent = <StaffChatAdminPage />;
  if (isMasterServices && serviceView === "categories") pageContent = <ServiceHierarchyPanel />;
  if (isMasterServices && serviceView === "staff") pageContent = <EmployeeServicesPage />;
  if (isMasterServices && serviceView === "services") pageContent = <ServicesCatalogPage />;
  if (isProducts) pageContent = <ProductCatalogPage />;
  const virGuidePage = resolveVirGuidePage(location.pathname);
  if (virGuidePage) pageContent = <VirHungarianPageGuide page={virGuidePage}>{pageContent}</VirHungarianPageGuide>;

  const showImport = !isStaff
    && !isAccounting
    && !isHr
    && (location.pathname === "/services" || (isMasterServices && serviceView === "services"));

  const sidebar = isAccounting
    ? <AccountingSidebar />
    : isReceptionist
      ? <ReceptionSidebar />
      : isHr
        ? <HrSidebar />
        : <Sidebar user={user} />;

  return (
    <div className={`altegio-page-shell app-layout-shell ${collapsed ? "is-sidebar-collapsed" : ""}`}>
      {sidebar}
      <button
        className="sidebar-backdrop"
        type="button"
        aria-label={language === "en" ? "Close menu" : "Menü bezárása"}
        onClick={() => setCollapsed(true)}
      />

      <div className="app-layout-column">
        <AppTopbar
          collapsed={collapsed}
          currentPage={currentPage}
          fullName={fullName}
          isAccounting={isAccounting}
          isStaff={isStaff}
          salon={salon}
          showBack={showBack}
          today={today}
          onBack={goBack}
          onLogout={logout}
          onToggleSidebar={toggleSidebar}
        />

        {isSettingsArea && canViewLegalEntities && (
          <div className="settings-section-tabs">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className={`settings-section-tab ${location.pathname === "/settings" ? "is-active" : ""}`}
            >
              Rendszerbeállítások
            </button>
            {isElevated && (
              <button
                type="button"
                onClick={() => navigate("/settings/tenant")}
                className={`settings-section-tab ${location.pathname === "/settings/tenant" ? "is-active" : ""}`}
              >
                Tenant beállítások
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/settings/legal-entities")}
              className={`settings-section-tab ${location.pathname === "/settings/legal-entities" ? "is-active" : ""}`}
            >
              Cégek és könyvelési egységek
            </button>
          </div>
        )}

        <Deferred>{showImport && <AltegioServiceImportButton />}</Deferred>
        <div className="altegio-main app-layout-main">
          <AccessBoundary>
            <Suspense fallback={<div style={{ padding: "1rem" }}>{language === "en" ? "Loading…" : "Betöltés…"}</div>}>
              {showChecklistDashboard && <DashboardChecklistCard />}
              {pageContent}
            </Suspense>
          </AccessBoundary>
        </div>
      </div>

      <IdleAiHelpChat pageTitle={currentPage} />
    </div>
  );
}
