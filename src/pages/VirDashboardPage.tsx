import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getLocations, LocationRow } from "../api/locations";
import { getVirTargets } from "../api/virTargets";
import { getKpiColor } from "../utils/getKpiColor";
import { getCurrentUser, CurrentUser } from "../api/me";
import {
  canEditLocationFilter,
  canSeeFinancials,
  getEffectiveLocationId,
} from "../utils/roleDashboard";
import {
  getVirDashboardFast,
  VirCancellationStatsRow,
  VirDashboardSummary,
  VirKioskConversionRow,
  VirRevenueRow,
  VirSignageImpactRow,
  VirSourcePerformanceRow,
  VirTopServiceRow,
  VirTopStaffRow,
} from "../api/vir";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function money(v?: number | null) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(v || 0));
}
function num(v?: number | null) {
  return new Intl.NumberFormat("hu-HU").format(Number(v || 0));
}
function pct(v?: number | null) {
  return `${Number(v || 0).toFixed(2)}%`;
}
function subDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

type PeriodKey = "today" | "7d" | "30d" | "month" | "custom";
function getPeriodDates(period: PeriodKey) {
  const today = new Date();
  if (period === "today") {
    const x = isoDate(today);
    return { from: x, to: x };
  }
  if (period === "7d") return { from: isoDate(subDays(today, 6)), to: isoDate(today) };
  if (period === "30d") return { from: isoDate(subDays(today, 29)), to: isoDate(today) };
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: isoDate(monthStart), to: isoDate(today) };
}
function calcTrend(current: number, previous: number) {
  if (!previous && !current) return { direction: "flat", label: "0.0%", color: "#64748b", arrow: "→" };
  if (!previous && current > 0) return { direction: "up", label: "Új", color: "#16a34a", arrow: "▲" };
  const diffPct = ((current - previous) / Math.abs(previous || 1)) * 100;
  if (Math.abs(diffPct) < 0.05) return { direction: "flat", label: "0.0%", color: "#64748b", arrow: "→" };
  return {
    direction: diffPct > 0 ? "up" : "down",
    label: `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%`,
    color: diffPct > 0 ? "#16a34a" : "#dc2626",
    arrow: diffPct > 0 ? "▲" : "▼",
  };
}

function Card(props: { title: string; value: string; sub?: string; trend?: { arrow: string; label: string; color: string }; accentColor?: string; }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.07)", minHeight: 120, borderLeft: `6px solid ${props.accentColor || "#e5e7eb"}` }}>
      <div style={{ fontSize: 13, opacity: 0.68, marginBottom: 8 }}>{props.title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{props.value}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 8 }}>
        <div style={{ fontSize: 13, opacity: 0.72 }}>{props.sub || ""}</div>
        {props.trend ? <div style={{ fontSize: 13, fontWeight: 700, color: props.trend.color, whiteSpace: "nowrap" }}>{props.trend.arrow} {props.trend.label}</div> : null}
      </div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{props.title}</div>
        {props.right}
      </div>
      {props.children}
    </div>
  );
}

function AlertPanel({ alerts }: { alerts: Array<{ level: "info" | "warning" | "critical"; text: string }> }) {
  if (!alerts.length) {
    return <div style={{ background: "#effaf3", color: "#166534", padding: 12, borderRadius: 12, marginBottom: 16 }}>Nincs kritikus figyelmeztetés az aktuális időszakban.</div>;
  }
  return (
    <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
      {alerts.map((a, i) => {
        const bg = a.level === "critical" ? "#fff1f2" : a.level === "warning" ? "#fff7ed" : "#eff6ff";
        const color = a.level === "critical" ? "#be123c" : a.level === "warning" ? "#c2410c" : "#1d4ed8";
        return <div key={i} style={{ background: bg, color, padding: 12, borderRadius: 12, fontWeight: 600 }}>{a.text}</div>;
      })}
    </div>
  );
}

const PIE_COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

const clickRowStyle: React.CSSProperties = {
  cursor: "pointer",
  transition: "background 0.15s ease",
};

