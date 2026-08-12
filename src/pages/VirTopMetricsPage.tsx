import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/api";
import { getCurrentUser, type CurrentUser } from "../api/me";
import { getLocations } from "../api/locations";
import { getVirDashboard, getVirRevenueSeries, type VirDashboardSummary, type VirRevenueRow } from "../api/vir";
import { useCapabilities } from "../hooks/useCapabilities";
import "./VirTopMetricsPage.css";

type LocationRow = { id: string | number; name: string };
type PeriodKey = "today" | "week" | "month" | "custom";
type StaffMetric = { employee_id:string|null; employee_name:string; workorder_count:number; revenue:number; avg_ticket:number };
type ManagementSummary = {
  revenue:{ service_revenue:number; product_revenue:number; gross_revenue:number; discounts:number; tips:number; closed_workorders:number; service_quantity:number; product_quantity:number; avg_service_price:number; avg_product_price:number; service_share_percent:number; product_share_percent:number };
  stock:{ inventory_value:number; low_stock_count:number; out_of_stock_count:number; stocked_products:number };
  crm:{ visits:number; unique_guests:number; guest_revenue:number; avg_guest_spend:number; new_guests:number; returning_guests:number; inactive_guests:number; inactive_after_days:number };
  staff:StaffMetric[];
  financial_redacted?:boolean;
};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const periodDates=(period:Exclude<PeriodKey,"custom">)=>{const end=new Date();const start=new Date(end);if(period==="today")return{from:iso(end),to:iso(end)};if(period==="week")start.setDate(end.getDate()-6);else start.setDate(1);return{from:iso(start),to:iso(end)}};
const huf=(v?:number|null)=>new Intl.NumberFormat("hu-HU",{style:"currency",currency:"HUF",maximumFractionDigits:0}).format(Number(v||0));
const num=(v?:number|null)=>new Intl.NumberFormat("hu-HU").format(Number(v||0));
const pct=(v?:number|null)=>`${Number(v||0).toFixed(1)}%`;

function Card({title,value,sub,state}:{title:string;value:string;sub:string;state?:"warning"|"critical"}){return <article className={`topmetrics-card ${state||""}`}><small>{title}</small><strong>{value}</strong><em>{sub}</em></article>}
function Restricted(){return <div className="topmetrics-status" style={{margin:"12px 0"}}>A pénzügyi mutatók megtekintéséhez külön pénzügyi jogosultság szükséges.</div>}

