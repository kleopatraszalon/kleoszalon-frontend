import React,{useEffect,useMemo,useState}from'react';
import{AlertTriangle,CheckCircle2,ClipboardCheck,Loader2,PackageCheck,UserRound,Wrench}from'lucide-react';
import{apiFetch}from'../../utils/api';
import type{WorkOrderMaterial}from'./WorkOrderMaterialsPanel';
import'./WorkOrderReviewPanel.css';

type Service={id:string;name:string;price?:number|string|null;duration_minutes?:number|string|null};
type Requirement={service_id:string;product_id:string;default_quantity:number|string;unit?:string|null;required?:boolean;service_name?:string;product_name?:string;available_stock?:number|string|null};
type Props={
 locationId:string;
 employeeName?:string|null;
 clientName?:string|null;
 clientPhone?:string|null;
 clientEmail?:string|null;
 title:string;
 services:Service[];
 materials:WorkOrderMaterial[];
 grossTotal:number;
 loyaltyUsed:boolean;
 onReadyChange?:(ready:boolean)=>void;
 disabled?:boolean;
};
const money=(v:unknown)=>`${Number(v||0).toLocaleString('hu-HU',{maximumFractionDigits:0})} Ft`;
export default function WorkOrderReviewPanel({locationId,employeeName,clientName,clientPhone,clientEmail,title,services,materials,grossTotal,loyaltyUsed,onReadyChange,disabled}:Props){
 const[requirements,setRequirements]=useState<Requirement[]>([]);const[loading,setLoading]=useState(false);const[loadError,setLoadError]=useState('');
 const serviceIds=useMemo(()=>services.map(x=>String(x.id)),[services]);
 useEffect(()=>{let alive=true;if(!locationId||!serviceIds.length){setRequirements([]);setLoadError('');setLoading(false);return()=>{alive=false}}setLoading(true);setLoadError('');const q=new URLSearchParams({location_id:locationId,service_ids:serviceIds.join(',')});apiFetch<{requirements?:Requirement[]}>(`/api/transactions/workorder-materials/plan?${q.toString()}`).then(data=>{if(alive)setRequirements(Array.isArray(data.requirements)?data.requirements:[])}).catch((e:any)=>{if(alive){setRequirements([]);setLoadError(e?.message||'Az anyag-előírások ellenőrzése nem sikerült.')}}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[locationId,serviceIds.join(',')]);
 const selectedMap=useMemo(()=>new Map(materials.map(m=>[String(m.productId),m])),[materials]);
 const missingRequired=useMemo(()=>requirements.filter(r=>r.required!==false).filter(r=>{const m=selectedMap.get(String(r.product_id));return !m||Number(m.quantity||0)<Number(r.default_quantity||0)}),[requirements,selectedMap]);
 const stockProblems=useMemo(()=>materials.filter(m=>Number(m.quantity||0)<=0||(m.availableStock!=null&&Number(m.quantity||0)>Number(m.availableStock))),[materials]);
 const issues=useMemo(()=>{const out:{key:string;text:string}[]=[];if(!locationId)out.push({key:'location',text:'Nincs kiválasztott szalon.'});if(!employeeName)out.push({key:'employee',text:'Nincs kiválasztott munkatárs.'});if(!String(clientName||'').trim())out.push({key:'client',text:'A vendég neve hiányzik.'});if(!String(title||'').trim()&&!services.length&&!materials.length)out.push({key:'title',text:'A munkalapnak nincs címe vagy tétele.'});if(!services.length&&!materials.length)out.push({key:'items',text:'Legalább egy szolgáltatás vagy termék szükséges.'});for(const r of missingRequired)out.push({key:`req-${r.product_id}`,text:`Kötelező anyag hiányzik: ${r.product_name||r.product_id} (${Number(r.default_quantity||0).toLocaleString('hu-HU')} ${r.unit||'db'}).`});for(const m of stockProblems)out.push({key:`stock-${m.productId}`,text:`Készletprobléma: ${m.name}.`});if(loadError)out.push({key:'material-check',text:loadError});return out},[locationId,employeeName,clientName,title,services.length,materials.length,missingRequired,stockProblems,loadError]);
 const ready=!loading&&issues.length===0;
 useEffect(()=>{onReadyChange?.(ready)},[ready,onReadyChange]);
 const contact=[clientPhone,clientEmail].filter(Boolean).join(' · ');
 return <section className={`workorder-review ${ready?'is-ready':'has-issues'}`} aria-label="Munkalap ellenőrzés">
  <header className="workorder-review__header"><div><span>5. LÉPÉS</span><h2><ClipboardCheck/> Ellenőrzés</h2><p>A fizetés előtt ellenőrizd a vendéget, tételeket, kötelező anyagokat, készletet és végösszeget.</p></div><strong>{loading?<><Loader2 className="spin"/> Ellenőrzés…</>:ready?<><CheckCircle2/> Fizetésre kész</>:<><AlertTriangle/> {issues.length} javítandó</>}</strong></header>
  <div className="workorder-review__grid">
   <article><UserRound/><div><small>Vendég</small><b>{clientName||'Nincs megadva'}</b><span>{contact||'Nincs kapcsolattartási adat'}</span></div></article>
   <article><Wrench/><div><small>Munkatárs / szolgáltatás</small><b>{employeeName||'Nincs kiválasztva'}</b><span>{services.length} szolgáltatás · {services.reduce((n,s)=>n+Number(s.duration_minutes||0),0)} perc</span></div></article>
   <article><PackageCheck/><div><small>Anyag / készlet</small><b>{materials.length} anyagtétel</b><span>{requirements.filter(r=>r.required!==false).length} kötelező előírás · {stockProblems.length} készletprobléma</span></div></article>
   <article className="workorder-review__total"><ClipboardCheck/><div><small>Bruttó végösszeg</small><b>{money(grossTotal)}</b><span>{loyaltyUsed?'Hűség/bérlet/kupon elszámolás kiválasztva':'Normál fizetési folyamat'}</span></div></article>
  </div>
  {issues.length>0?<div className="workorder-review__issues"><b>Fizetés előtt javítandó:</b>{issues.map(x=><div key={x.key}><AlertTriangle/>{x.text}</div>)}</div>:<div className="workorder-review__ok"><CheckCircle2/><span><b>A munkalap ellenőrzése rendben.</b> A Fizetés lépés megnyitható.</span></div>}
  {disabled&&<div className="workorder-review__disabled">A meglévő időponthoz tartozó lezárt munkalap ezen a képernyőn nem módosítható.</div>}
 </section>;
}
