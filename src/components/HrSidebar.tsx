import React from "react";
import { CalendarDays, ClipboardCheck, LayoutDashboard, BookOpenText, UserCog, Users, WalletCards, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/kleo_logo.png";
import { useLanguage } from "../i18n/LanguageProvider";
import { menuLabel } from "../utils/menuLabels";

type HrMenuItem = { label: string; to: string; icon: LucideIcon };

export const HR_CORE_MENU: HrMenuItem[] = [
  { label: "HR irányítópult", to: "/", icon: LayoutDashboard },
  { label: "Munkatársak", to: "/employees", icon: Users },
  { label: "Munkakörök", to: "/hr/positions", icon: UserCog },
  { label: "Beosztás és munkaidő", to: "/modules/team/timetable", icon: CalendarDays },
  { label: "Jelenlét", to: "/modules/team/attendance", icon: ClipboardCheck },
  { label: "Bér és jutalék", to: "/modules/team/payroll", icon: WalletCards },
];

export const HR_DEVELOPMENT_MENU: HrMenuItem[] = [
  { label: "Toborzás", to: "/hr/applications", icon: Users },
  { label: "Képzések", to: "/spec/training", icon: BookOpenText },
  { label: "Értékelések", to: "/hr/evaluations", icon: ClipboardCheck },
];

function Links({ items }: { items: HrMenuItem[] }) {
  const { language } = useLanguage();
  return <>{items.map(({ label, to, icon: Icon }) => (
    <li key={to} className="kleo-sidebar-menu-item">
      <NavLink to={to} end={to === "/"} className={({ isActive }) => `kleo-sidebar-menu-button kleo-sidebar-menu-link ${isActive ? "active" : ""}`}>
        <Icon className="kleo-sidebar-menu-icon" size={17} strokeWidth={1.8} />
        <span className="kleo-sidebar-menu-label">{menuLabel(label, language)}</span>
      </NavLink>
    </li>
  ))}</>;
}

export default function HrSidebar() {
  const { language } = useLanguage();
  return (
    <aside className="kleo-sidebar app-sidebar">
      <div className="kleo-sidebar-hero-card">
        <div className="kleo-sidebar-header">
          <div className="kleo-sidebar-logo-wrap"><img src={Logo} alt="Kleoszalon" className="kleo-sidebar-logo" /></div>
          <div className="kleo-sidebar-brand"><div className="kleo-sidebar-title">Kleoszalon</div><div className="kleo-sidebar-subtitle">{language === "en" ? "HR workspace" : "HR felület"}</div></div>
        </div>
      </div>
      <nav className="kleo-sidebar-nav" aria-label={language === "en" ? "HR navigation" : "HR navigáció"}>
        <div style={sectionLabel}>{language === "en" ? "People and payroll" : "Munkatársak és munkaügy"}</div>
        <ul className="kleo-sidebar-menu"><Links items={HR_CORE_MENU} /></ul>
        <div style={sectionLabel}>{language === "en" ? "Development" : "Toborzás és fejlesztés"}</div>
        <ul className="kleo-sidebar-menu"><Links items={HR_DEVELOPMENT_MENU} /></ul>
      </nav>
    </aside>
  );
}

const sectionLabel: React.CSSProperties = {
  margin: "14px 14px 6px",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  opacity: 0.55,
};
