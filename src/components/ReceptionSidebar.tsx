import React from "react";
import { CalendarDays, ClipboardCheck, LayoutDashboard, Search, ShoppingBag, Sparkles, Users, WalletCards, type LucideIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../assets/kleo_logo.png";
import { useLanguage } from "../i18n/LanguageProvider";
import { menuLabel } from "../utils/menuLabels";
import SidebarCalendar from "./SidebarCalendar";

type ReceptionMenuItem = { label: string; to: string; icon: LucideIcon };

export const RECEPTION_DAILY_MENU: ReceptionMenuItem[] = [
  { label: "Irányítópult", to: "/", icon: LayoutDashboard },
  { label: "Naptár", to: "/appointments/calendar?mode=days", icon: CalendarDays },
  { label: "Új időpont", to: "/appointments/new", icon: CalendarDays },
  { label: "Vendégek", to: "/modules/customers/clients", icon: Users },
  { label: "Szolgáltatások", to: "/services", icon: Sparkles },
  { label: "Munkalap / elszámolás", to: "/workorders", icon: ClipboardCheck },
];

export const RECEPTION_SUPPORT_MENU: ReceptionMenuItem[] = [
  { label: "Új értékesítés", to: "/finance/product-sale", icon: ShoppingBag },
  { label: "Pénztár", to: "/finance/cashier", icon: WalletCards },
  { label: "Ellenőrzőlisták", to: "/knowledge-base/checklists", icon: ClipboardCheck },
];

function MenuLinks({ items }: { items: ReceptionMenuItem[] }) {
  const { language } = useLanguage();
  return <>{items.map(({ label, to, icon: Icon }) => (
    <li key={to} className="kleo-sidebar-menu-item">
      <NavLink
        to={to}
        end={to === "/"}
        className={({ isActive }) => `kleo-sidebar-menu-button kleo-sidebar-menu-link ${isActive ? "active" : ""}`}
      >
        <Icon className="kleo-sidebar-menu-icon" size={17} strokeWidth={1.8} />
        <span className="kleo-sidebar-menu-label">{menuLabel(label, language)}</span>
      </NavLink>
    </li>
  ))}</>;
}

export default function ReceptionSidebar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const selectDate = (date: Date) => {
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    navigate(`/appointments/calendar?mode=days&date=${value}`);
  };

  return (
    <aside className="kleo-sidebar app-sidebar">
      <div className="kleo-sidebar-hero-card">
        <div className="kleo-sidebar-header">
          <div className="kleo-sidebar-logo-wrap"><img src={Logo} alt="Kleoszalon" className="kleo-sidebar-logo" /></div>
          <div className="kleo-sidebar-brand">
            <div className="kleo-sidebar-title">Kleoszalon</div>
            <div className="kleo-sidebar-subtitle">{language === "en" ? "Reception workspace" : "Recepciós felület"}</div>
          </div>
        </div>
        <SidebarCalendar onSelectDate={selectDate} />
      </div>
      <nav className="kleo-sidebar-nav" aria-label={language === "en" ? "Reception navigation" : "Recepciós navigáció"}>
        <div style={sectionLabel}><Search size={13} /> {language === "en" ? "Daily workflow" : "Napi munka"}</div>
        <ul className="kleo-sidebar-menu"><MenuLinks items={RECEPTION_DAILY_MENU} /></ul>
        <div style={sectionLabel}>{language === "en" ? "Cash desk and operation" : "Pénztár és működés"}</div>
        <ul className="kleo-sidebar-menu"><MenuLinks items={RECEPTION_SUPPORT_MENU} /></ul>
      </nav>
    </aside>
  );
}

const sectionLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: "14px 14px 6px",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  opacity: 0.55,
};
