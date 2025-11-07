// src/pages/Home.tsx
import React, { useEffect, useState, useCallback } from "react";
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
import { withBase } from "../utils/apiBase";

type DashboardStats = {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  activeAppointments: number;
  lowStockCount: number;
};

type ChartPoint = { date: string; revenue: number };
type DashboardPayload = { stats?: DashboardStats; chartData?: ChartPoint[] };

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, authError } = useCurrentUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("kleo_token");
    localStorage.removeItem("kleo_role");
    localStorage.removeItem("kleo_location_id");
    localStorage.removeItem("kleo_location_name");
    localStorage.removeItem("kleo_full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Auth guard
  useEffect(() => {
    if (!userLoading && (authError || !user)) handleLogout();
  }, [userLoading, authError, user, handleLogout]);

  // Dashboard adatok betöltése
  useEffect(() => {
    if (!user || authError) return;

    (async () => {
      setLoadingStats(true);

      const token =
        localStorage.getItem("kleo_token") ||
        localStorage.getItem("token") ||
        "";

      if (!token) {
        handleLogout();
        return;
      }

      const params =
        (user as any)?.location_id != null
          ? `?location_id=${encodeURIComponent(String((user as any).location_id))}`
          : "";

      const url = withBase(`/api/dashboard${params}`);

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const text = await res.text();
        let data: DashboardPayload = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (res.status === 401 || res.status === 403) {
          console.warn("Dashboard: jogosultság/tokenszint hiba → logout");
          handleLogout();
          return;
        }
        if (!res.ok) {
          console.warn("Dashboard: váratlan státuszkód", res.status, text?.slice(0, 200));
        }

        setStats(
          data.stats ?? {
            dailyRevenue: 0,
            monthlyRevenue: 0,
            totalClients: 0,
            activeAppointments: 0,
            lowStockCount: 0,
          }
        );
        setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [user, authError, handleLogout]);

  if (userLoading || loadingStats) {
    return <div className="p-8 text-gray-500">Betöltés...</div>;
  }

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
          <div className="text-red-500">Nem sikerült betölteni az adatokat.</div>
        </main>
      </div>
    );
  }

  const fullName =
    (user as any)?.full_name ??
    (user as any)?.name ??
    (user as any)?.email ??
    "Felhasználó";
  const role = (user as any)?.role ?? "";
  const locationName = (user as any)?.location_name ?? "";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Fejléc */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-3xl font-semibold">Irányítópult</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {fullName} – {role}
              {locationName ? ` @ ${locationName}` : ""}
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
              {(stats.dailyRevenue ?? 0).toLocaleString()} Ft
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Havi bevétel</h3>
            <p className="text-2xl font-semibold mt-2">
              {(stats.monthlyRevenue ?? 0).toLocaleString()} Ft
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Vendégek</h3>
            <p className="text-2xl font-semibold mt-2">{stats.totalClients ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm">Aktív bejelentkezések</h3>
            <p className="text-2xl font-semibold mt-2">{stats.activeAppointments ?? 0}</p>
          </div>
        </div>

        {/* Grafikon */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Bevétel alakulása (7 nap)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Figyelmeztetések */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Figyelmeztetések és teendők</h3>
          <ul className="space-y-2 text-sm">
            {stats.lowStockCount > 0 ? (
              <li className="text-yellow-600">⚠ {stats.lowStockCount} termék készlete alacsony</li>
            ) : (
              <li className="text-green-500">✔ Minden termék készlete rendben</li>
            )}
            <li>📅 Közelgő időpontok: {stats.activeAppointments ?? 0}</li>
            <li>👥 Összes vendég: {stats.totalClients ?? 0}</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
