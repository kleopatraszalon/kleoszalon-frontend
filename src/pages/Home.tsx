import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useCurrentUser } from "../hooks/useCurrentUser";

import Modal from "react-modal";
Modal.setAppElement("#root");

interface DashboardStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  activeAppointments: number;
  lowStockCount: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 🔐 user adatok betöltése /api/me-ből
  const { user, loading: userLoading, authError } = useCurrentUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  // ⛔ KILÉPÉS
  const handleLogout = () => {
    // mindent takarítunk, ami auth-related
    localStorage.removeItem("token");
    localStorage.removeItem("kleo_token");
    localStorage.removeItem("kleo_role");
    localStorage.removeItem("kleo_location_id");
    localStorage.removeItem("kleo_location_name");
    localStorage.removeItem("kleo_full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  // ha nincs token vagy hiba van az auth-ban → login
  useEffect(() => {
    if (!userLoading) {
      if (authError || !user) {
        handleLogout();
      }
    }
    // fontos: ha még töltünk, ne logoutoljunk azonnal,
    // csak ha már biztosan nincs user
  }, [userLoading, authError, user]);

  // statisztikák lekérése, miután már tudjuk a usert
  useEffect(() => {
    if (!user || authError) return;

    const token = localStorage.getItem("token");

    // ha több telephely van: a user.location_id alapján kérjük a dashboardot
    const url = user.location_id
      ? `http://localhost:5000/api/dashboard?location_id=${user.location_id}`
      : `http://localhost:5000/api/dashboard`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          console.warn("Dashboard auth error / token lejárt?");
          handleLogout();
          return;
        }

        setStats(data.stats || null);
        setChartData(data.chartData || []);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, [user, authError]); // csak akkor fut le, ha van user

  // betöltés közbeni állapot
  if (userLoading || loadingStats) {
    return (
      <div className="p-8 text-gray-500">
        Betöltés...
      </div>
    );
  }

  // ha valami nagyon félrement
  if (!user || !stats) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-3xl font-semibold">Irányítópult</h2>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
            >
              Kilépés
            </button>
          </div>

          <div className="text-red-500">
            Nem sikerült betölteni az adatokat.
          </div>
        </main>
      </div>
    );
  }

  // normál render
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Fejléc + Kilépés gomb */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-3xl font-semibold">
              Irányítópult
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.full_name} – {user.role}
              {user.location_name ? ` @ ${user.location_name}` : ""}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow self-start"
          >
            Kilépés
          </button>
        </div>

        {/* Statisztikai kártyák */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Napi bevétel</h3>
            <p className="text-2xl font-semibold mt-2">
              {stats.dailyRevenue.toLocaleString()} Ft
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Havi bevétel</h3>
            <p className="text-2xl font-semibold mt-2">
              {stats.monthlyRevenue.toLocaleString()} Ft
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Vendégek</h3>
            <p className="text-2xl font-semibold mt-2">
              {stats.totalClients}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Aktív bejelentkezések</h3>
            <p className="text-2xl font-semibold mt-2">
              {stats.activeAppointments}
            </p>
          </div>
        </div>

        {/* Grafikon */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Bevétel alakulása (7 nap)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Figyelmeztetések */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Figyelmeztetések és teendők
          </h3>
          <ul className="space-y-2 text-sm">
            {stats.lowStockCount > 0 ? (
              <li className="text-yellow-600">
                ⚠ {stats.lowStockCount} termék készlete alacsony
              </li>
            ) : (
              <li className="text-green-500">
                ✔ Minden termék készlete rendben
              </li>
            )}
            <li>📅 Közelgő időpontok: {stats.activeAppointments}</li>
            <li>👥 Összes vendég: {stats.totalClients}</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
