// src/components/Sidebar.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import Logo from "../assets/kleo_logo.png";
import "./Sidebar.css";

// Olyan, mint a DB-ben: id, name, icon, route, parent_id, required_role, order_index
interface RawMenuItem {
  id: number;
  name: string;
  icon?: string | null;
  route?: string | null;
  parent_id?: number | null;
  required_role?: string | null;
  order_index?: number | null;
  submenus?: RawMenuItem[]; // ha a backend már így küldi
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

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/menus", { withCredentials: true })
      .then((res) => {
        const data = Array.isArray(res.data) ? (res.data as RawMenuItem[]) : [];

        const role = (user && (user as any).role) || null;
        const built = buildMenuTree(data, role);
        setMenus(built);
      })
      .catch((err) => console.error("❌ Menü betöltési hiba:", err));
  }, [user]);

  const isOpen = (id: number) => openIds.includes(id);

  const toggleOpen = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // FŐMENÜ – ha van gyerek, csak lenyit, ha nincs gyerek, route-ra lép
  const handleTopClick = (menu: MenuItem) => {
    const hasChildren = menu.children.length > 0;

    if (hasChildren) {
      // főmenü csak nyit/zár, NEM navigál
      toggleOpen(menu.id);
      return;
    }

    if (menu.route) {
      navigate(menu.route);
    }
  };

  const handleChildClick = (item: MenuItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <aside className="kleo-sidebar">
      {/* LOGÓ + FELIRAT KÖZÉPEN */}
      <div className="kleo-sidebar-header">
        <div className="kleo-sidebar-logo-wrap">
          <img src={Logo} alt="Kleoszalon logó" className="kleo-sidebar-logo" />
        </div>
        <div className="kleo-sidebar-brand">
          <div className="kleo-sidebar-title">Kleoszalon</div>
          <div className="kleo-sidebar-subtitle">Admin felület</div>
        </div>
      </div>

      {/* MENÜLISTA */}
      <nav className="kleo-sidebar-nav">
        <ul className="kleo-sidebar-menu">
          {menus.map((menu) => {
            const hasChildren = menu.children.length > 0;
            const open = isOpen(menu.id);

            return (
              <li
                key={menu.id}
                className={
                  "kleo-sidebar-menu-item" +
                  (open ? " kleo-sidebar-menu-item--open" : "")
                }
              >
                <button
                  type="button"
                  onClick={() => handleTopClick(menu)}
                  className="kleo-sidebar-menu-button"
                >
                  <span className="kleo-sidebar-menu-label">{menu.name}</span>

                  {hasChildren && (
                    <span className="kleo-sidebar-menu-chevron">
                      {open ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  )}
                </button>

                {hasChildren && open && (
                  <ul className="kleo-sidebar-submenu">
                    {menu.children.map((child) => (
                      <li
                        key={child.id}
                        className="kleo-sidebar-submenu-item"
                        onClick={() => handleChildClick(child)}
                      >
                        {child.name}
                      </li>
                    ))}
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
 * - ha lapos (parent_id alapján), abból építünk fát
 * - required_role alapján opcionálisan szűrünk
 */
function buildMenuTree(raw: RawMenuItem[], role: string | null): MenuItem[] {
  if (!raw.length) return [];

  const filtered = raw.filter((item) => {
    const req = (item.required_role || "").trim();
    if (!req) return true;
    if (!role) return false;
    return String(role).toLowerCase() === req.toLowerCase();
  });

  // ha a backend submenus-szal küldi
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

  // LAPOS LISTA -> fa parent_id alapján
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
    children: node.children.sort(sortFnNode).map((child) =>
      normalizeNode(child as InternalNode)
    ),
  });

  return roots.sort(sortFnNode).map(normalizeNode);
}

export default Sidebar;
