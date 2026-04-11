import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { getCurrentUser, type CurrentUser } from "../api/me";
import { getLocations } from "../api/locations";
import {
  getVirDashboard,
  getVirRevenueSeries,
  type VirDashboardSummary,
  type VirRevenueRow,
} from "../api/vir";
import "../styles/vir-altegio.css";

type LocationRow = {
  id: string | number;
  name: string;
};

type PeriodKey = "week" | "month" | "custom";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPeriodDates(period: Exclude<PeriodKey, "custom">): { from: string; to: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);

  if (period === "week") {
    start.setDate(end.getDate() - 29);
  } else {
    start.setDate(end.getDate() - 29);
  }

  return { from: isoDate(start), to: isoDate(end) };
}

function formatHuf(value: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function shortHuf(value: number): string {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M Ft`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K Ft`;
  return `${Math.round(n)} Ft`;
}

function pct(value: number): string {
  return `${(value || 0).toFixed(0)}%`;
}

function deltaLabel(current: number, previous: number) {
  if (!previous) return { text: "új", positive: current >= 0 };
  const diff = ((current - previous) / previous) * 100;
  const rounded = Math.round(diff);
  return {
    text: `${rounded > 0 ? "+" : ""}${rounded}%`,
    positive: rounded >= 0,
  };
}

function normalizeLocationId(
  value: string | number | null | undefined
): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

function metricCard(
  title: string,
  value: string,
  sub: string,
  delta?: { text: string; positive: boolean }
) {
  return (
    <div className="altegio-metric-card">
      <div className="altegio-metric-card__title">{title}</div>
      <div className="altegio-metric-card__value">{value}</div>
      <div className="altegio-metric-card__sub">{sub}</div>
      {delta ? (
        <div
          className={`altegio-metric-card__delta ${
            delta.positive ? "is-positive" : "is-negative"
          }`}
        >
          {delta.text}
        </div>
      ) : null}
    </div>
  );
}

export default function VirTopMetricsPage() {
  const initial = getPeriodDates("month");

  const [period, setPeriod] = useState<PeriodKey>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [locationId, setLocationId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [summary, setSummary] = useState<VirDashboardSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<VirDashboardSummary | null>(null);
  const [series, setSeries] = useState<VirRevenueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user ?? null))
      .catch(() => setCurrentUser(null));

    getLocations()
      .then((rows: any[]) => {
        setLocations(
          (rows || []).map((loc) => ({
            id: loc.id,
            name: loc.name,
          }))
        );
      })
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    if (period === "custom") return;
    const next = getPeriodDates(period === "week" ? "week" : "month");
    setFrom(next.from);
    setTo(next.to);
  }, [period]);

  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      const user = currentUser;
      if (!user) return;

      try {
        setLoading(true);
        setError("");

        const effectiveLocationId =
          user.role === "admin"
            ? normalizeLocationId(locationId || undefined)
            : normalizeLocationId(user.location_id);

        const start = new Date(from);
        const end = new Date(to);
        const diffDays =
          Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

        const prevTo = new Date(start);
        prevTo.setDate(prevTo.getDate() - 1);

        const prevFrom = new Date(prevTo);
        prevFrom.setDate(prevFrom.getDate() - (diffDays - 1));

        const common: { from?: string; to?: string; locationId?: string } = {
          from,
          to,
          locationId: effectiveLocationId,
        };

        const prevCommon: { from?: string; to?: string; locationId?: string } = {
          from: isoDate(prevFrom),
          to: isoDate(prevTo),
          locationId: effectiveLocationId,
        };

        const [summaryData, prevSummaryData, seriesData] = await Promise.all([
          getVirDashboard(common),
          getVirDashboard(prevCommon),
          getVirRevenueSeries(common),
        ]);

        setSummary(summaryData);
        setPrevSummary(prevSummaryData);
        setSeries(seriesData);
      } catch (e: any) {
        setError(e?.message || "A legfőbb mutatók betöltése sikertelen.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser, from, to, locationId]);

  const chartData = useMemo(
    () =>
      series.map((row) => ({
        day: row.day?.slice(5) || "",
        revenue: Number(row.revenue_total || 0),
        paid: Number(row.paid_total || 0),
        appointments: Number(row.appointments_count || 0),
      })),
    [series]
  );

  const totalRevenue = Number(summary?.revenue_total || 0);
  const paidTotal = Number(summary?.paid_total || 0);
  const appointmentsCount = Number(summary?.appointments_count || 0);
  const completedCount = Number(summary?.completed_count || 0);
  const cancelledCount = Number(summary?.cancelled_count || 0);
  const noShowCount = Number(summary?.no_show_count || 0);
  const avgBasket = Number(summary?.avg_basket || 0);

  const estimatedServiceRevenue = totalRevenue;
  const estimatedProductRevenue = Math.max(0, paidTotal - totalRevenue);
  const uniqueClients = completedCount;
  const totalVisits = appointmentsCount;
  const occupancyApprox =
    appointmentsCount > 0
      ? Math.min(100, Math.round((completedCount / appointmentsCount) * 100))
      : 0;
  const lostBookings = cancelledCount + noShowCount;

  const revenueDelta = deltaLabel(
    totalRevenue,
    Number(prevSummary?.revenue_total || 0)
  );
  const appointmentDelta = deltaLabel(
    appointmentsCount,
    Number(prevSummary?.appointments_count || 0)
  );
  const avgBasketDelta = deltaLabel(
    avgBasket,
    Number(prevSummary?.avg_basket || 0)
  );
  const uniqueClientDelta = deltaLabel(
    uniqueClients,
    Number(prevSummary?.completed_count || 0)
  );
  const totalVisitsDelta = deltaLabel(
    totalVisits,
    Number(prevSummary?.appointments_count || 0)
  );
  const occupancyDelta = deltaLabel(
    occupancyApprox,
    Math.round(
      (Number(prevSummary?.completed_count || 0) /
        Math.max(1, Number(prevSummary?.appointments_count || 0))) *
        100
    )
  );

  return (
    <div className="altegio-main" style={{ padding: 20 }}>
      <div className="altegio-breadcrumb">Kimutatások</div>

      <div className="altegio-header">
        <div>
          <h1>Legfőbb mutatók</h1>
        </div>
      </div>

      <div className="altegio-filterbar">
        <div className="altegio-filter-field">
          <label>Időszak</label>
          <div className="altegio-header__actions">
            <button
              className={`altegio-tab ${period === "week" ? "is-active" : ""}`}
              onClick={() => setPeriod("week")}
              type="button"
            >
              30 nap
            </button>

            <button
              className={`altegio-tab ${period === "month" ? "is-active" : ""}`}
              onClick={() => setPeriod("month")}
              type="button"
            >
              Kiválasztott 30 nap
            </button>

            <button
              className={`altegio-tab ${period === "custom" ? "is-active" : ""}`}
              onClick={() => setPeriod("custom")}
              type="button"
            >
              Saját
            </button>
          </div>
        </div>

        <div className="altegio-filter-field">
          <label>-tól</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setPeriod("custom");
              setFrom(e.target.value);
            }}
          />
        </div>

        <div className="altegio-filter-field">
          <label>-ig</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setPeriod("custom");
              setTo(e.target.value);
            }}
          />
        </div>

        {currentUser?.role === "admin" ? (
          <div className="altegio-filter-field">
            <label>Szalon</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Összes</option>
              {locations.map((loc) => (
                <option key={String(loc.id)} value={String(loc.id)}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {loading ? <div className="altegio-loading">Betöltés...</div> : null}
      {error ? <div className="altegio-error">{error}</div> : null}

      <section className="altegio-section-card">
        <h2>Értékesítés</h2>

        <div className="altegio-metrics-grid altegio-metrics-grid--3">
          {metricCard(
            "Összesen",
            shortHuf(totalRevenue),
            `${appointmentsCount} bejegyzés`,
            revenueDelta
          )}
          {metricCard(
            "Szolgáltatások",
            shortHuf(estimatedServiceRevenue),
            `${completedCount} szolgáltatás`,
            appointmentDelta
          )}
          {metricCard(
            "Termékek",
            shortHuf(estimatedProductRevenue),
            `${Math.max(0, appointmentsCount - completedCount)} eladott termék`,
            avgBasketDelta
          )}
        </div>

        <div className="altegio-chart-wrap">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatHuf(Number(value || 0))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Összes értékesítés"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="paid"
                name="Szolgáltatások"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                name="Termékek"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="altegio-metrics-grid altegio-metrics-grid--3">
          {metricCard(
            "Bejegyzések átlagos ára",
            formatHuf(avgBasket),
            `${appointmentsCount} időpont`,
            avgBasketDelta
          )}
          {metricCard(
            "Szolgáltatások átlagos ára",
            formatHuf(
              completedCount ? totalRevenue / Math.max(1, completedCount) : 0
            ),
            `${completedCount} szolgáltatás`,
            appointmentDelta
          )}
          {metricCard(
            "Termékek átlagos ára",
            formatHuf(estimatedProductRevenue),
            `${Math.max(0, appointmentsCount - completedCount)} eladott termék`,
            revenueDelta
          )}
        </div>
      </section>

      <section className="altegio-section-card">
        <h2>Látogatások</h2>

        <div className="altegio-metrics-grid altegio-metrics-grid--3">
          {metricCard(
            "Ügyfelek",
            String(uniqueClients),
            "Ügyfelek megtekintése",
            uniqueClientDelta
          )}
          {metricCard(
            "Bejegyzések",
            String(totalVisits),
            "Teljes összeg",
            totalVisitsDelta
          )}
          {metricCard(
            "Időpontok",
            String(appointmentsCount),
            "Teljes összeg",
            appointmentDelta
          )}
        </div>

        <div className="altegio-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="appointments"
                name="Új ügyfelek"
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="paid"
                name="Visszatérő ügyfelek"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="altegio-metrics-grid altegio-metrics-grid--3">
          {metricCard(
            "Új ügyfelek",
            String(Math.max(0, uniqueClients - noShowCount)),
            "Ügyfelek megtekintése",
            uniqueClientDelta
          )}
          {metricCard(
            "Visszatérő ügyfelek",
            String(Math.max(0, totalVisits - uniqueClients)),
            "Ügyfelek megtekintése",
            totalVisitsDelta
          )}
          {metricCard(
            "Elveszett ügyfelek",
            String(lostBookings),
            "Ügyfelek megtekintése",
            deltaLabel(
              lostBookings,
              Number(prevSummary?.cancelled_count || 0) +
                Number(prevSummary?.no_show_count || 0)
            )
          )}
        </div>
      </section>

      <section className="altegio-section-card">
        <h2>Foglaltság</h2>

        <div className="altegio-metrics-grid altegio-metrics-grid--3">
          {metricCard(
            "Befejezett bejegyzések",
            String(completedCount),
            `az összes időpont ${pct(occupancyApprox)}`,
            appointmentDelta
          )}
          {metricCard(
            "Befejezetlen időpontok",
            String(Math.max(0, appointmentsCount - completedCount)),
            `az összes időpont ${pct(100 - occupancyApprox)}`,
            occupancyDelta
          )}
          {metricCard(
            "Lemondott bejegyzések",
            String(cancelledCount),
            `az összes időpont ${pct(
              Number(summary?.cancellation_rate_percent || 0)
            )}`,
            deltaLabel(
              cancelledCount,
              Number(prevSummary?.cancelled_count || 0)
            )
          )}
        </div>
      </section>
    </div>
  );
}
