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
import api from "../api/api";
import { getCurrentUser, type CurrentUser } from "../api/me";
import { getLocations } from "../api/locations";
import {
  getVirDashboard,
  getVirRevenueSeries,
  type VirDashboardSummary,
  type VirRevenueRow,
} from "../api/vir";
import "../styles/vir-altegio.css";

type LocationRow = { id: string | number; name: string };
type PeriodKey = "today" | "week" | "month" | "custom";
type StaffMetric = {
  employee_id: string | null;
  employee_name: string;
  workorder_count: number;
  revenue: number;
  avg_ticket: number;
};
type ManagementSummary = {
  revenue: {
    service_revenue: number;
    product_revenue: number;
    gross_revenue: number;
    discounts: number;
    tips: number;
    closed_workorders: number;
    service_share_percent: number;
    product_share_percent: number;
  };
  stock: {
    inventory_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    stocked_products: number;
  };
  crm: {
    visits: number;
    unique_guests: number;
    guest_revenue: number;
    avg_guest_spend: number;
  };
  staff: StaffMetric[];
};

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPeriodDates(period: Exclude<PeriodKey, "custom">) {
  const end = new Date();
  const start = new Date(end);
  if (period === "today") return { from: isoDate(end), to: isoDate(end) };
  if (period === "week") start.setDate(end.getDate() - 6);
  else start.setDate(1);
  return { from: isoDate(start), to: isoDate(end) };
}

function huf(value?: number | null) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function num(value?: number | null) { return new Intl.NumberFormat("hu-HU").format(Number(value || 0)); }
function pct(value?: number | null) { return `${Number(value || 0).toFixed(1)}%`; }

function MetricCard({ title, value, sub, alert }: { title: string; value: string; sub?: string; alert?: boolean }) {
  return <div className="altegio-metric-card" style={alert ? { borderColor: "#f59e0b" } : undefined}>
    <div className="altegio-metric-card__title">{title}</div>
    <div className="altegio-metric-card__value">{value}</div>
    <div className="altegio-metric-card__sub">{sub || ""}</div>
  </div>;
}

