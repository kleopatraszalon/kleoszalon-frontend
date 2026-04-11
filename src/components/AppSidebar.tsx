import React, { useMemo, useState } from "react";
import "../styles/kleo-sidebar.css";

export type SidebarMenuItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string | number;
};

export type SidebarMenuGroup = {
  key: string;
  title: string;
  defaultOpen?: boolean;
  items: SidebarMenuItem[];
};

export type SidebarQuickAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

export type SidebarCalendarDay = {
  day: number;
  muted?: boolean;
  active?: boolean;
  selected?: boolean;
  outlined?: boolean;
};

export type AppSidebarProps = {
  logoSrc?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  monthLabel?: string;
  weekdays?: string[];
  days?: SidebarCalendarDay[];
  quickActions?: SidebarQuickAction[];
  groups: SidebarMenuGroup[];
  bottomContent?: React.ReactNode;
  className?: string;
};

const defaultWeekdays = ["H", "K", "SZE", "CS", "P", "SZO", "V"];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`kleo-sidebar__chevron ${open ? "is-open" : ""}`}
    >
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="kleo-sidebar__menuIcon" aria-hidden="true">
      <path d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="kleo-sidebar__menuIcon" aria-hidden="true">
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 13v7M13 16.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DefaultQuickIcon() {
  return <GridIcon />;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  logoSrc = "/images/kleo_logo@2x.png",
  brandTitle = "Kleopátra",
  brandSubtitle = "Szépségszalonok",
  monthLabel = "2026 Április",
  weekdays = defaultWeekdays,
  days = [],
  quickActions = [],
  groups,
  bottomContent,
  className = "",
}) => {
  const initialState = useMemo(() => {
    const state: Record<string, boolean> = {};
    groups.forEach((group) => {
      state[group.key] = group.defaultOpen !== false;
    });
    return state;
  }, [groups]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialState);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runAction = (href?: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <aside className={`kleo-sidebar ${className}`.trim()}>
      <div className="kleo-sidebar__inner">
        <div className="kleo-sidebar__brand">
          <div className="kleo-sidebar__brandLogoWrap">
            <img src={logoSrc} alt={brandTitle} className="kleo-sidebar__brandLogo" />
          </div>
          <div className="kleo-sidebar__brandText">
            <div className="kleo-sidebar__brandTitle">{brandTitle}</div>
            <div className="kleo-sidebar__brandSubtitle">{brandSubtitle}</div>
          </div>
        </div>

        <div className="kleo-sidebar__calendarCard">
          <div className="kleo-sidebar__calendarHeader">
            <button type="button" className="kleo-sidebar__navBtn" aria-label="Előző hónap">
              ‹
            </button>
            <div className="kleo-sidebar__monthLabel">{monthLabel}</div>
            <button type="button" className="kleo-sidebar__navBtn" aria-label="Következő hónap">
              ›
            </button>
          </div>

          <div className="kleo-sidebar__weekdayRow">
            {weekdays.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="kleo-sidebar__dayGrid">
            {days.map((day, index) => (
              <button
                key={`${day.day}-${index}`}
                type="button"
                className={[
                  "kleo-sidebar__day",
                  day.muted ? "is-muted" : "",
                  day.active ? "is-active" : "",
                  day.selected ? "is-selected" : "",
                  day.outlined ? "is-outlined" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day.day}
              </button>
            ))}
          </div>
        </div>

        {quickActions.length > 0 && (
          <div className="kleo-sidebar__quickGrid">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className="kleo-sidebar__quickAction"
                onClick={() => runAction(action.href, action.onClick)}
              >
                <span className="kleo-sidebar__quickIcon">{action.icon || <DefaultQuickIcon />}</span>
                <span className="kleo-sidebar__quickLabel">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="kleo-sidebar__scrollArea">
          {groups.map((group) => {
            const isOpen = openGroups[group.key] ?? true;
            return (
              <div key={group.key} className="kleo-sidebar__menuCard">
                <button type="button" className="kleo-sidebar__groupHeader" onClick={() => toggleGroup(group.key)}>
                  <span>{group.title}</span>
                  <Chevron open={isOpen} />
                </button>

                {isOpen && (
                  <div className="kleo-sidebar__groupBody">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`kleo-sidebar__menuItem ${item.active ? "is-active" : ""}`}
                        onClick={() => runAction(item.href, item.onClick)}
                      >
                        <span className="kleo-sidebar__menuItemIcon">{item.icon || <CalendarIcon />}</span>
                        <span className="kleo-sidebar__menuItemLabel">{item.label}</span>
                        {item.badge !== undefined && item.badge !== null ? (
                          <span className="kleo-sidebar__menuBadge">{item.badge}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {bottomContent ? <div className="kleo-sidebar__bottom">{bottomContent}</div> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
