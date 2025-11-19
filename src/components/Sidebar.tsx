// src/components/Sidebar.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import Logo from "../assets/kleo_logo.png";
import SidebarCalendar from "./SidebarCalendar";

// API alap URL (ugyanaz a logika, mint máshol)
const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-jon.onrender.com/api";

interface RawMenuItem {
  id: number;
  name: string;
  icon?: string | null;
  route?: string | null;
  parent_id?: number | null;
  required_role?: string | null;
  order_index?: number | null;
  submenus?: RawMenuItem[];
}

interface MenuItem {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  children: MenuItem[];
}

interface SidebarProps {
  user?: { role?: string | null } | null;
}

/** Mindig abszolút útvonalat csinál: "employees" -> "/employees" */
function normalizeRoute(r?: string): string {
  if (!r) return "#";
  let s = r.trim();
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\/{2,}/g, "/"); // dupla perjelek kiszedése
  return s;
}

/** Egyszerű menükomponens más oldalakhoz (opcionális felhasználásra) */
export function Menu({
  items,
}: {
  items: Array<{ id: number; name: string; route?: string; icon?: string }>;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const to = normalizeRoute(it.route);
        const isDisabled = to === "#";
        return (
          <NavLink
            key={it.id}
            to={to}
            className={({ isActive }) =>
              "px-3 py-2 rounded " +
              (isActive ? "bg-black text-white" : "hover:bg-gray-100") +
              (isDisabled ? " pointer-events-none opacity-50" : "")
            }
            aria-disabled={isDisabled}
          >
            {it.name}
          </NavLink>
        );
      })}
    </nav>
  );
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const navigate = useNavigate();

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [openIds, setOpenIds] = useState<number[]>([]);

  // Menü betöltése az API-ból
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("kleo_token");

    axios
      .get(`${API_BASE}/menus`, {
        withCredentials: true,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? (res.data as RawMenuItem[]) : [];
        const role = (user && (user as any).role) || null;
        const built = buildMenuTree(data, role);
        setMenus(built);
      })
      .catch((err) => console.error("❌ Menü betöltési hiba:", err));
  }, [user]);

  const isExpanded = (id: number) => openIds.includes(id);

  const toggleExpanded = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Mini naptár: később a napi beosztást erre a dátumra fogjuk betölteni
  const handleDateSelect = (date: Date) => {
    const iso = date.toISOString().slice(0, 10); // pl. 2025-11-05

    // elmentjük, hogy a Home / naptár oldal el tudja olvasni
    localStorage.setItem("kleo.selectedDate", iso);

    // custom event – tetszőleges komponens fel tud iratkozni rá
    window.dispatchEvent(
      new CustomEvent("kleo:selectedDate", {
        detail: { date: iso },
      })
    );
  };

  return (
    <aside className="kleo-sidebar app-sidebar">
      {/* Hero kártya: logó + mini naptár */}
      <div className="kleo-sidebar-hero-card">
        <div className="kleo-sidebar-header">
          <div className="kleo-sidebar-logo-wrap">
            <img
              src={Logo}
              alt="Kleopátra Szépségszalonok logó"
              className="kleo-sidebar-logo"
            />
          </div>
          <div className="kleo-sidebar-brand">
            <div className="kleo-sidebar-title">Kleoszalon</div>
            <div className="kleo-sidebar-subtitle">Admin felület</div>
          </div>
        </div>

        <SidebarCalendar onSelectDate={handleDateSelect} />
      </div>

      {/* MENÜLISTA */}
      <nav className="kleo-sidebar-nav">
        <ul className="kleo-sidebar-menu">
          {menus.map((menu) => {
            const hasChildren = menu.children.length > 0;
            const expanded = isExpanded(menu.id);

            return (
              <li
                key={menu.id}
                className={
                  "kleo-sidebar-menu-item" +
                  (expanded ? " kleo-sidebar-menu-item--open" : "")
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    menu.children && menu.children.length
                      ? toggleExpanded(menu.id)
                      : navigate(normalizeRoute(menu.route))
                  }
                  className="kleo-sidebar-menu-button"
                >
                  <span className="kleo-sidebar-menu-label">{menu.name}</span>

                  {hasChildren && (
                    <span className="kleo-sidebar-menu-chevron">
                      {expanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  )}
                </button>

                {hasChildren && expanded && (
                  <ul className="kleo-sidebar-submenu">
                    {menu.children.map((child) => {
                      const to = normalizeRoute(child.route);
                      const isDisabled = to === "#";
                      return (
                        <li key={child.id}>
                          <NavLink
                            to={to}
                            className={({ isActive }) =>
                              "kleo-sidebar-submenu-item" +
                              (isActive ? " active" : "") +
                              (isDisabled
                                ? " pointer-events-none opacity-50"
                                : "")
                            }
                            aria-disabled={isDisabled}
                          >
                            {child.name}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

/**
 * Menüfa építése:
 * - ha már hierarchikus (submenus), azt használjuk
 * - ha lapos (parent_id), abból építünk fát
 * - required_role alapján szűrünk, hogy role-hoz kötött menük legyenek
 */
function buildMenuTree(raw: RawMenuItem[], role: string | null): MenuItem[] {
  if (!raw.length) return [];

  function canSee(
    required: string | null | undefined,
    role: string | null
  ): boolean {
    const req = (required || "").trim().toLowerCase();
    if (!req || req === "all" || req === "*") return true;
    if (!role) return false;
    const r = String(role).toLowerCase();
    if (r === "admin") return true;
    return req === r;
  }

  // role alapú szűrés – 'all' és '*' bárki, admin mindent lát
  const filtered = raw.filter((item) => canSee(item.required_role, role));

  // Ha már hierarchikus (submenus)
  if (filtered.length && Array.isArray(filtered[0].submenus)) {
    const sortFn = (a: RawMenuItem, b: RawMenuItem) =>
      (a.order_index ?? 9999) - (b.order_index ?? 9999);

    const normalize = (item: RawMenuItem): MenuItem => ({
      id: item.id,
      name: item.name,
      icon: item.icon ?? undefined,
      route: item.route ?? undefined,
      children: (item.submenus || []).sort(sortFn).map(normalize),
    });

    return filtered.sort(sortFn).map(normalize);
  }

  // Lapos lista parent_id-vel
  const orderIndex: Record<number, number> = {};
  filtered.forEach((item) => {
    orderIndex[item.id] = item.order_index ?? 9999;
  });

  type InternalNode = MenuItem & { parent_id: number | null };

  const byId = new Map<number, InternalNode>();

  filtered.forEach((item) => {
    byId.set(item.id, {
      id: item.id,
      name: item.name,
      icon: item.icon ?? undefined,
      route: item.route ?? undefined,
      parent_id: item.parent_id ?? null,
      children: [],
    });
  });

  const roots: InternalNode[] = [];

  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      const parent = byId.get(node.parent_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFnNode = (a: MenuItem, b: MenuItem) =>
    (orderIndex[a.id] ?? 9999) - (orderIndex[b.id] ?? 9999);

  const normalizeNode = (node: InternalNode): MenuItem => ({
    id: node.id,
    name: node.name,
    icon: node.icon,
    route: node.route,
    children: node.children
      .sort(sortFnNode)
      .map((child) => normalizeNode(child as InternalNode)),
  });

  return roots.sort(sortFnNode).map(normalizeNode);
}

export default Sidebar;
