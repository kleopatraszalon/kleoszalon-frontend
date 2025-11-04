import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaCalendarAlt,
  FaCog,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons/lib";

interface Submenu {
  id: number;
  name: string;
  route: string;
}

interface Menu {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  submenus?: Submenu[];
}

// Menü ikonok
const iconMap: { [key: string]: IconType } = {
  user: FaUser,
  calendar: FaCalendarAlt,
  settings: FaCog,
};

// Chevron ikonok
const chevronMap: { [key: string]: IconType } = {
  down: FaChevronDown,
  right: FaChevronRight,
};

const Sidebar: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchMenus = async () => {
    if (!token) return;

    try {
      const response = await axios.get("http://localhost:5000/api/menus", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Backend válasz: { role: "user", menus: [], message: "..." }
      const data = response.data;
      const menuList: Menu[] = Array.isArray(data.menus) ? data.menus : [];
      setMenus(menuList);

      if (!menuList.length && data.message) {
        console.warn("Nem elérhető menüpont ehhez a szerepkörhöz:", data.message);
      }
    } catch (error) {
      console.error("❌ Menü betöltési hiba:", error);
      setMenus([]);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [token]);

  const handleMenuClick = (menu: Menu) => {
    if (menu.submenus && menu.submenus.length > 0) {
      setExpandedMenu(expandedMenu === menu.id ? null : menu.id);
    } else if (menu.route) {
      navigate(menu.route);
    }
  };

  const handleSubmenuClick = (route: string) => {
    navigate(route);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col shadow-lg">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        KLEO Szalon
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {menus.map((menu) => {
            const Icon = menu.icon ? iconMap[menu.icon] : null;
            const Chevron =
              menu.submenus && menu.submenus.length > 0
                ? expandedMenu === menu.id
                  ? chevronMap.down
                  : chevronMap.right
                : null;

            return (
              <li key={menu.id}>
                <button
                  onClick={() => handleMenuClick(menu)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    {Icon && <Icon />}
                    <span>{menu.name}</span>
                  </span>
                  {Chevron && <Chevron />}
                </button>

                <AnimatePresence>
                  {expandedMenu === menu.id && menu.submenus && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gray-800 overflow-hidden"
                    >
                      {menu.submenus.map((submenu) => (
                        <li key={submenu.id}>
                          <button
                            onClick={() => handleSubmenuClick(submenu.route)}
                            className="w-full text-left px-8 py-2 hover:bg-gray-700 transition-colors"
                          >
                            {submenu.name}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
