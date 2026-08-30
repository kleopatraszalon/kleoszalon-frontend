import React, { lazy, Suspense } from "react";
import { ArrowLeft, Building2, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageProvider";

const NotificationBell = lazy(() => import("./NotificationBell"));

export type AppTopbarProps = {
  collapsed: boolean;
  currentPage: string;
  fullName: string;
  isAccounting: boolean;
  isStaff: boolean;
  salon: string;
  showBack: boolean;
  today: string;
  onBack: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
};

export default function AppTopbar({
  collapsed,
  currentPage,
  fullName,
  isAccounting,
  isStaff,
  salon,
  showBack,
  today,
  onBack,
  onLogout,
  onToggleSidebar,
}: AppTopbarProps) {
  const { language, t } = useLanguage();
  const shellTitle = isAccounting ? "Könyvelési VIR" : isStaff ? t("shell.staff") : t("shell.vir");
  const menuLabel = language === "en" ? "Open or close menu" : "Menü nyitása vagy bezárása";
  const backLabel = language === "en" ? "Back" : "Vissza";
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <header className="modern-topbar">
      <div className="modern-topbar-left">
        <button
          className="topbar-collapse"
          type="button"
          onClick={onToggleSidebar}
          title={menuLabel}
          aria-label={menuLabel}
          aria-expanded={!collapsed}
        >
          <span className="desktop-sidebar-icon">
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </span>
          <span className="mobile-sidebar-icon">
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </span>
        </button>
        {showBack && (
          <button
            className="topbar-collapse topbar-back"
            type="button"
            onClick={onBack}
            title={backLabel}
            aria-label={backLabel}
          >
            <ArrowLeft size={19} />
          </button>
        )}
        <div className="topbar-breadcrumb">
          <span>{shellTitle}</span>
          <ChevronRight size={13} />
          <b>{currentPage}</b>
        </div>
      </div>

      <div className="modern-topbar-right">
        <LanguageSwitcher compact />
        {!isStaff && (
          <div className="topbar-global-search">
            <Search size={15} />
            <input placeholder={t("shell.quick_search")} />
          </div>
        )}
        <div className="topbar-location">
          <Building2 size={15} />
          <span>
            <small>{t("shell.location")}</small>
            <b>{salon}</b>
          </span>
        </div>
        <Suspense fallback={null}>
          <NotificationBell />
        </Suspense>
        <div className="topbar-profile">
          <span>{initials}</span>
          <div>
            <b>{fullName}</b>
            <small>{today}</small>
          </div>
        </div>
        <button
          className="topbar-logout"
          type="button"
          onClick={onLogout}
          title={t("shell.logout")}
          aria-label={t("shell.logout")}
        >
          <LogOut size={16} />
          <span>{t("shell.logout")}</span>
        </button>
      </div>
    </header>
  );
}
