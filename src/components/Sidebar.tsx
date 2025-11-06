import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import Logo from "../assets/kleo_logo.png";

interface SubMenu {
  id: number;
  name: string;
  route?: string;
}

interface Menu {
  id: number;
  name: string;
  icon?: string;
  route?: string;
  submenus: SubMenu[];
}

// 🔧 Dinamikus backend URL (Render vagy localhost)
const API_BASE_URL =
  (window as any).VITE_API_BASE_URL ||
  (window.location.hostname.includes("localhost")
    ? "http://localhost:5000"
    : "https://kleoszalon-api.onrender.com");

const Sidebar: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get<Menu[]>(`${API_BASE_URL}/api/menus`)
      .then((res) => setMenus(res.data))
      .catch((err) => console.error("❌ Menü betöltési hiba:", err));
  }, []);

  const handleMenuClick = (menu: Menu) => {
    if (menu.submenus && menu.submenus.length > 0) {
      setOpenMenu(openMenu === menu.id ? null : menu.id);
      return;
    }

    if (menu.route) {
      navigate(menu.route);
    }
  };

  const handleSubMenuClick = (sub: SubMenu) => {
    if (sub.route) {
      navigate(sub.route);
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col shadow-lg">
      {/* Logo */}
      <div className="flex justify-center p-4 border-b border-gray-700">
        <img src={Logo} alt="Kleo Logo" className="h-12 w-auto" />
      </div>

      {/* Fő cím */}
      <div className="p-4 text-2xl font-bold border-b border-gray-700 text-center">
        Kleo Szalon
      </div>

      {/* Menülista */}
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {menus.map((menu) => (
            <li key={menu.id} className="border-b border-gray-800">
              <button
                onClick={() => handleMenuClick(menu)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition text-left"
              >
                <span className="flex items-center gap-2">
                  <span>{menu.name}</span>
                </span>

                {menu.submenus.length > 0 &&
                  (openMenu === menu.id ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  ))}
              </button>

              {openMenu === menu.id && menu.submenus.length > 0 && (
                <ul className="bg-gray-800">
                  {menu.submenus.map((sub) => (
                    <li
                      key={sub.id}
                      className="px-6 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                      onClick={() => handleSubMenuClick(sub)}
                    >
                      {sub.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