export default function VirTopMetricsPage() {
  const initial = getPeriodDates("month");
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [locationId, setLocationId] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [summary, setSummary] = useState<VirDashboardSummary | null>(null);
  const [series, setSeries] = useState<VirRevenueRow[]>([]);
  const [management, setManagement] = useState<ManagementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then((user) => setCurrentUser(user ?? null)).catch(() => setCurrentUser(null));
    getLocations().then((rows: any[]) => setLocations((rows || []).map((loc) => ({ id: loc.id, name: loc.name })))).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    if (period === "custom") return;
    const next = getPeriodDates(period);
    setFrom(next.from);
    setTo(next.to);
  }, [period]);

  useEffect(() => {
    if (!currentUser) return;
    const effectiveLocationId = currentUser.role === "admin" ? (locationId || undefined) : (currentUser.location_id ? String(currentUser.location_id) : undefined);
    async function load() {
      setLoading(true); setError("");
      try {
        const params = { from, to, locationId: effectiveLocationId };
        const [virSummary, virSeries, live] = await Promise.all([
          getVirDashboard(params),
          getVirRevenueSeries(params),
          api.get<ManagementSummary>("/transactions/cashier/management-summary", { params: { from, to, location_id: effectiveLocationId } }).then(r => r.data),
        ]);
        setSummary(virSummary); setSeries(virSeries); setManagement(live);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "A vezetői mutatók betöltése sikertelen.");
      } finally { setLoading(false); }
    }
    load();
  }, [currentUser, from, to, locationId]);

  const chartData = useMemo(() => series.map((row) => ({
    day: row.day?.slice(5) || "",
    revenue: Number(row.revenue_total || 0),
    paid: Number(row.paid_total || 0),
    appointments: Number(row.appointments_count || 0),
  })), [series]);

  const staffChart = useMemo(() => (management?.staff || []).slice(0, 8).map((row) => ({
    name: row.employee_name,
    revenue: Number(row.revenue || 0),
  })), [management]);

  const appointments = Number(summary?.appointments_count || 0);
  const completed = Number(summary?.completed_count || 0);
  const utilization = appointments > 0 ? Math.round(completed / appointments * 1000) / 10 : 0;
  const noShowRate = Number(summary?.no_show_rate_percent || 0);
  const cancelRate = Number(summary?.cancellation_rate_percent || 0);
  const lowStock = Number(management?.stock?.low_stock_count || 0);
  const outOfStock = Number(management?.stock?.out_of_stock_count || 0);

  return <div className="altegio-main" style={{ padding: 20 }}>
    <div className="altegio-breadcrumb">Kimutatások / Vezetői dashboard</div>
    <div className="altegio-header"><div><h1>Legfőbb mutatók</h1><p>Valós pénzügyi, CRM-, munkatársi és készletadatok egy nézetben.</p></div></div>

    <div className="altegio-filterbar">
      <div className="altegio-filter-field"><label>Időszak</label><div className="altegio-header__actions">
        <button className={`altegio-tab ${period === "today" ? "is-active" : ""}`} onClick={() => setPeriod("today")}>Ma</button>
        <button className={`altegio-tab ${period === "week" ? "is-active" : ""}`} onClick={() => setPeriod("week")}>7 nap</button>
        <button className={`altegio-tab ${period === "month" ? "is-active" : ""}`} onClick={() => setPeriod("month")}>Hónap</button>
        <button className={`altegio-tab ${period === "custom" ? "is-active" : ""}`} onClick={() => setPeriod("custom")}>Egyedi</button>
      </div></div>
      <div className="altegio-filter-field"><label>-tól</label><input type="date" value={from} onChange={(e) => { setPeriod("custom"); setFrom(e.target.value); }}/></div>
      <div className="altegio-filter-field"><label>-ig</label><input type="date" value={to} onChange={(e) => { setPeriod("custom"); setTo(e.target.value); }}/></div>
      {currentUser?.role === "admin" && <div className="altegio-filter-field"><label>Szalon</label><select value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">Összes</option>{locations.map((loc) => <option key={String(loc.id)} value={String(loc.id)}>{loc.name}</option>)}</select></div>}
    </div>

    {loading && <div className="altegio-loading">Betöltés...</div>}
    {error && <div className="altegio-error">{error}</div>}

    <section className="altegio-section-card">
      <h2>Valós értékesítés</h2>
      <div className="altegio-metrics-grid altegio-metrics-grid--3">
        <MetricCard title="Összes lezárt értékesítés" value={huf(management?.revenue.gross_revenue)} sub={`${num(management?.revenue.closed_workorders)} pénzügyileg lezárt munkalap`} />
        <MetricCard title="Szolgáltatásbevétel" value={huf(management?.revenue.service_revenue)} sub={`${pct(management?.revenue.service_share_percent)} részesedés`} />
        <MetricCard title="Termékbevétel" value={huf(management?.revenue.product_revenue)} sub={`${pct(management?.revenue.product_share_percent)} részesedés`} />
        <MetricCard title="Kedvezmények" value={huf(management?.revenue.discounts)} sub="Lezárt munkalapokon" />
        <MetricCard title="Borravaló" value={huf(management?.revenue.tips)} sub="Lezárt munkalapokon" />
        <MetricCard title="Átlagos kosárérték" value={huf(summary?.avg_basket)} sub={`${num(appointments)} foglalás`} />
      </div>
      <div className="altegio-chart-wrap"><ResponsiveContainer width="100%" height={260}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip formatter={(value: any) => huf(Number(value || 0))}/><Legend/><Line type="monotone" dataKey="revenue" name="Árbevétel" stroke="#8b5cf6" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="paid" name="Fizetett" stroke="#06b6d4" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
    </section>

    <section className="altegio-section-card">
      <h2>Vendég és működési KPI-k</h2>
      <div className="altegio-metrics-grid altegio-metrics-grid--3">
        <MetricCard title="CRM látogatások" value={num(management?.crm.visits)} sub={`${num(management?.crm.unique_guests)} egyedi vendég`} />
        <MetricCard title="CRM vendégbevétel" value={huf(management?.crm.guest_revenue)} sub={`Átlag: ${huf(management?.crm.avg_guest_spend)}`} />
        <MetricCard title="Kihasználtság" value={pct(utilization)} sub="Teljesített / összes foglalás operatív mutató" />
        <MetricCard title="No-show" value={pct(noShowRate)} sub={`${num(summary?.no_show_count)} alkalom`} alert={noShowRate > 5} />
        <MetricCard title="Lemondás" value={pct(cancelRate)} sub={`${num(summary?.cancelled_count)} alkalom`} alert={cancelRate > 10} />
        <MetricCard title="Teljesített időpont" value={num(completed)} sub={`${num(appointments)} összes foglalásból`} />
      </div>
    </section>

    <section className="altegio-section-card">
      <h2>Készletállapot</h2>
      <div className="altegio-metrics-grid altegio-metrics-grid--3">
        <MetricCard title="Készletérték" value={huf(management?.stock.inventory_value)} sub={`${num(management?.stock.stocked_products)} készletezett termék`} />
        <MetricCard title="Alacsony készlet" value={num(lowStock)} sub="Minimum készletszint alatt vagy azon" alert={lowStock > 0} />
        <MetricCard title="Kifogyott termék" value={num(outOfStock)} sub="0 készlet" alert={outOfStock > 0} />
      </div>
    </section>

    <section className="altegio-section-card">
      <h2>Munkatárs-teljesítmény</h2>
      <div className="altegio-chart-wrap"><ResponsiveContainer width="100%" height={260}><BarChart data={staffChart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(value: any) => huf(Number(value || 0))}/><Bar dataKey="revenue" name="Lezárt bevétel" fill="#8b5cf6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Munkatárs</th><th style={th}>Lezárt munkalap</th><th style={th}>Bevétel</th><th style={th}>Átlagos kosár</th></tr></thead><tbody>{(management?.staff || []).map((row, index) => <tr key={`${row.employee_id || "none"}-${index}`}><td style={td}>{row.employee_name}</td><td style={td}>{num(row.workorder_count)}</td><td style={td}>{huf(row.revenue)}</td><td style={td}>{huf(row.avg_ticket)}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb", opacity: 0.7 };
const td: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" };
