// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpenText,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Database,
  Gift,
  Globe2,
  GripVertical,
  LayoutDashboard,
  Megaphone,
  MonitorSmartphone,
  PlugZap,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Logo from "../assets/kleo_logo.png";
import SidebarCalendar from "./SidebarCalendar";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

interface RawMenuItem {
  id: number;
  name: string;
  icon?: string | null;
  route?: string | null;
  parent_id?: number | null;
  required_role?: string | null;
  role?: string | null;
  code?: string | null;
  feature_key?: string | null;
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
  user?: { role?: string | string[] | null } | null;
}

const menuIcons: Record<string, LucideIcon> = {
  LayoutDashboard, CalendarDays, Users, Gift, UserCog, WalletCards, Boxes,
  ChartNoAxesCombined, Building2, Megaphone, Globe2, ShoppingBag,
  MonitorSmartphone, PlugZap, Settings, ClipboardCheck, BookOpenText, Database,
};

function MenuIcon({ name }: { name?: string }) {
  const Icon = (name && menuIcons[name]) || Circle;
  return <Icon className="kleo-sidebar-menu-icon" size={17} strokeWidth={1.8} aria-hidden="true" />;
}

function normalizeRoute(r?: string): string {
  if (!r) return "#";
  let s = r.trim();
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\/{2,}/g, "/");
  return s;
}