export default function VirTopMetricsPage(){
  const {menu}=useCapabilities();
  const canFinancial=menu("analytics.main","can_view_financial");
  const initial=periodDates("month");
  const[period,setPeriod]=useState<PeriodKey>("month");
  const[from,setFrom]=useState(initial.from);const[to,setTo]=useState(initial.to);
  const[locationId,setLocationId]=useState("");
  const[user,setUser]=useState<CurrentUser|null>(null);const[locations,setLocations]=useState<LocationRow[]>([]);
  const[summary,setSummary]=useState<VirDashboardSummary|null>(null);const[series,setSeries]=useState<VirRevenueRow[]>([]);const[management,setManagement]=useState<ManagementSummary|null>(null);
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");

  useEffect(()=>{getCurrentUser().then(x=>setUser(x||null)).catch(()=>setUser(null));getLocations().then((rows:any[])=>setLocations((rows||[]).map(x=>({id:x.id,name:x.name})))).catch(()=>setLocations([]))},[]);
  useEffect(()=>{if(period==="custom")return;const p=periodDates(period);setFrom(p.from);setTo(p.to)},[period]);
  useEffect(()=>{if(!user)return;const effective=user.role==="admin"?(locationId||undefined):(user.location_id?String(user.location_id):undefined);(async()=>{setLoading(true);setError("");try{const params={from,to,locationId:effective};const[s,ser,m]=await Promise.all([getVirDashboard(params),getVirRevenueSeries(params),api.get<ManagementSummary>("/transactions/cashier/management-summary",{params:{from,to,location_id:effective}}).then(r=>r.data)]);setSummary(s);setSeries(ser);setManagement(m)}catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||e?.message||"A kimutatások betöltése sikertelen.")}finally{setLoading(false)}})()},[user,from,to,locationId]);

  const chartData=useMemo(()=>series.map(r=>({day:r.day?.slice(5)||"",revenue:Number(r.revenue_total||0),paid:Number(r.paid_total||0),appointments:Number(r.appointments_count||0)})),[series]);
  const staffData=useMemo(()=>(management?.staff||[]).slice(0,10).map(x=>({name:x.employee_name,revenue:Number(x.revenue||0),workorders:Number(x.workorder_count||0)})),[management]);
  const appointments=Number(summary?.appointments_count||0),completed=Number(summary?.completed_count||0),cancelled=Number(summary?.cancelled_count||0),noShow=Number(summary?.no_show_count||0);
  const utilization=appointments?completed/appointments*100:0;const completion=appointments?completed/appointments*100:0;const cancellation=Number(summary?.cancellation_rate_percent||0);const noShowRate=Number(summary?.no_show_rate_percent||0);
  const revenue=management?.revenue;const stock=management?.stock;const crm=management?.crm;

  return <main className="topmetrics-page">
    <section className="topmetrics-hero"><div><span className="topmetrics-eyebrow">KIMUTATÁSOK / VEZETŐI DASHBOARD</span><h1>Legfőbb mutatók</h1><p>Pénzügyi, vendég-, működési, készlet- és munkatársi KPI-k valós rendszeradatokból.</p></div><div className="topmetrics-filter"><div className="topmetrics-presets"><button className={period==="today"?"active":""} onClick={()=>setPeriod("today")}>Ma</button><button className={period==="week"?"active":""} onClick={()=>setPeriod("week")}>7 nap</button><button className={period==="month"?"active":""} onClick={()=>setPeriod("month")}>Hónap</button></div><label>Kezdőnap<input type="date" value={from} onChange={e=>{setPeriod("custom");setFrom(e.target.value)}}/></label><label>Zárónap<input type="date" value={to} onChange={e=>{setPeriod("custom");setTo(e.target.value)}}/></label>{user?.role==="admin"&&<label>Szalon<select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Összes</option>{locations.map(l=><option key={String(l.id)} value={String(l.id)}>{l.name}</option>)}</select></label>}</div></section>
    {loading&&<div className="topmetrics-status loading">Adatok frissítése…</div>}{error&&<div className="topmetrics-status error">{error}</div>}

    <section className="topmetrics-section"><header><div><span>PÉNZÜGY</span><h2>Értékesítés és pénzügyi teljesítmény</h2><p>Csak a ténylegesen lezárt és rögzített munkalapokból számolt mutatók.</p></div></header>{canFinancial?<><div className="topmetrics-grid">
      <Card title="Összes lezárt értékesítés" value={huf(revenue?.gross_revenue)} sub={`${num(revenue?.closed_workorders)} lezárt munkalap`}/><Card title="Szolgáltatásbevétel" value={huf(revenue?.service_revenue)} sub={`${pct(revenue?.service_share_percent)} bevételrész`}/><Card title="Termékbevétel" value={huf(revenue?.product_revenue)} sub={`${pct(revenue?.product_share_percent)} bevételrész`}/><Card title="Átlagos kosárérték" value={huf(summary?.avg_basket)} sub={`${num(appointments)} foglalás alapján`}/><Card title="Szolgáltatások átlagára" value={huf(revenue?.avg_service_price)} sub={`${num(revenue?.service_quantity)} értékesített tétel`}/><Card title="Termékek átlagára" value={huf(revenue?.avg_product_price)} sub={`${num(revenue?.product_quantity)} értékesített tétel`}/><Card title="Kedvezmények" value={huf(revenue?.discounts)} sub="Lezárt munkalapokon"/><Card title="Borravaló" value={huf(revenue?.tips)} sub="Lezárt munkalapokon"/><Card title="Fizetett összeg" value={huf(summary?.paid_total)} sub="Kimutatási időszak"/><Card title="Lezárt munkalapok" value={num(revenue?.closed_workorders)} sub="Pénzügyi zárással"/>
    </div><div className="topmetrics-chart-grid"><div className="topmetrics-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip formatter={(v:any)=>huf(Number(v||0))}/><Legend/><Line type="monotone" dataKey="revenue" name="Árbevétel" stroke="#7558dd" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="paid" name="Fizetett" stroke="#2f9ea0" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div><div className="topmetrics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis/><Tooltip/><Bar dataKey="appointments" name="Foglalások" fill="#8a70e4" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></div></>:<Restricted/>}</section>

    <section className="topmetrics-section"><header><div><span>VENDÉG ÉS MŰKÖDÉS</span><h2>CRM és időpont-teljesítmény</h2></div></header><div className="topmetrics-grid">
      <Card title="CRM látogatások" value={num(crm?.visits)} sub={`${num(crm?.unique_guests)} egyedi vendég`}/>{canFinancial&&<Card title="CRM vendégbevétel" value={huf(crm?.guest_revenue)} sub={`Átlag: ${huf(crm?.avg_guest_spend)}`}/>} {canFinancial&&<Card title="Átlagos vendégköltés" value={huf(crm?.avg_guest_spend)} sub="CRM látogatások alapján"/>}<Card title="Egyedi vendégek" value={num(crm?.unique_guests)} sub="Az időszakban"/><Card title="Új vendégek" value={num(crm?.new_guests)} sub="Első látogatás az időszakban"/><Card title="Visszatérő vendégek" value={num(crm?.returning_guests)} sub="Korábbi és aktuális látogatással"/><Card title="Inaktív vendégek" value={num(crm?.inactive_guests)} sub={`${num(crm?.inactive_after_days||60)}+ napja nem tértek vissza`} state={Number(crm?.inactive_guests||0)>0?"warning":undefined}/><Card title="Foglalások" value={num(appointments)} sub={`${num(completed)} teljesített`}/><Card title="Teljesítési arány" value={pct(completion)} sub={`${num(completed)} / ${num(appointments)}`}/><Card title="Lemondási arány" value={pct(cancellation)} sub={`${num(cancelled)} lemondás`} state={cancellation>10?"warning":undefined}/><Card title="No-show arány" value={pct(noShowRate)} sub={`${num(noShow)} meg nem jelenés`} state={noShowRate>5?"critical":undefined}/><Card title="Operatív kihasználtság" value={pct(utilization)} sub="Teljesített / összes foglalás"/></div></section>

    <section className="topmetrics-section"><header><div><span>RAKTÁR</span><h2>Készletállapot és érték</h2></div></header><div className="topmetrics-grid">{canFinancial&&<Card title="Készletérték" value={huf(stock?.inventory_value)} sub="Aktuális bekerülési értéken"/>}<Card title="Készletezett termékek" value={num(stock?.stocked_products)} sub="Aktív készletegyenleg"/><Card title="Alacsony készlet" value={num(stock?.low_stock_count)} sub="Minimum szinten vagy alatta" state={Number(stock?.low_stock_count||0)>0?"warning":undefined}/><Card title="Kifogyott termék" value={num(stock?.out_of_stock_count)} sub="Nulla vagy negatív készlet" state={Number(stock?.out_of_stock_count||0)>0?"critical":undefined}/></div>{canFinancial&&<p className="topmetrics-source-note">A készletérték csak azoknál a termékeknél pontos, amelyekhez a unit_cost mező fel van töltve.</p>}</section>

    <section className="topmetrics-section"><header><div><span>MUNKATÁRSAK</span><h2>Teljesítmény {canFinancial?"és lezárt bevétel":""}</h2></div></header>{canFinancial?<div className="topmetrics-chart-grid"><div className="topmetrics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={staffData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(v:any)=>huf(Number(v||0))}/><Bar dataKey="revenue" name="Lezárt bevétel" fill="#7558dd" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div><div className="topmetrics-table-wrap"><table className="topmetrics-table"><thead><tr><th>Munkatárs</th><th>Lezárt munkalap</th><th>Bevétel</th><th>Átlagos kosár</th></tr></thead><tbody>{(management?.staff||[]).map((r,i)=><tr key={`${r.employee_id||"x"}-${i}`}><td><strong>{r.employee_name}</strong></td><td>{num(r.workorder_count)}</td><td>{huf(r.revenue)}</td><td>{huf(r.avg_ticket)}</td></tr>)}{!management?.staff?.length&&<tr><td colSpan={4}><div className="topmetrics-empty">Nincs munkatársi adat a kiválasztott időszakban.</div></td></tr>}</tbody></table></div></div>:<div className="topmetrics-table-wrap"><table className="topmetrics-table"><thead><tr><th>Munkatárs</th><th>Lezárt munkalap</th></tr></thead><tbody>{(management?.staff||[]).map((r,i)=><tr key={`${r.employee_id||"x"}-${i}`}><td><strong>{r.employee_name}</strong></td><td>{num(r.workorder_count)}</td></tr>)}{!management?.staff?.length&&<tr><td colSpan={2}><div className="topmetrics-empty">Nincs munkatársi adat a kiválasztott időszakban.</div></td></tr>}</tbody></table></div>}</section>
  </main>
}
