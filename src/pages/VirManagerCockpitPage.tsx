import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations, LocationRow } from "../api/locations";
import { getVirManagerCockpit, VirCockpitResponse } from "../api/virManagement";
import "./VirManagement.css";

const money=(value:number)=>new Intl.NumberFormat("hu-HU",{style:"currency",currency:"HUF",maximumFractionDigits:0}).format(Number(value||0));
const num=(value:number)=>new Intl.NumberFormat("hu-HU").format(Number(value||0));
const today=()=>new Date().toISOString().slice(0,10);
const statusLabel:Record<string,string>={OPEN:"Nyitott",IN_PROGRESS:"Folyamatban",BLOCKED:"Blokkolt",WAITING_APPROVAL:"Jóváhagyásra vár",DONE:"Kész"};
const priorityLabel:Record<string,string>={CRITICAL:"Kritikus",HIGH:"Magas",MEDIUM:"Közepes",LOW:"Alacsony"};
const statusClass:Record<string,string>={OPEN:"open",IN_PROGRESS:"progress",BLOCKED:"blocked",WAITING_APPROVAL:"approval",DONE:"done"};

export default function VirManagerCockpitPage(){
  const navigate=useNavigate();
  const [date,setDate]=useState(today());
  const [locationId,setLocationId]=useState("");
  const [locations,setLocations]=useState<LocationRow[]>([]);
  const [data,setData]=useState<VirCockpitResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{getLocations().then(setLocations).catch(()=>setLocations([]));},[]);
  const load=useCallback(async()=>{setLoading(true);setError("");try{setData(await getVirManagerCockpit({date,locationId:locationId||undefined}));}catch(err:any){setError(err?.response?.data?.error||err?.message||"A Manager Cockpit nem tölthető be.");}finally{setLoading(false);}},[date,locationId]);
  useEffect(()=>{load();},[load]);
  const targetPercent=Number(data?.kpis.revenue_target_percent||0);
  const revenueTone=useMemo(()=>targetPercent>=100?"is-good":targetPercent>=90?"is-warning":"is-critical",[targetPercent]);
  const openActions=Number(data?.actions.open_count||0),critical=Number(data?.actions.critical_count||0);
  return <div className="vir-management-page">
    <div className="vir-management-header"><div><h1 className="vir-management-title">VIR Manager Cockpit</h1><div className="vir-management-subtitle">Mai üzleti állapot, kockázatok és vezetői teendők egy képernyőn.</div></div><div className="vir-management-actions">
      <label className="vir-field"><span>Dátum</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="vir-field"><span>Telephely</span><select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Összes telephely</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/dashboard")}>Részletes VIR</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/intelligence")}>VIR Intelligence P0</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p1")}>VIR Intelligence P1</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p2")}>VIR Intelligence P2</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p3")}>VIR Intelligence P3</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p4")}>VIR Intelligence P4</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p5")}>VIR Intelligence P5</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p6")}>VIR Intelligence P6</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p7")}>VIR Intelligence P7</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p8")}>VIR Intelligence P8</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p9")}>Marketing automatizálás P9</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p10")}>Revenue Autopilot P10</button>
      <button className="vir-button secondary" onClick={()=>navigate("/admin/vir/p3/revenue-leakage")}>Revenue Leakage</button>
      <button className="vir-button" onClick={()=>navigate("/admin/vir/actions")}>Akcióközpont {openActions?`(${openActions})`:""}</button>
    </div></div>
    {error&&<div className="vir-error">{error}</div>}{loading&&!data?<div className="vir-spinner">Vezetői adatok betöltése…</div>:null}
    {data&&<><div className="vir-kpi-grid">
      <div className={`vir-kpi ${revenueTone}`}><div className="vir-kpi-label">Mai árbevétel</div><div className="vir-kpi-value">{money(data.kpis.revenue_total)}</div><div className="vir-kpi-note">Terv: {money(data.kpis.daily_revenue_target)} · {data.kpis.revenue_target_percent===null?"n/a":`${data.kpis.revenue_target_percent}%`}</div><div className="vir-progress"><span style={{width:`${Math.min(100,targetPercent)}%`}}/></div></div>
      <div className="vir-kpi"><div className="vir-kpi-label">Időpontok</div><div className="vir-kpi-value">{num(data.kpis.appointments_count)}</div><div className="vir-kpi-note">Teljesítve: {num(data.kpis.completed_count)} · munkaidő: {data.kpis.scheduled_hours} óra</div></div>
      <div className="vir-kpi"><div className="vir-kpi-label">Átlagos kosár</div><div className="vir-kpi-value">{money(data.kpis.avg_basket)}</div><div className="vir-kpi-note">Fizetett összeg: {money(data.kpis.paid_total)}</div></div>
      <div className={data.kpis.no_show_rate_percent>5?"vir-kpi is-warning":"vir-kpi"}><div className="vir-kpi-label">No-show</div><div className="vir-kpi-value">{data.kpis.no_show_rate_percent.toFixed(1)}%</div><div className="vir-kpi-note">{num(data.kpis.no_show_count)} eset</div></div>
      <div className={critical?"vir-kpi is-critical":"vir-kpi is-good"}><div className="vir-kpi-label">Kritikus akciók</div><div className="vir-kpi-value">{critical}</div><div className="vir-kpi-note">Összes nyitott: {openActions}</div></div>
      <div className={data.actions.overdue_count?"vir-kpi is-warning":"vir-kpi"}><div className="vir-kpi-label">Lejárt / jóváhagyás</div><div className="vir-kpi-value">{data.actions.overdue_count} / {data.actions.approval_count}</div><div className="vir-kpi-note">Határidőn túl / döntésre vár</div></div>
    </div><div className="vir-management-grid"><div><section className="vir-panel"><div className="vir-panel-header"><div><div className="vir-panel-title">Ami ma vezetői figyelmet kér</div><div className="vir-panel-muted">Prioritás, SLA és forrás alapján rendezve.</div></div><button className="vir-link-button" onClick={()=>navigate("/admin/vir/actions")}>Összes teendő →</button></div><div className="vir-action-list">{data.top_actions.length===0?<div className="vir-empty">Nincs nyitott vezetői akció.</div>:data.top_actions.map(item=><article key={item.id} className={`vir-action-card is-${item.priority.toLowerCase()}`}><div className="vir-action-card-head"><div><div className="vir-action-title">{item.title}</div><div className="vir-action-description">{item.description}</div></div>{item.source_route&&<button className="vir-link-button" onClick={()=>navigate(item.source_route!)}>Forrás →</button>}</div><div className="vir-badge-row"><span className={`vir-badge ${item.priority.toLowerCase()}`}>{priorityLabel[item.priority]}</span><span className={`vir-badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span><span className="vir-badge">{item.source}</span>{item.assignee_name&&<span className="vir-badge">Felelős: {item.assignee_name}</span>}{item.due_at&&<span className="vir-badge">Határidő: {new Date(item.due_at).toLocaleString("hu-HU")}</span>}</div></article>)}</div></section></div><div><section className="vir-panel"><div className="vir-panel-title">Akcióállapot</div><div className="vir-stat-line"><span>Nyitott</span><strong>{data.actions.open_count}</strong></div><div className="vir-stat-line"><span>Kritikus</span><strong>{data.actions.critical_count}</strong></div><div className="vir-stat-line"><span>Magas prioritás</span><strong>{data.actions.high_count}</strong></div><div className="vir-stat-line"><span>Lejárt</span><strong>{data.actions.overdue_count}</strong></div><div className="vir-stat-line"><span>Jóváhagyásra vár</span><strong>{data.actions.approval_count}</strong></div></section><section className="vir-panel"><div className="vir-panel-header"><div className="vir-panel-title">Források terheltsége</div></div><table className="vir-source-table"><thead><tr><th>Forrás</th><th>Nyitott</th><th>Sürgős</th></tr></thead><tbody>{data.source_health.length===0?<tr><td colSpan={3} className="vir-empty">Nincs aktív forrás.</td></tr>:data.source_health.map(row=><tr key={row.source}><td>{row.source}</td><td>{row.open_count}</td><td><strong>{row.urgent_count}</strong></td></tr>)}</tbody></table></section></div></div></>}
  </div>;
}