function routePath(r?: string): string {
  const normalized = normalizeRoute(r);
  return normalized === "#" ? "#" : normalized.split(/[?#]/, 1)[0];
}

function roleList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((x) => x.toLowerCase());
  try {
    const parsed = JSON.parse(String(raw || ""));
    if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.toLowerCase());
  } catch {}
  return String(raw || "").split(",").map((x) => x.replace(/[\[\]"]/g, "").trim().toLowerCase()).filter(Boolean);
}

export function Menu({ items }: { items: Array<{ id: number; name: string; route?: string; icon?: string }> }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const to = normalizeRoute(it.route);
        const isDisabled = to === "#";
        return (
          <NavLink key={it.id} to={to} className={({ isActive }) =>
            "px-3 py-2 rounded " + (isActive ? "bg-black text-white" : "hover:bg-gray-100") +
            (isDisabled ? " pointer-events-none opacity-50" : "")
          } aria-disabled={isDisabled}>{it.name}</NavLink>
        );
      })}
    </nav>
  );
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const isAdmin = useMemo(() => roleList(user?.role).includes("admin"), [user?.role]);

  async function loadMenus() {
    const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
    const res = await axios.get(`${API_BASE}/menus`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = Array.isArray(res.data) ? (res.data as RawMenuItem[]) : [];
    setMenus(buildMenuTree(data, user?.role || null));
  }

  useEffect(() => {
    loadMenus().catch((err) => console.error("❌ Menü betöltési hiba:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isExpanded = (id: number) => openIds.includes(id);
  const toggleExpanded = (id: number) => {
    setOpenIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    const activeParents: number[] = [];
    function walk(items: MenuItem[], parentIds: number[] = []) {
      for (const item of items) {
        const nextParents = [...parentIds, item.id];
        if (item.route && routePath(item.route) === location.pathname) activeParents.push(...parentIds);
        if (item.children.length) walk(item.children, nextParents);
      }
    }
    walk(menus);
    if (activeParents.length) setOpenIds((prev) => Array.from(new Set([...prev, ...activeParents])));
  }, [menus, location.pathname, location.search]);

  const handleDateSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    localStorage.setItem("kleo.selectedDate", iso);
    window.dispatchEvent(new CustomEvent("kleo:selectedDate", { detail: { date: iso } }));
    navigate(`/appointments/calendar?date=${encodeURIComponent(iso)}`);
  };

  async function reorderRoots(targetId: number) {
    if (!isAdmin || draggedId == null || draggedId === targetId || savingOrder) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const previous = menus;
    const from = previous.findIndex((m) => m.id === draggedId);
    const to = previous.findIndex((m) => m.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...previous];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setMenus(next);
    setDraggedId(null);
    setDragOverId(null);
    setSavingOrder(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
      await axios.put(`${API_BASE}/menus/reorder-roots`, { ordered_ids: next.map((m) => m.id) }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      setMenus(previous);
      console.error("❌ Menü sorrend mentési hiba:", err);
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <aside className="kleo-sidebar app-sidebar">
      <div className="kleo-sidebar-hero-card">
        <div className="kleo-sidebar-header">
          <div className="kleo-sidebar-logo-wrap"><img src={Logo} alt="Kleopátra Szépségszalonok logó" className="kleo-sidebar-logo" /></div>
          <div className="kleo-sidebar-brand"><div className="kleo-sidebar-title">Kleoszalon</div><div className="kleo-sidebar-subtitle">Admin felület</div></div>
        </div>
        <SidebarCalendar onSelectDate={handleDateSelect} />
      </div>

      {isAdmin && (
        <div className="kleo-menu-sort-hint">
          <GripVertical size={13}/><span>Főmenük húzással rendezhetők</span>{savingOrder && <b>Mentés…</b>}
        </div>
      )}

      <nav className="kleo-sidebar-nav">
        <ul className="kleo-sidebar-menu">
          {menus.map((menu) => {
            const hasChildren = menu.children.length > 0;
            const expanded = isExpanded(menu.id);
            const to = normalizeRoute(menu.route);
            const isLeafActive = !hasChildren && to !== "#" && routePath(to) === location.pathname;
            return (
              <li
                key={menu.id}
                draggable={isAdmin && !savingOrder}
                onDragStart={(e) => { if (!isAdmin) return; setDraggedId(menu.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { if (!isAdmin) return; e.preventDefault(); setDragOverId(menu.id); e.dataTransfer.dropEffect = "move"; }}
                onDragLeave={() => { if (dragOverId === menu.id) setDragOverId(null); }}
                onDrop={(e) => { e.preventDefault(); void reorderRoots(menu.id); }}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                className={"kleo-sidebar-menu-item" + (expanded ? " kleo-sidebar-menu-item--open" : "") + (isLeafActive ? " kleo-sidebar-menu-item--active" : "") + (draggedId === menu.id ? " is-dragging" : "") + (dragOverId === menu.id ? " is-drag-over" : "")}
              >
                {hasChildren ? (
                  <button type="button" onClick={() => toggleExpanded(menu.id)} className="kleo-sidebar-menu-button">
                    {isAdmin && <GripVertical className="kleo-menu-drag-handle" size={14}/>}<MenuIcon name={menu.icon} /><span className="kleo-sidebar-menu-label">{menu.name}</span>
                    <span className="kleo-sidebar-menu-chevron">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  </button>
                ) : (
                  <NavLink to={to} className={({ isActive }) => "kleo-sidebar-menu-button kleo-sidebar-menu-link" + (isActive ? " active" : "") + (to === "#" ? " pointer-events-none opacity-50" : "")} aria-disabled={to === "#"}>
                    {isAdmin && <GripVertical className="kleo-menu-drag-handle" size={14}/>}<MenuIcon name={menu.icon} /><span className="kleo-sidebar-menu-label">{menu.name}</span>
                  </NavLink>
                )}
                {hasChildren && expanded && (
                  <ul className="kleo-sidebar-submenu">
                    {menu.children.map((child) => {
                      const childTo = normalizeRoute(child.route);
                      const isDisabled = childTo === "#";
                      const active = routePath(childTo) === location.pathname && (!childTo.includes("?") || childTo.split("?")[1] === location.search.replace(/^\?/, ""));
                      return <li key={child.id}><NavLink to={childTo} className={() => "kleo-sidebar-submenu-item" + (active ? " active" : "") + (isDisabled ? " pointer-events-none opacity-50" : "")} aria-disabled={isDisabled}>{child.name}</NavLink></li>;
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

function buildMenuTree(raw: RawMenuItem[], role: string | string[] | null): MenuItem[] {
  if (!raw.length) return [];
  function canSee(required: string | null | undefined, currentRole: string | string[] | null): boolean {
    const req = (required || "").trim().toLowerCase();
    if (!req || req === "all" || req === "*") return true;
    const roles = roleList(currentRole);
    if (roles.includes("admin")) return true;
    return roles.includes(req);
  }
  const filtered = raw.filter((item) => canSee(item.required_role, role));
  if (filtered.length && Array.isArray(filtered[0].submenus)) {
    const sortFn = (a: RawMenuItem, b: RawMenuItem) => (a.order_index ?? 9999) - (b.order_index ?? 9999);
    const normalize = (item: RawMenuItem): MenuItem => ({ id: item.id, name: item.name, icon: item.icon ?? undefined, route: item.route ?? undefined, children: (item.submenus || []).sort(sortFn).map(normalize) });
    return filtered.sort(sortFn).map(normalize);
  }
  const orderIndex: Record<number, number> = {};
  filtered.forEach((item) => { orderIndex[item.id] = item.order_index ?? 9999; });
  type InternalNode = MenuItem & { parent_id: number | null };
  const byId = new Map<number, InternalNode>();
  filtered.forEach((item) => byId.set(item.id, { id: item.id, name: item.name, icon: item.icon ?? undefined, route: item.route ?? undefined, parent_id: item.parent_id ?? null, children: [] }));
  const roots: InternalNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) byId.get(node.parent_id)!.children.push(node);
    else roots.push(node);
  });
  const sortFnNode = (a: MenuItem, b: MenuItem) => (orderIndex[a.id] ?? 9999) - (orderIndex[b.id] ?? 9999);
  const normalizeNode = (node: InternalNode): MenuItem => ({ id: node.id, name: node.name, icon: node.icon, route: node.route, children: node.children.sort(sortFnNode).map((child) => normalizeNode(child as InternalNode)) });
  return roots.sort(sortFnNode).map(normalizeNode);
}

export default Sidebar;