export default function VirDashboardPage() {
  const navigate = useNavigate();
  const initial = getPeriodDates("month");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<VirDashboardSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<VirDashboardSummary | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<VirRevenueRow[]>([]);
  const [topServices, setTopServices] = useState<VirTopServiceRow[]>([]);
  const [topStaff, setTopStaff] = useState<VirTopStaffRow[]>([]);
  const [sourceRows, setSourceRows] = useState<VirSourcePerformanceRow[]>([]);
  const [cancelRows, setCancelRows] = useState<VirCancellationStatsRow[]>([]);
  const [kioskRows, setKioskRows] = useState<VirKioskConversionRow[]>([]);
  const [signageRows, setSignageRows] = useState<VirSignageImpactRow[]>([]);

  useEffect(() => {
    if (period === "custom") return;
    const p = getPeriodDates(period);
    setFrom(p.from);
    setTo(p.to);
  }, [period]);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
    getLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  const loadAll = useCallback(async (userOverride?: CurrentUser | null) => {
    setLoading(true);
    setError("");
    try {
      const user = userOverride ?? currentUser;
      const effectiveLocationId = getEffectiveLocationId(user, locationId);
      const common = { from, to, locationId: effectiveLocationId || undefined };

      // A dashboard korábbi 9 VIR API-kérése helyett egy aggregált, rövid TTL-cache-elt
      // végpontot használ. A ritkán változó célérték külön kérés marad.
      const [fast, targetsData] = await Promise.all([
        getVirDashboardFast({ ...common, limit: 10 }),
        getVirTargets(effectiveLocationId || undefined),
      ]);

      setSummary(fast.summary);
      setPrevSummary(fast.prevSummary);
      setRevenueSeries(fast.revenueSeries || []);
      setTopServices(fast.topServices || []);
      setTopStaff(fast.topStaff || []);
      setSourceRows(fast.sourceRows || []);
      setCancelRows(fast.cancelRows || []);
      setKioskRows(fast.kioskRows || []);
      setSignageRows(fast.signageRows || []);
      setTargets(targetsData);
    } catch (e: any) {
      setError(e?.message || "VIR betöltési hiba");
    } finally {
      setLoading(false);
    }
  }, [currentUser, from, locationId, to]);

  useEffect(() => {
    if (!currentUser) return;
    loadAll(currentUser);
  }, [currentUser, loadAll]);

  const revenueChart = useMemo(() => revenueSeries.map((r) => ({ day: r.day.slice(5), revenue: Number(r.revenue_total || 0), paid: Number(r.paid_total || 0), appointments: Number(r.appointments_count || 0) })), [revenueSeries]);
  const sourceChart = useMemo(() => sourceRows.map((r) => ({ name: r.source_channel || "unknown", value: Number(r.revenue_total || 0) })), [sourceRows]);
  const staffChart = useMemo(() => topStaff.slice(0, 6).map((r) => ({ name: r.short_name || r.full_name, revenue: Number(r.revenue_total || 0) })), [topStaff]);
  const cancellationChart = useMemo(() => cancelRows.map((r) => ({ day: r.day.slice(5), cancellation: Number(r.cancellation_rate_percent || 0), noShow: Number(r.no_show_rate_percent || 0) })), [cancelRows]);
  const kioskRevenueTotal = useMemo(() => kioskRows.reduce((sum, r) => sum + Number(r.kiosk_revenue || 0), 0), [kioskRows]);

  const trends = useMemo(() => ({
    revenue: calcTrend(Number(summary?.revenue_total || 0), Number(prevSummary?.revenue_total || 0)),
    appts: calcTrend(Number(summary?.appointments_count || 0), Number(prevSummary?.appointments_count || 0)),
    basket: calcTrend(Number(summary?.avg_basket || 0), Number(prevSummary?.avg_basket || 0)),
    cancel: calcTrend(Number(summary?.cancelled_count || 0), Number(prevSummary?.cancelled_count || 0)),
    noShow: calcTrend(Number(summary?.no_show_count || 0), Number(prevSummary?.no_show_count || 0)),
    kiosk: calcTrend(Number(kioskRevenueTotal || 0), 0),
  }), [summary, prevSummary, kioskRevenueTotal]);

  const alerts = useMemo(() => {
    const list: Array<{ level: "info" | "warning" | "critical"; text: string }> = [];
    const revenueLabel = trends.revenue.label.includes("%") ? Number(trends.revenue.label.replace("%", "").replace("+", "")) : 0;
    const noShowRate = Number(summary?.no_show_rate_percent || 0);
    const cancelRate = Number(summary?.cancellation_rate_percent || 0);
    if (trends.revenue.direction === "down" && Math.abs(revenueLabel) >= 10) list.push({ level: "critical", text: "Az árbevétel több mint 10%-kal csökkent az előző időszakhoz képest." });
    if (noShowRate > 5) list.push({ level: "warning", text: `A no-show arány magas: ${pct(noShowRate)}.` });
    if (cancelRate > 10) list.push({ level: "warning", text: `A lemondási arány magas: ${pct(cancelRate)}.` });
    if (Number(kioskRevenueTotal || 0) === 0) list.push({ level: "info", text: "A kiválasztott időszakban nincs kioszk árbevétel." });
    if (signageRows.length > 0 && signageRows.every((x) => Number(x.appointments_during_campaign || 0) === 0)) list.push({ level: "info", text: "Van signage kampány, de nem látszik hozzá kapcsolható aktivitás." });
    return list;
  }, [trends, summary, kioskRevenueTotal, signageRows]);

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <div className="page-content">
        <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900 }}>VIR Dashboard</h1>
              <div style={{ marginTop: 6, opacity: 0.72 }}>Vezetői információs és KPI nézet{currentUser?.role ? ` • szerepkör: ${currentUser.role}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
              <label><div style={{ fontSize: 12, marginBottom: 4 }}>Periódus</div><select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} style={{ height: 32 }}><option value="today">Ma</option><option value="7d">Utolsó 7 nap</option><option value="30d">Utolsó 30 nap</option><option value="month">Aktuális hónap</option><option value="custom">Egyedi</option></select></label>
              <label><div style={{ fontSize: 12, marginBottom: 4 }}>Kezdő dátum</div><input type="date" value={from} onChange={(e) => { setPeriod("custom"); setFrom(e.target.value); }} /></label>
              <label><div style={{ fontSize: 12, marginBottom: 4 }}>Záró dátum</div><input type="date" value={to} onChange={(e) => { setPeriod("custom"); setTo(e.target.value); }} /></label>
              <label><div style={{ fontSize: 12, marginBottom: 4 }}>Helyszín</div>
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!canEditLocationFilter(currentUser)} style={{ minWidth: 220, height: 32, opacity: canEditLocationFilter(currentUser) ? 1 : 0.7 }}>
                  <option value="">Minden helyszín</option>
                  {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </label>
              <button onClick={() => loadAll()} style={{ height: 36, padding: "0 16px", cursor: "pointer" }}>Frissítés</button>
              <button onClick={() => navigate("/admin/vir-reports")} style={{ height: 36, padding: "0 16px", cursor: "pointer" }}>VIR Reports</button>
            </div>
          </div>

          <AlertPanel alerts={alerts} />
          {error ? <div style={{ background: "#fff3f3", color: "#8a1f1f", padding: 12, borderRadius: 12, marginBottom: 16 }}>{error}</div> : null}
          {loading ? <div style={{ marginBottom: 16 }}>Betöltés…</div> : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
            {canSeeFinancials(currentUser) && (
              <>
                <Card title="Árbevétel" value={money(summary?.revenue_total)} sub={`Fizetett: ${money(summary?.paid_total)}`} trend={trends.revenue} accentColor={getKpiColor(Number(summary?.revenue_total || 0), Number(targets.revenue_total || 0))} />
                <Card title="Átlag kosárérték" value={money(summary?.avg_basket)} trend={trends.basket} accentColor={getKpiColor(Number(summary?.avg_basket || 0), Number(targets.avg_basket || 0))} />
                <Card title="Kiosk árbevétel" value={money(kioskRevenueTotal)} sub="Kiosk source_channel = kiosk" trend={trends.kiosk} accentColor={getKpiColor(Number(kioskRevenueTotal || 0), Number(targets.kiosk_revenue || 0))} />
              </>
            )}
            <Card title="Foglalások" value={num(summary?.appointments_count)} sub={`Teljesített: ${num(summary?.completed_count)}`} trend={trends.appts} accentColor={getKpiColor(Number(summary?.appointments_count || 0), Number(targets.appointments_count || 0))} />
            <Card title="Lemondások" value={num(summary?.cancelled_count)} sub={pct(summary?.cancellation_rate_percent)} trend={trends.cancel} accentColor={getKpiColor(Number(summary?.cancellation_rate_percent || 0), Number(targets.cancellation_rate || 0), true)} />
            <Card title="No-show" value={num(summary?.no_show_count)} sub={pct(summary?.no_show_rate_percent)} trend={trends.noShow} accentColor={getKpiColor(Number(summary?.no_show_rate_percent || 0), Number(targets.no_show_rate || 0), true)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 20 }}>
            <Section title="Bevétel idősor">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: any, key: any) => key === "appointments" ? num(Number(value)) : money(Number(value))} />
                    <Legend />
                    {canSeeFinancials(currentUser) && <>
                      <Line type="monotone" dataKey="revenue" name="Árbevétel" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="paid" name="Fizetett" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </>}
                    <Line type="monotone" dataKey="appointments" name="Foglalások" stroke="#22c55e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Forrás szerinti bevétel">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sourceChart} dataKey="value" nameKey="name" outerRadius={110} label>
                      {sourceChart.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => money(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <Section title="Top dolgozók árbevétel szerint" right={<span style={{ fontSize: 12, opacity: 0.65 }}>Katt a sorra</span>}>
              <div style={{ width: "100%", height: 240, marginBottom: 16 }}>
                <ResponsiveContainer>
                  <BarChart data={staffChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => money(Number(value))} />
                    <Bar dataKey="revenue" name="Árbevétel" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Dolgozó</th>
                    <th style={th}>Foglalás</th>
                    <th style={th}>Teljesített</th>
                    {canSeeFinancials(currentUser) && <th style={th}>Árbevétel / óra</th>}
                  </tr>
                </thead>
                <tbody>
                  {topStaff.map((r, idx) => (
                    <tr
                      key={String((r as any).employee_id ?? idx)}
                      style={clickRowStyle}
                      onMouseEnter={(e) => ((e.currentTarget.style.background = "#faf5ff"))}
                      onMouseLeave={(e) => ((e.currentTarget.style.background = "transparent"))}
                      onClick={() => {
                        const id = (r as any).employee_id;
                        if (id) navigate(`/admin/vir/staff/${id}`);
                      }}
                    >
                      <td style={td}>{r.short_name || r.full_name}</td>
                      <td style={td}>{num(r.appointments_count)}</td>
                      <td style={td}>{num(r.completed_count)}</td>
                      {canSeeFinancials(currentUser) && <td style={td}>{money(r.revenue_per_hour)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Lemondás és no-show trend">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={cancellationChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="cancellation" name="Lemondás %" stroke="#f59e0b" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="noShow" name="No-show %" stroke="#ef4444" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <Section title="Top szolgáltatások" right={<span style={{ fontSize: 12, opacity: 0.65 }}>Katt a sorra</span>}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Szolgáltatás</th>
                    <th style={th}>Foglalás</th>
                    {canSeeFinancials(currentUser) && <th style={th}>Árbevétel</th>}
                    {canSeeFinancials(currentUser) && <th style={th}>Átlagár</th>}
                  </tr>
                </thead>
                <tbody>
                  {topServices.map((r, idx) => (
                    <tr
                      key={String((r as any).service_id ?? idx)}
                      style={clickRowStyle}
                      onMouseEnter={(e) => ((e.currentTarget.style.background = "#eff6ff"))}
                      onMouseLeave={(e) => ((e.currentTarget.style.background = "transparent"))}
                      onClick={() => {
                        const id = (r as any).service_id;
                        if (id) navigate(`/admin/vir/service/${id}`);
                      }}
                    >
                      <td style={td}>{r.service_name}</td>
                      <td style={td}>{num(r.bookings_count)}</td>
                      {canSeeFinancials(currentUser) && <td style={td}>{money(r.revenue_total)}</td>}
                      {canSeeFinancials(currentUser) && <td style={td}>{money(r.avg_price)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Kiosk konverzió">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Nap</th>
                    <th style={th}>Kiosk foglalás</th>
                    <th style={th}>Teljesített</th>
                    {canSeeFinancials(currentUser) && <th style={th}>Kiosk árbevétel</th>}
                  </tr>
                </thead>
                <tbody>
                  {kioskRows.map((r, idx) => (
                    <tr key={idx}>
                      <td style={td}>{r.day}</td>
                      <td style={td}>{num(r.kiosk_appointments)}</td>
                      <td style={td}>{num(r.kiosk_completed)}</td>
                      {canSeeFinancials(currentUser) && <td style={td}>{money(r.kiosk_revenue)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <Section title="Signage kampányhatás">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Kampány</th>
                    <th style={th}>Kezdet</th>
                    <th style={th}>Vége</th>
                    <th style={th}>Foglalások</th>
                    {canSeeFinancials(currentUser) && <th style={th}>Árbevétel</th>}
                  </tr>
                </thead>
                <tbody>
                  {signageRows.map((r, idx) => (
                    <tr key={idx}>
                      <td style={td}>{r.title}</td>
                      <td style={td}>{r.active_from || "—"}</td>
                      <td style={td}>{r.active_to || "—"}</td>
                      <td style={td}>{num(r.appointments_during_campaign)}</td>
                      {canSeeFinancials(currentUser) && <td style={td}>{money(r.revenue_during_campaign)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #ececec", opacity: 0.7 };
const td: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" };
