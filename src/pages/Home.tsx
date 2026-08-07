import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, Banknote, BriefcaseBusiness, Building2,
  CalendarOff, CheckCircle2, Clock3, RefreshCw, UserRoundX, UsersRound,
} from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import ExecutiveDashboardExtras from "./dashboard/ExecutiveDashboardExtras";
import DashboardPeriodInsights from "./dashboard/DashboardPeriodInsights";
import DashboardTargets from "./dashboard/DashboardTargets";
import LiveManagementKpis from "./dashboard/LiveManagementKpis";
import "./Home.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://kleoszalon-api-1.onrender.com/api";

type Row = Record<string, any>;
type Alert = { level: string; title: string; detail: string };
type DashboardData = {
  period: { from: string; to: string };
  stats: Record<string, number>;
  chartData: Row[];
  revenueByLocation: Row[];
  revenueByPosition: Row[];
  topEmployees: Row[];
  absenceByPosition: Row[];
  locations: Array<{ id: string; name: string }>;
  alerts: Alert[];
};

const money = (value: unknown) => `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;
const number = (value: unknown, digits = 0) => Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: digits });
const pct = (value: unknown) => `${number(value, 1)}%`;
const iso = (date: Date) => date.toISOString().slice(0, 10);
const roleList = (role: unknown) => {
  if (Array.isArray(role)) return role.map(String);
  try { const parsed = JSON.parse(String(role || "")); if (Array.isArray(parsed)) return parsed.map(String); } catch { /* legacy */ }
  return String(role || "").replace(/\[|\]|"/g, "").split(",").map(x => x.trim()).filter(Boolean);
};

function Kpi({ icon, label, value, note, tone = "purple" }: { icon: React.ReactNode; label: string; value: string; note: string; tone?: string }) {
  return <article className={`management-kpi tone-${tone}`}><span className="management-kpi__icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>;
}

const tooltipMoney = (value: unknown) => money(value);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading, authError } = useCurrentUser();
  const end = useMemo(() => new Date(), []);
  const start = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; }, []);
  const [from, setFrom] = useState(iso(start));
  const [to, setTo] = useState(iso(end));
  const [locationId, setLocationId] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = roleList(user?.role).map(x => x.toLowerCase()).includes("admin");
  const logout = useCallback(() => {
    ["token","kleo_token","kleo_role","kleo_location_id","kleo_location_name","kleo_full_name","email","userId"].forEach(key => localStorage.removeItem(key));
    navigate("/login");
  }, [navigate]);

  const load = useCallback(async () => {
    if (!user || authError) return;
    const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
    if (!token) return logout();
    setLoading(true); setError("");
    const params = new URLSearchParams({ from, to });
    const effectiveLocation = isAdmin ? locationId : (user.location_id || "");
    if (effectiveLocation) params.set("location_id", String(effectiveLocation));
    try {
      const response = await fetch(`${API_BASE}/dashboard?${params}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      const payload = await response.json();
      if (response.status === 401) return logout();
      if (!response.ok) throw new Error(payload.detail || payload.error || "Dashboard hiba");
      setData(payload);
    } catch (err: any) { setError(err?.message || "A kimutatások nem tölthetők be."); }
    finally { setLoading(false); }
  }, [user, authError, from, to, locationId, isAdmin, logout]);

  useEffect(() => { if (!userLoading && (authError || !user)) logout(); }, [userLoading, authError, user, logout]);
  useEffect(() => { if (user) load(); }, [user, load]);

  const setPreset = (days: number) => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); setFrom(iso(d)); setTo(iso(new Date())); };
  const stats = data?.stats || {};
  const revenueMix = [{ name: "Szolgáltatás", value: stats.serviceRevenue || 0 }, { name: "Termék", value: stats.productRevenue || 0 }];
  const colors = ["#7c5ce5", "#ec6597", "#34a98b", "#e6a746", "#5b8def", "#9367d8"];

  if (userLoading) return <div className="management-loading"><RefreshCw className="spin"/> Belépési adatok ellenőrzése…</div>;

  return <main className="management-dashboard">
    <header className="management-header">
      <div><span className="management-eyebrow">VEZETŐI INFORMÁCIÓS RENDSZER</span><h1>Irányítópult</h1><p>Forgalom, teljesítmény, kapacitás és humán mutatók egy helyen.</p></div>
      <div className="management-filters">
        <div className="management-presets"><button onClick={() => setPreset(7)}>7 nap</button><button onClick={() => setPreset(30)}>30 nap</button><button onClick={() => setPreset(90)}>90 nap</button></div>
        <label><span>Kezdőnap</span><input type="date" value={from} onChange={e => setFrom(e.target.value)}/></label>
        <label><span>Zárónap</span><input type="date" value={to} onChange={e => setTo(e.target.value)}/></label>
        {isAdmin && <label><span>Szalon</span><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Összes szalon</option>{data?.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
        <button className="management-refresh" onClick={load} disabled={loading}><RefreshCw size={17} className={loading ? "spin" : ""}/>{loading ? "Frissítés…" : "Frissítés"}</button>
      </div>
    </header>

    {error && <div className="management-error"><AlertTriangle size={18}/><span><b>Nem sikerült betölteni a kimutatásokat.</b>{error}</span></div>}
    {loading && !data ? <div className="management-loading"><RefreshCw className="spin"/> Vezetői adatok összeállítása…</div> : data && <>
      <ExecutiveDashboardExtras stats={stats} alerts={data.alerts} />
      <DashboardPeriodInsights chartData={data.chartData} />
      <DashboardTargets stats={stats} locationKey={String(locationId || user?.location_id || "all")} />
      <LiveManagementKpis
        from={from}
        to={to}
        locationId={isAdmin ? locationId : user?.location_id}
        appointments={Number(stats.activeAppointments || 0)}
        completed={Number(stats.completedAppointments || 0)}
        cancelled={Number(stats.cancelledAppointments || 0)}
        noShow={Number(stats.noShowCount || 0)}
      />

      <section className="management-kpis">
        <Kpi icon={<Banknote/>} label="Összes bevétel" value={money(stats.totalRevenue)} note={`${money(stats.serviceRevenue)} szolgáltatás`} tone="purple"/>
        <Kpi icon={<Building2/>} label="Átlagos számla" value={money(stats.averageInvoice)} note={`${number(stats.activeAppointments)} időpont`} tone="blue"/>
        <Kpi icon={<Activity/>} label="Kapacitáskihasználtság" value={pct(stats.averageCapacity)} note={`${pct(stats.completionRate)} teljesítési arány`} tone="green"/>
        <Kpi icon={<UsersRound/>} label="Új vendégek" value={number(stats.newClients)} note={`${number(stats.totalClients)} vendég a törzsben`} tone="gold"/>
        <Kpi icon={<CalendarOff/>} label="Betegség és szabadság" value={`${number(Number(stats.sickDays)+Number(stats.leaveDays),1)} nap`} note={`${number(stats.sickDays,1)} betegnap`} tone="pink"/>
        <Kpi icon={<UserRoundX/>} label="Meg nem jelenés" value={number(stats.noShowCount)} note={`${pct(stats.noShowRate)} no-show arány`} tone="red"/>
      </section>

      <section className="management-grid management-grid--wide">
        <article className="management-panel management-panel--trend"><header><div><span>FORGALOM</span><h2>Bevétel alakulása</h2></div><b>{money(stats.totalRevenue)}</b></header><div className="management-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.chartData}><CartesianGrid strokeDasharray="4 4" vertical={false}/><XAxis dataKey="date" tickFormatter={v => String(v).slice(5)} tick={{fontSize:11}}/><YAxis tickFormatter={v => `${Math.round(Number(v)/1000)}e`} tick={{fontSize:11}}/><Tooltip formatter={tooltipMoney}/><Legend/><Line type="monotone" dataKey="revenue" name="Összes bevétel" stroke="#7455dc" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="service_revenue" name="Szolgáltatás" stroke="#e96496" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></article>
        <article className="management-panel"><header><div><span>BEVÉTELMIX</span><h2>Szolgáltatás és termék</h2></div></header><div className="management-chart management-chart--pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={revenueMix} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={4}>{revenueMix.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Pie><Tooltip formatter={tooltipMoney}/><Legend/></PieChart></ResponsiveContainer></div></article>
      </section>

      <section className="management-grid management-grid--half">
        <article className="management-panel"><header><div><span>SZALONHÁLÓZAT</span><h2>Bevétel szalononként</h2></div></header><div className="management-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.revenueByLocation} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="4 4" horizontal={false}/><XAxis type="number" tickFormatter={v=>`${Math.round(Number(v)/1000)}e`}/><YAxis type="category" dataKey="name" width={125} tick={{fontSize:11}}/><Tooltip formatter={tooltipMoney}/><Bar dataKey="revenue" name="Bevétel" fill="#7455dc" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></div></article>
        <article className="management-panel"><header><div><span>SZAKMAI TELJESÍTMÉNY</span><h2>Bevétel munkakörönként</h2></div></header><div className="management-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.revenueByPosition.slice(0,8)}><CartesianGrid strokeDasharray="4 4" vertical={false}/><XAxis dataKey="position_name" tick={{fontSize:10}} interval={0} angle={-18} textAnchor="end" height={65}/><YAxis tickFormatter={v=>`${Math.round(Number(v)/1000)}e`}/><Tooltip formatter={tooltipMoney}/><Bar dataKey="service_revenue" stackId="a" name="Szolgáltatás" fill="#7455dc"/><Bar dataKey="product_revenue" stackId="a" name="Termék" fill="#ec6597" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></article>
      </section>

      <section className="management-grid management-grid--half">
        <article className="management-panel management-table-panel"><header><div><span>MUNKAKÖRÖK</span><h2>Szakmai eredményesség</h2></div><BriefcaseBusiness/></header><div className="management-table-wrap"><table><thead><tr><th>Munkakör</th><th>Bevétel</th><th>Teljesítés</th><th>Ft/óra</th><th>Kapacitás</th></tr></thead><tbody>{data.revenueByPosition.map((r,i)=><tr key={r.position_name}><td><i style={{background:colors[i%colors.length]}}/>{r.position_name}</td><td><b>{money(r.revenue)}</b></td><td>{number(r.completed)}</td><td>{money(r.revenue_per_hour)}</td><td><span className="capacity-pill">{pct(r.capacity)}</span></td></tr>)}</tbody></table></div></article>
        <article className="management-panel management-table-panel"><header><div><span>HUMÁN MUTATÓK</span><h2>Betegségek és hiányzások</h2></div><CalendarOff/></header><div className="management-table-wrap"><table><thead><tr><th>Munkakör</th><th>Betegnap</th><th>Szabadság</th><th>Igazolatlan</th><th>Hiányzás</th></tr></thead><tbody>{data.absenceByPosition.length ? data.absenceByPosition.map(r=><tr key={r.position_name}><td>{r.position_name}</td><td>{number(r.sick_days,1)}</td><td>{number(Number(r.paid_leave_days)+Number(r.unpaid_leave_days),1)}</td><td className={Number(r.unexcused_days)>0?"danger-text":""}>{number(r.unexcused_days,1)}</td><td><span className="absence-pill">{pct(r.absence_rate)}</span></td></tr>) : <tr><td colSpan={5}>Nincs hiányzási adat az időszakban.</td></tr>}</tbody></table></div></article>
      </section>

      <section className="management-grid management-grid--half">
        <article className="management-panel management-table-panel"><header><div><span>TOPLISTA</span><h2>Legeredményesebb munkatársak</h2></div><CheckCircle2/></header><div className="management-table-wrap"><table><thead><tr><th>Munkatárs</th><th>Szalon</th><th>Bevétel</th><th>Kapacitás</th></tr></thead><tbody>{data.topEmployees.map((r,i)=><tr key={r.id}><td><span className="rank">{i+1}</span><b>{r.full_name}</b><small>{r.position_name}</small></td><td>{r.location_name}</td><td><b>{money(r.revenue)}</b></td><td>{pct(r.capacity)}</td></tr>)}</tbody></table></div></article>
        <article className="management-panel management-alerts"><header><div><span>VEZETŐI FIGYELMEZTETÉSEK</span><h2>Teendők és kockázatok</h2></div><Clock3/></header>{data.alerts.length ? data.alerts.map((a,i)=><div key={i} className={`management-alert is-${a.level}`}><AlertTriangle/><span><b>{a.title}</b><small>{a.detail}</small></span></div>) : <div className="management-alert is-success"><CheckCircle2/><span><b>Minden fő mutató rendben</b><small>Az időszakban nincs kiemelt vezetői riasztás.</small></span></div>}</article>
      </section>
    </>}
  </main>;
}
