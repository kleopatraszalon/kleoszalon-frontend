import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./ProcurementPanel.css";

type Suggestion = {
  balance_id: string | number; product_id: string; product_name: string; internal_code?: string|null; brand?: string|null;
  location_id?: string|null; current_quantity: number|string; min_quantity: number|string; unit_cost: number|string;
  suggested_quantity: number|string; expected_cost: number|string;
};
type Order = {
  id: string|number; location_id?:string|null; supplier_name:string; status:string; expected_at?:string|null; note?:string|null;
  expected_total:number|string; received_total:number|string; item_count:number|string; created_at:string;
};
type OrderItem = { id:string|number; product_name:string; ordered_quantity:number|string; received_quantity:number|string; unit_cost:number|string; actual_unit_cost?:number|string|null };
type OrderDetail = Order & { items: OrderItem[] };

type Props = { locationId: string; onInventoryChanged?: () => void };

const statusLabels:Record<string,string>={draft:"Piszkozat",ordered:"Megrendelve",partially_received:"Részben beérkezett",received:"Beérkezett",cancelled:"Visszavonva"};
const huf=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;
const qty=(v:unknown)=>Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:3});
const arr=<T,>(v:any):T[]=>Array.isArray(v)?v:Array.isArray(v?.items)?v.items:[];

