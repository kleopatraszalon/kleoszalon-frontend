// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DailyScheduleBoard from "../components/DailyScheduleBoard";

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

// 🔹 Ugyanaz mint Login.tsx-ben
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

interface DashboardStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  activeAppointments: number;
  lowStockCount: number;

  // 🔸 ÚJ mutatók a „Legfőbb mutatók” szekcióhoz
  totalRevenue?: number;             // teljes bevétel (választott időszakra)
  serviceRevenue?: number;           // szolgáltatásokból származó bevétel
  productRevenue?: number;           // termékértékesítésből származó bevétel
  averageInvoice?: number;           // átlagos számla (összes)
  averageServiceInvoice?: number;    // szolgáltatások átlagos számlája
  averageCapacity?: number;          // átlagos kapacitás (%)
}

// Pénz / % formázó segédfüggvények
const formatMoney = (value?: number) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toLocaleString()} Ft`
    : "–";

const formatPercent = (value?: number) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toFixed(1)} %`
    : "–";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 🔐 user adatok /api/me-ből
  const { user, loading: userLoading, authError } = useCurrentUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // dátum kiválasztás (napi beosztáshoz – most csak eltároljuk)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ date?: string }>;
      const iso = custom.detail?.date;
      if (!iso) return;
      setSelectedDate(new Date(iso));
      // itt hívhatod majd a napi beosztás lekérését:
      // loadDailySchedule(iso);
    };

    window.addEventListener("kleo:selectedDate", handler as EventListener);
    return () =>
      window.removeEventListener("kleo:selectedDate", handler as EventListener);
  }, []);

  // ⛔ KILÉPÉS
  const handleLogout = () => {
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

  // ha nincs jogosult user → logout
  useEffect(() => {
    if (!userLoading) {
      if (authError || !user) {
        handleLogout();
      }
    }
  }, [userLoading, authError, user]);

  // statisztikák lekérése, ha már van user
  useEffect(() => {
    if (!user || authError) return;

    const token =
      localStorage.getItem("token") || localStorage.getItem("kleo_token");

    if (!token) {
      // ha valamiért nincs token, ne hívjunk védett endpointot
      handleLogout();
      return;
    }

    const url = user.location_id
      ? `${API_BASE}/dashboard?location_id=${user.location_id}`
      : `${API_BASE}/dashboard`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
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
        setChartData(data.chartData || []); // 7 napos bevétel grafikonhoz
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, [user, authError]);

  // Betöltés közben – itt még nincs user, ezért nem hívjuk a Sidebart
  if (userLoading || loadingStats) {
    return (
      <div className="home-container app-shell app-shell--collapsed">
        <div className="calendar-container">
          <p>Betöltés...</p>
        </div>
      </div>
    );
  }

  // ha valami félrement
  if (!user || !stats) {
    return (
      <div className="home-container app-shell app-shell--collapsed">
        <Sidebar user={user} />
        <main className="calendar-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 600 }}>
                Irányítópult
              </h2>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.4rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Kilépés
            </button>
          </div>

          <div style={{ color: "#dc2626" }}>
            Nem sikerült betölteni az adatokat.
          </div>
        </main>
      </div>
    );
  }

  // 🔸 Oszlopdiagram adatok a szolgáltatás vs termék bontáshoz
  const revenueBreakdownData = [
    {
      name: "Szolgáltatások",
      amount: stats.serviceRevenue ?? 0,
    },
    {
      name: "Termékek",
      amount: stats.productRevenue ?? 0,
    },
  ];

  // NORMÁL RENDER – Sidebar jogosultsággal + Home.css layout
  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />

      <main className="calendar-container">
        {/* Fejléc */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 600 }}>
              Irányítópult
            </h2>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              {user.full_name} – {user.role}
              {user.location_name ? ` @ ${user.location_name}` : ""}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.4rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            Kilépés
          </button>
        </div>

        {/* Felső, „klasszikus” stat-kártyák */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div className="stat-card">
            <h3 className="stat-title">Napi bevétel</h3>
            <p className="stat-value">
              {stats.dailyRevenue.toLocaleString()} Ft
            </p>
          </div>

          <div className="stat-card">
            <h3 className="stat-title">Havi bevétel</h3>
            <p className="stat-value">
              {stats.monthlyRevenue.toLocaleString()} Ft
            </p>
          </div>

          <div className="stat-card">
            <h3 className="stat-title">Vendégek</h3>
            <p className="stat-value">{stats.totalClients}</p>
          </div>

          <div className="stat-card">
            <h3 className="stat-title">Aktív bejelentkezések</h3>
            <p className="stat-value">{stats.activeAppointments}</p>
          </div>
        </div>

        {/* ÚJ – Legfőbb mutatók (mint a képen) */}
        <section style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Legfőbb mutatók
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Bevétel – teljes */}
            <div className="stat-card">
              <h4 className="stat-title">Bevétel</h4>
              <p className="stat-value">
                {formatMoney(
                  stats.totalRevenue ?? stats.monthlyRevenue ?? stats.dailyRevenue
                )}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Teljes bevétel (időszakra)
              </p>
            </div>

            {/* Szolgáltatásokból származó bevétel */}
            <div className="stat-card">
              <h4 className="stat-title">Szolgáltatásokból származó bevétel</h4>
              <p className="stat-value">{formatMoney(stats.serviceRevenue)}</p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Teljes bevétel
              </p>
            </div>

            {/* Termékértékesítésből származó bevétel */}
            <div className="stat-card">
              <h4 className="stat-title">
                Termékértékesítésből származó bevétel
              </h4>
              <p className="stat-value">{formatMoney(stats.productRevenue)}</p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Teljes bevétel
              </p>
            </div>

            {/* Átlagos számla */}
            <div className="stat-card">
              <h4 className="stat-title">Átlagos számla</h4>
              <p className="stat-value">{formatMoney(stats.averageInvoice)}</p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Átlagos számla bejegyzésenként
              </p>
            </div>

            {/* Szolgáltatások átlagos számlája */}
            <div className="stat-card">
              <h4 className="stat-title">Szolgáltatások átlagos számlája</h4>
              <p className="stat-value">
                {formatMoney(stats.averageServiceInvoice)}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Átlagos számla bejegyzésenként
              </p>
            </div>

            {/* Átlagos kapacitás */}
            <div className="stat-card">
              <h4 className="stat-title">Átlagos kapacitás</h4>
              <p className="stat-value">
                {formatPercent(stats.averageCapacity)}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Átlagos napi kapacitás
              </p>
            </div>
          </div>
        </section>

        {/* Grafikonok: 7 napos bevétel + szolgáltatás/termék bontás */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
            gap: "1.5rem",
            marginBottom: "2rem",
            alignItems: "stretch",
          }}
        >
          <div className="chart-card">
            <h3 className="chart-title">Bevétel alakulása (7 nap)</h3>
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

          <div className="chart-card">
            <h3 className="chart-title">Bevétel forrás szerinti bontása</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Figyelmeztetések */}
        <div className="warnings-card">
          <h3 className="chart-title">Figyelmeztetések és teendők</h3>
          <ul style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {stats.lowStockCount > 0 ? (
              <li style={{ color: "#ca8a04", marginBottom: "0.2rem" }}>
                ⚠ {stats.lowStockCount} termék készlete alacsony
              </li>
            ) : (
              <li style={{ color: "#16a34a", marginBottom: "0.2rem" }}>
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
