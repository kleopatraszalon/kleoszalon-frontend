import React,{useEffect,useState}from"react";
import api from"../api/api";
import{getVirDashboard,type VirDashboardSummary}from"../api/vir";
import{useCapabilities}from"../hooks/useCapabilities";
import VirTopMetricsPage from"./VirTopMetricsPage";
import"./VirReportExtras.css";

type ManagementSummary={
 revenue:{gross_revenue:number;closed_workorders:number};
 stock:{low_stock_count:number;out_of_stock_count:number;stocked_products:number};
 crm:{unique_guests:number;new_guests:number;returning_guests:number};
};
const huf=(v:number)=>new Intl.NumberFormat("hu-HU",{style:"currency",currency:"HUF",maximumFractionDigits:0}).format(Number(v||0));
const num=(v:number)=>new Intl.NumberFormat("hu-HU").format(Number(v||0));
const pct=(v:number)=>`${Number(v||0).toFixed(1)}%`;
const ratio=(a:number,b:number)=>b>0?a/b*100:0;
const iso=(d:Date)=>d.toISOString().slice(0,10);
function Kpi({title,value,sub,state}:{title:string;value:string;sub:string;state?:"warning"|"critical"}){return <article className={`vir-extra-kpi ${state||""}`}><small>{title}</small><strong>{value}</strong><span>{sub}</span></article>}

export default function VirTopMetricsExtendedPage(){
 const{menu}=useCapabilities();
 const canFinancial=menu("analytics.main","can_view_financial");
 const[data,setData]=useState<ManagementSummary|null>(null),[summary,setSummary]=useState<VirDashboardSummary|null>(null),[error,setError]=useState("");
 const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),1),from=iso(start),to=iso(today),days=Math.max(1,today.getDate());
 useEffect(()=>{let active=true;const locationId=localStorage.getItem("kleo_location_id")||undefined;(async()=>{try{const[s,m]=await Promise.all([getVirDashboard({from,to,locationId}),api.get<ManagementSummary>("/transactions/cashier/management-summary",{params:{from,to,location_id:locationId}}).then(r=>r.data)]);if(active){setSummary(s);setData(m)}}catch(e:any){if(active)setError(e?.response?.data?.message||"")}})();return()=>{active=false}},[from,to]);
 const appointments=Number(summary?.appointments_count||0),completed=Number(summary?.completed_count||0),paid=Number(summary?.paid_total||0),revenue=Number(data?.revenue?.gross_revenue||0),guests=Number(data?.crm?.unique_guests||0),returning=Number(data?.crm?.returning_guests||0),newGuests=Number(data?.crm?.new_guests||0),stocked=Number(data?.stock?.stocked_products||0),alerts=Number(data?.stock?.low_stock_count||0)+Number(data?.stock?.out_of_stock_count||0),noShow=Number(summary?.no_show_rate_percent||0);
 return <>
  <section className="vir-extra-summary">
   <div className="vir-extra-summary-head"><div><span className="vir-extra-eyebrow">VEZETŐI GYORSMUTATÓK</span><h2>Aktuális havi kontrollpontok</h2></div><span>{from} – {to}</span></div>
   <div className="vir-extra-summary-body"><div className="vir-extra-grid">
    {canFinancial?<><Kpi title="Bevétel / nap" value={huf(revenue/days)} sub={`${days} eltelt nap alapján`}/><Kpi title="Bevétel / teljesített foglalás" value={completed?huf(revenue/completed):"—"} sub={`${num(completed)} teljesített foglalás`}/><Kpi title="Beszedési arány" value={pct(ratio(paid,revenue))} sub={`${huf(paid)} fizetett összeg`}/></>:<Kpi title="Pénzügyi KPI-k" value="Korlátozott" sub="Pénzügyi jogosultság szükséges"/>}
    <Kpi title="Visszatérési arány" value={pct(ratio(returning,guests))} sub={`${num(returning)} visszatérő vendég`}/><Kpi title="Új vendég arány" value={pct(ratio(newGuests,guests))} sub={`${num(newGuests)} új vendég`}/><Kpi title="Készletkockázat" value={pct(ratio(alerts,stocked))} sub={`${num(alerts)} kritikus / kifogyott tétel`} state={alerts>0?"warning":undefined}/><Kpi title="No-show arány" value={pct(noShow)} sub={`${num(summary?.no_show_count||0)} meg nem jelenés`} state={noShow>5?"critical":undefined}/><Kpi title="Foglalás teljesülés" value={pct(ratio(completed,appointments))} sub={`${num(completed)} / ${num(appointments)} foglalás`}/>
   </div>{error&&<div className="vir-extra-note">A gyorsmutatók egy része most nem frissíthető; az alábbi részletes kimutatás ettől függetlenül használható.</div>}</div>
  </section>
  <VirTopMetricsPage/>
 </>;
}