export default function ProcurementPanel({locationId,onInventoryChanged}:Props){
  const[suggestions,setSuggestions]=useState<Suggestion[]>([]);const[orders,setOrders]=useState<Order[]>([]);const[detail,setDetail]=useState<OrderDetail|null>(null);
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");const[success,setSuccess]=useState("");
  const[supplier,setSupplier]=useState("");const[selected,setSelected]=useState<Record<string,boolean>>({});const[expectedAt,setExpectedAt]=useState("");
  const[receive,setReceive]=useState<Record<string,string>>({});const[receiveCost,setReceiveCost]=useState<Record<string,string>>({});
  const query=locationId?`?location_id=${encodeURIComponent(locationId)}`:"";

  async function load(){setLoading(true);setError("");try{const[s,o]=await Promise.all([api.get(`/api/transactions/procurement/suggestions${query}`),api.get(`/api/transactions/procurement/orders${query}`)]);setSuggestions(arr<Suggestion>(s.data));setOrders(arr<Order>(o.data));}catch(e:any){setError(e?.response?.data?.message||"A beszerzési adatok betöltése nem sikerült.");}finally{setLoading(false)}}
  useEffect(()=>{void load()},[locationId]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedSuggestions=useMemo(()=>suggestions.filter(s=>selected[String(s.balance_id)]),[suggestions,selected]);
  const selectedCost=useMemo(()=>selectedSuggestions.reduce((a,s)=>a+Number(s.expected_cost||0),0),[selectedSuggestions]);

  async function createOrder(){setError("");setSuccess("");if(!supplier.trim())return setError("Add meg a beszállítót.");if(!selectedSuggestions.length)return setError("Válassz legalább egy utánrendelési javaslatot.");try{await api.post("/api/transactions/procurement/orders",{location_id:locationId||null,supplier_name:supplier.trim(),expected_at:expectedAt||null,note:"Automatikus utánrendelési javaslatokból",items:selectedSuggestions.map(s=>({product_id:s.product_id,ordered_quantity:Number(s.suggested_quantity),unit_cost:Number(s.unit_cost)}))});setSuccess("A beszerzési rendelés elkészült.");setSelected({});setSupplier("");setExpectedAt("");await load();}catch(e:any){setError(e?.response?.data?.message||"A rendelés létrehozása nem sikerült.")}}
  async function status(id:string|number,status:string){try{await api.patch(`/api/transactions/procurement/orders/${id}/status`,{status});await load();if(detail?.id===id)await open(id)}catch(e:any){setError(e?.response?.data?.message||"A státusz módosítása nem sikerült.")}}
  async function open(id:string|number){try{const r=await api.get(`/api/transactions/procurement/orders/${id}`);setDetail(r.data);const q:Record<string,string>={};const c:Record<string,string>={};(r.data.items||[]).forEach((x:OrderItem)=>{q[String(x.id)]=String(Math.max(0,Number(x.ordered_quantity)-Number(x.received_quantity)));c[String(x.id)]=String(x.actual_unit_cost??x.unit_cost??0)});setReceive(q);setReceiveCost(c)}catch(e:any){setError(e?.response?.data?.message||"A rendelés nem tölthető be.")}}
  async function receiveOrder(){if(!detail)return;const items=detail.items.map(i=>({item_id:i.id,received_quantity:Number(receive[String(i.id)]||0),unit_cost:Number(receiveCost[String(i.id)]||i.unit_cost||0)})).filter(x=>x.received_quantity>0);if(!items.length)return setError("Adj meg legalább egy pozitív bevételezendő mennyiséget.");try{await api.post(`/api/transactions/procurement/orders/${detail.id}/receive`,{items});setSuccess("A bevételezés megtörtént, a készlet frissült.");await open(detail.id);await load();onInventoryChanged?.()}catch(e:any){setError(e?.response?.data?.message||"A bevételezés nem sikerült.")}}

  return <div className="procurement">
    {error&&<div className="proc-alert error">{error}</div>}{success&&<div className="proc-alert success">{success}</div>}
    <div className="proc-kpis"><div><strong>{suggestions.length}</strong><span>Utánrendelendő termék</span></div><div><strong>{orders.filter(o=>!["received","cancelled"].includes(o.status)).length}</strong><span>Nyitott rendelés</span></div><div><strong>{huf(suggestions.reduce((a,s)=>a+Number(s.expected_cost||0),0))}</strong><span>Javasolt beszerzési érték</span></div><div><strong>{orders.filter(o=>o.status==="partially_received").length}</strong><span>Részben beérkezett</span></div></div>
    <div className="proc-grid">
      <section className="proc-card"><header><div><span>AUTOMATIKUS UTÁNRENDELÉS</span><h2>Beszerzési javaslatok</h2><p>A minimum készletszint alá eső termékeket a rendszer kétszeres minimumszintig töltené vissza.</p></div><button onClick={load}>Frissítés</button></header>
        <div className="proc-orderbar"><input placeholder="Beszállító neve" value={supplier} onChange={e=>setSupplier(e.target.value)}/><input type="date" value={expectedAt} onChange={e=>setExpectedAt(e.target.value)}/><strong>{selectedSuggestions.length} tétel · {huf(selectedCost)}</strong><button onClick={createOrder}>Rendelés létrehozása</button></div>
        <div className="proc-table"><table><thead><tr><th></th><th>Termék</th><th>Készlet</th><th>Minimum</th><th>Javasolt rendelés</th><th>Egységár</th><th>Várható költség</th></tr></thead><tbody>{suggestions.map(s=><tr key={String(s.balance_id)}><td><input type="checkbox" checked={!!selected[String(s.balance_id)]} onChange={e=>setSelected(x=>({...x,[String(s.balance_id)]:e.target.checked}))}/></td><td><b>{s.product_name}</b><small>{[s.brand,s.internal_code].filter(Boolean).join(" · ")}</small></td><td>{qty(s.current_quantity)}</td><td>{qty(s.min_quantity)}</td><td><b>{qty(s.suggested_quantity)}</b></td><td>{huf(s.unit_cost)}</td><td><b>{huf(s.expected_cost)}</b></td></tr>)}{!loading&&!suggestions.length&&<tr><td colSpan={7} className="proc-empty">Nincs minimum alatti készlet. Jelenleg nincs automatikus utánrendelési javaslat.</td></tr>}</tbody></table></div>
      </section>
      <section className="proc-card"><header><div><span>BESZERZÉSI FOLYAMAT</span><h2>Rendelések</h2><p>Piszkozat → megrendelve → részben/teljesen beérkezett.</p></div></header><div className="proc-table"><table><thead><tr><th>#</th><th>Beszállító</th><th>Státusz</th><th>Tétel</th><th>Várható érték</th><th>Várható érkezés</th><th></th></tr></thead><tbody>{orders.map(o=><tr key={String(o.id)}><td>#{o.id}</td><td><b>{o.supplier_name}</b></td><td><span className={`proc-status ${o.status}`}>{statusLabels[o.status]||o.status}</span></td><td>{o.item_count}</td><td>{huf(o.expected_total)}</td><td>{o.expected_at?new Date(o.expected_at).toLocaleDateString("hu-HU"):"—"}</td><td><button onClick={()=>open(o.id)}>Megnyitás</button></td></tr>)}{!loading&&!orders.length&&<tr><td colSpan={7} className="proc-empty">Még nincs beszerzési rendelés.</td></tr>}</tbody></table></div></section>
    </div>
    {detail&&<div className="proc-modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setDetail(null)}}><div className="proc-modal"><header><div><span>BESZERZÉSI RENDELÉS #{detail.id}</span><h2>{detail.supplier_name}</h2><p>{statusLabels[detail.status]||detail.status}</p></div><button onClick={()=>setDetail(null)}>×</button></header><div className="proc-detail-actions">{detail.status==="draft"&&<button onClick={()=>status(detail.id,"ordered")}>Megrendelve státusz</button>}{!["received","cancelled"].includes(detail.status)&&<button className="danger" onClick={()=>status(detail.id,"cancelled")}>Visszavonás</button>}</div><div className="proc-table"><table><thead><tr><th>Termék</th><th>Rendelt</th><th>Beérkezett</th><th>Most bevételez</th><th>Tényleges egységár</th></tr></thead><tbody>{detail.items.map(i=>{const remain=Math.max(0,Number(i.ordered_quantity)-Number(i.received_quantity));return <tr key={String(i.id)}><td><b>{i.product_name}</b></td><td>{qty(i.ordered_quantity)}</td><td>{qty(i.received_quantity)}</td><td><input type="number" step="0.001" min="0" max={remain} disabled={remain<=0} value={receive[String(i.id)]||""} onChange={e=>setReceive(x=>({...x,[String(i.id)]:e.target.value}))}/></td><td><input type="number" step="1" min="0" disabled={remain<=0} value={receiveCost[String(i.id)]||""} onChange={e=>setReceiveCost(x=>({...x,[String(i.id)]:e.target.value}))}/></td></tr>})}</tbody></table></div>{!["received","cancelled"].includes(detail.status)&&<footer><button onClick={receiveOrder}>Bevételezés és készletfrissítés</button></footer>}</div></div>}
  </div>
}
