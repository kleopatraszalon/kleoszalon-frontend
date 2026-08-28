import React,{useCallback,useEffect,useMemo,useState}from'react';
import{AlertTriangle,Boxes,ClipboardList,PackageSearch,RefreshCw,ShoppingCart,Wrench}from'lucide-react';
import api from'../../api';
import'./InventoryControlDashboard.css';

type Data={scope:{is_admin:boolean;central:boolean;location_id:string|null};kpis:any;at_risk:any[];requests:any[];procurement_needed:any[]};
const q=(v:any)=>Number(v||0).toLocaleString('hu-HU',{maximumFractionDigits:3});
const huf=(v:any)=>`${Math.round(Number(v||0)).toLocaleString('hu-HU')} Ft`;

export default function InventoryControlDashboard({locationId,refreshKey=0}:{locationId:string;refreshKey?:number}){
 const[data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const p=new URLSearchParams();if(locationId)p.set('location_id',locationId);const r=await api.get(`/api/transactions/inventory-control/summary${p.toString()?`?${p.toString()}`:''}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'A készletirányítási összesítő nem tölthető be.')}finally{setLoading(false)}},[locationId]);
 useEffect(()=>{void load()},[load,refreshKey]);
 const alerts=useMemo(()=>{if(!data)return[];const a:string[]=[];if(Number(data.kpis.out_count)>0)a.push(`${data.kpis.out_count} termék kifogyott.`);if(Number(data.kpis.low_count)>0)a.push(`${data.kpis.low_count} termék elérte vagy alulmúlta a minimum készletszintet.`);if(Number(data.kpis.procurement_needed_count)>0)a.push(`${data.kpis.procurement_needed_count} szalonigényt a központi készlet nem tud teljesen fedezni; beszállítói beszerzés szükséges.`);return a},[data]);
 return <section className="icd">
  <header className="icd-head"><div><span>KÉSZLETIRÁNYÍTÁS</span><h2>Munkalap → fogyás → utánpótlás</h2><p>A munkalapok anyagfelhasználása, minimumkészlet, szalonigény és központi beszerzési szükséglet egy nézetben.</p></div><button onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?'Frissítés…':'Frissítés'}</button></header>
  {error&&<div className="icd-error">{error}</div>}
  {data&&<>
   <div className="icd-kpis">
    <article><Boxes/><small>Készletérték</small><b>{huf(data.kpis.stock_value)}</b><em>{data.kpis.stock_items||0} készletezett termék</em></article>
    <article className={Number(data.kpis.at_risk_count)>0?'warn':''}><AlertTriangle/><small>Minimum / kifogyott</small><b>{data.kpis.at_risk_count||0}</b><em>{data.kpis.out_count||0} kifogyott</em></article>
    <article><Wrench/><small>7 nap munkalap-fogyás</small><b>{q(data.kpis.consumption_7d_quantity)}</b><em>{data.kpis.consumption_7d_workorders||0} munkalap · {huf(data.kpis.consumption_7d_value)}</em></article>
    <article><ClipboardList/><small>Nyitott szalonigény</small><b>{data.kpis.open_request_count||0}</b><em>{q(data.kpis.open_request_quantity)} egység hátralék</em></article>
    <article className={Number(data.kpis.procurement_needed_count)>0?'warn':''}><ShoppingCart/><small>Beszerzés szükséges</small><b>{data.kpis.procurement_needed_count||0}</b><em>Központi készlettel nem fedezett</em></article>
   </div>
   {alerts.length>0&&<div className="icd-alert"><AlertTriangle size={18}/><div>{alerts.map(x=><p key={x}>{x}</p>)}</div></div>}
   <div className="icd-grid">
    <article className="icd-card"><header><div><span>KÉSZLETKOCKÁZAT</span><h3>Minimum alatt lévő tételek</h3></div><PackageSearch size={20}/></header><div className="icd-table"><table><thead><tr><th>Termék</th><th>Készlet</th><th>Minimum</th><th>Javasolt feltöltés</th><th>Nyitott igény</th></tr></thead><tbody>{data.at_risk.slice(0,12).map(x=><tr key={x.id}><td><b>{x.product_name}</b><small>{[x.brand,x.internal_code].filter(Boolean).join(' · ')}</small></td><td className={Number(x.quantity)<=0?'bad':''}>{q(x.quantity)}</td><td>{q(x.min_quantity)}</td><td>{q(x.suggested_replenishment)}</td><td>{x.open_request_id?<span className="icd-pill">{x.open_request_status} · {q(x.open_request_quantity)}</span>:'—'}</td></tr>)}</tbody></table>{!data.at_risk.length&&<div className="icd-empty">Nincs minimum alatti vagy kifogyott tétel.</div>}</div></article>
    <article className="icd-card"><header><div><span>UTÁNPÓTLÁS</span><h3>Nyitott készletigények</h3></div><ClipboardList size={20}/></header><div className="icd-table"><table><thead><tr><th>Szalon / termék</th><th>Igény</th><th>Teljesített</th><th>Központ</th><th>Forrás</th></tr></thead><tbody>{data.requests.slice(0,12).map(x=><tr key={x.id}><td><b>{x.location_name}</b><small>{x.product_name}</small></td><td>{q(x.approved_quantity||x.requested_quantity)}</td><td>{q(x.supplied_quantity)}</td><td>{q(x.central_quantity)}</td><td><span className="icd-pill">{x.source||'manual'}</span></td></tr>)}</tbody></table>{!data.requests.length&&<div className="icd-empty">Nincs nyitott készletigény.</div>}</div>{data.procurement_needed.length>0&&<button className="icd-procure" onClick={()=>{window.location.href='/warehouse/central-supply'}}>Központi ellátás és beszerzés megnyitása</button>}</article>
   </div>
  </>}
 </section>
}
