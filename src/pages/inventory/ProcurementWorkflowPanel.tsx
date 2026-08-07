import React, { useEffect, useState } from "react";
import api from "../../api";
import "./ProcurementWorkflowPanel.css";

type Props={locationId:string;section?:string;onChanged?:()=>void};
type Settings={approval_threshold:number|string;price_variance_warning_pct:number|string};
type Pending={id:string|number;supplier_name:string;order_total:number|string;item_count:number|string;approval_requested_by?:string;approval_requested_at?:string};
type Perf={id:string|number;name:string;received_orders:number|string;on_time_rate:number|string;fill_rate:number|string;avg_price_variance_pct:number|string;last_delivery_at?:string|null};
type Alert={type:string;id:string|number;supplier_name:string;expected_at?:string;product_name?:string;variance_pct?:number|string;unit_cost?:number|string;actual_unit_cost?:number|string};
const huf=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;
const pct=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:1})}%`;
const arr=<T,>(v:any):T[]=>Array.isArray(v)?v:[];

export default function ProcurementWorkflowPanel({locationId,section="dashboard",onChanged}:Props){
 const[settings,setSettings]=useState<Settings>({approval_threshold:50000,price_variance_warning_pct:10});
 const[pending,setPending]=useState<Pending[]>([]);const[perf,setPerf]=useState<Perf[]>([]);const[alerts,setAlerts]=useState<Alert[]>([]);
 const[error,setError]=useState("");const[success,setSuccess]=useState("");const[saving,setSaving]=useState(false);
 async function load(){setError("");try{const[s,p,f,a]=await Promise.all([api.get("/api/transactions/procurement-workflow/settings"),api.get("/api/transactions/procurement-workflow/pending"),api.get("/api/transactions/procurement-workflow/supplier-performance"),api.get("/api/transactions/procurement-workflow/alerts")]);setSettings(s.data);setPending(arr<Pending>(p.data));setPerf(arr<Perf>(f.data));setAlerts(arr<Alert>(a.data));}catch(e:any){setError(e?.response?.data?.message||"A beszerzési kontrolladatok betöltése nem sikerült.")}}
 useEffect(()=>{void load()},[locationId]); // eslint-disable-line react-hooks/exhaustive-deps
 async function saveSettings(){setSaving(true);setError("");try{const r=await api.put("/api/transactions/procurement-workflow/settings",{approval_threshold:Number(settings.approval_threshold),price_variance_warning_pct:Number(settings.price_variance_warning_pct)});setSettings(r.data);setSuccess("A jóváhagyási szabályok frissültek.");}catch(e:any){setError(e?.response?.data?.message||"A beállítások mentése nem sikerült.")}finally{setSaving(false)}}
 async function approve(id:string|number){try{await api.post(`/api/transactions/procurement-workflow/orders/${id}/approve`,{});setSuccess(`A #${id} rendelés jóváhagyva.`);await load();onChanged?.()}catch(e:any){setError(e?.response?.data?.message||"A jóváhagyás nem sikerült.")}}
 async function reject(id:string|number){const reason=window.prompt("Elutasítás indoka:");if(!reason?.trim())return;try{await api.post(`/api/transactions/procurement-workflow/orders/${id}/reject`,{reason:reason.trim()});setSuccess(`A #${id} rendelés elutasítva.`);await load();onChanged?.()}catch(e:any){setError(e?.response?.data?.message||"Az elutasítás nem sikerült.")}}
 async function pdf(id:string|number){try{const r=await api.get(`/api/transactions/procurement-workflow/orders/${id}/document.pdf`,{responseType:"blob"});const url=URL.createObjectURL(r.data);window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e:any){setError(e?.response?.data?.message||"A PDF bizonylat nem készíthető el.")}}

 const showDashboard=section==="dashboard";
 const showApprovals=section==="approvals";
 const showPerformance=section==="performance";
 const showDeviations=section==="deviations";
 if(!showDashboard&&!showApprovals&&!showPerformance&&!showDeviations)return null;

 return <section className="pw-wrap">
  <header className="pw-head"><div><span>BESZERZÉSI KONTROLL</span><h2>{showApprovals?"Jóváhagyásra váró rendelések":showPerformance?"Beszállítói teljesítmény":showDeviations?"Ár- és határidő-eltérések":"Jóváhagyás, teljesítmény és eltérésfigyelés"}</h2><p>{showDashboard?"Értékhatár, vezetői döntések, rendelési bizonylat és beszállítói minőség egy helyen.":showApprovals?"A vezetői döntésre váró beszerzések külön munkalistában.":showPerformance?"Szállítási pontosság, teljesítési arány és áreltérés beszállítónként.":"Automatikusan észlelt késések és beszerzési áreltérések."}</p></div><button onClick={load}>Frissítés</button></header>
  {error&&<div className="pw-alert error">{error}</div>}{success&&<div className="pw-alert success">{success}</div>}

  {showDashboard&&<>
   <div className="pw-settings"><label>Vezetői jóváhagyási értékhatár (Ft)<input type="number" min="0" value={settings.approval_threshold} onChange={e=>setSettings({...settings,approval_threshold:e.target.value})}/></label><label>Áreltérés riasztási küszöb (%)<input type="number" min="0" step="0.1" value={settings.price_variance_warning_pct} onChange={e=>setSettings({...settings,price_variance_warning_pct:e.target.value})}/></label><button onClick={saveSettings} disabled={saving}>{saving?"Mentés…":"Szabályok mentése"}</button></div>
   <div className="pw-kpis"><div><strong>{pending.length}</strong><span>Jóváhagyásra vár</span></div><div><strong>{alerts.filter(a=>a.type==="late_delivery").length}</strong><span>Késő rendelés</span></div><div><strong>{alerts.filter(a=>a.type==="price_variance").length}</strong><span>Áreltérés</span></div><div><strong>{perf.length}</strong><span>Értékelt beszállító</span></div></div>
  </>}

  {(showDashboard||showApprovals)&&<article className="pw-card"><h3>Vezetői jóváhagyási sor</h3><div className="pw-table"><table><thead><tr><th>#</th><th>Beszállító</th><th>Érték</th><th>Tétel</th><th>Kérte</th><th></th></tr></thead><tbody>{pending.map(x=><tr key={String(x.id)}><td>#{x.id}</td><td><b>{x.supplier_name}</b></td><td>{huf(x.order_total)}</td><td>{x.item_count}</td><td>{x.approval_requested_by||"—"}</td><td className="pw-actions"><button onClick={()=>approve(x.id)}>Jóváhagyás</button><button className="danger" onClick={()=>reject(x.id)}>Elutasítás</button><button className="secondary" onClick={()=>pdf(x.id)}>PDF</button></td></tr>)}{!pending.length&&<tr><td colSpan={6} className="pw-empty">Nincs vezetői jóváhagyásra váró rendelés.</td></tr>}</tbody></table></div></article>}

  {(showDashboard||showDeviations)&&<article className="pw-card"><h3>Automatikus eltérésfigyelés</h3><div className="pw-alert-list">{alerts.map((a,i)=><div className={`pw-warning ${a.type}`} key={`${a.type}-${a.id}-${i}`}><b>{a.type==="late_delivery"?`Késő rendelés #${a.id}`:`Áreltérés #${a.id}`}</b><span>{a.supplier_name}{a.product_name?` · ${a.product_name}`:""}</span><small>{a.type==="late_delivery"?`Vállalt érkezés: ${a.expected_at?new Date(a.expected_at).toLocaleDateString("hu-HU"):"—"}`:`Eltérés: ${pct(a.variance_pct)} · rendelt ${huf(a.unit_cost)} → tényleges ${huf(a.actual_unit_cost)}`}</small></div>)}{!alerts.length&&<div className="pw-empty">Nincs aktív ár- vagy határidő-eltérés.</div>}</div></article>}

  {(showDashboard||showPerformance)&&<article className="pw-card"><h3>Beszállítói teljesítményértékelés</h3><div className="pw-table"><table><thead><tr><th>Beszállító</th><th>Teljesített rendelés</th><th>Határidőre</th><th>Teljesítési arány</th><th>Átlagos áreltérés</th><th>Utolsó szállítás</th></tr></thead><tbody>{perf.map(x=><tr key={String(x.id)}><td><b>{x.name}</b></td><td>{x.received_orders}</td><td><span className={Number(x.on_time_rate)<80?"pw-bad":"pw-good"}>{pct(x.on_time_rate)}</span></td><td>{pct(x.fill_rate)}</td><td className={Math.abs(Number(x.avg_price_variance_pct))>=Number(settings.price_variance_warning_pct)?"pw-bad":""}>{pct(x.avg_price_variance_pct)}</td><td>{x.last_delivery_at?new Date(x.last_delivery_at).toLocaleDateString("hu-HU"):"—"}</td></tr>)}{!perf.length&&<tr><td colSpan={6} className="pw-empty">Még nincs értékelhető beszállítói előzmény.</td></tr>}</tbody></table></div></article>}
 </section>
}
