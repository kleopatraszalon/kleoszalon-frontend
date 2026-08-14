import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

type Warehouse={id:string|number;name:string;location_id?:string|null;location_name?:string|null};
type Product={id:string;name:string;internal_code?:string|null;brand?:string|null;lot_tracking_enabled:boolean;expiry_tracking_enabled:boolean;fefo_enabled:boolean};
type LotRow={lot_balance_id:string;warehouse_id:string;warehouse_name:string;location_id?:string|null;lot_id:string;product_id:string;product_name:string;internal_code?:string|null;brand?:string|null;lot_code:string;manufactured_at?:string|null;expires_at?:string|null;quantity:number|string;unit_cost:number|string;expiry_status:"expired"|"expiring"|"ok"|"no_expiry";days_to_expiry?:number|null;fefo_enabled:boolean};
type Summary={lot_count?:number;expired_lots?:number;expiring_lots?:number;expired_quantity?:number|string;expiring_quantity?:number|string};

const card:React.CSSProperties={background:"var(--surface,#fff)",border:"1px solid rgba(20,20,20,.09)",borderRadius:18,padding:18,boxShadow:"0 10px 30px rgba(0,0,0,.045)"};
const input:React.CSSProperties={width:"100%",minHeight:42,border:"1px solid rgba(20,20,20,.16)",borderRadius:11,padding:"8px 11px",background:"#fff",boxSizing:"border-box"};
const button:React.CSSProperties={border:0,borderRadius:11,padding:"10px 15px",fontWeight:700,cursor:"pointer",background:"#151515",color:"#fff"};
const secondary:React.CSSProperties={...button,background:"#f2f0ee",color:"#222",border:"1px solid rgba(20,20,20,.08)"};
const fmt=(v:any)=>Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:3});
const money=(v:any)=>Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:2})+" Ft";
const date=(v:any)=>v?new Date(String(v)).toLocaleDateString("hu-HU"):"—";
const getMessage=(e:any)=>e?.response?.data?.message||e?.message||"A művelet nem sikerült.";

export default function InventoryLotsPage(){
  const [warehouses,setWarehouses]=useState<Warehouse[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [lots,setLots]=useState<LotRow[]>([]);
  const [summary,setSummary]=useState<Summary>({});
  const [warehouseId,setWarehouseId]=useState("");
  const [productId,setProductId]=useState("");
  const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  const [trackProductId,setTrackProductId]=useState("");
  const [lotTracking,setLotTracking]=useState(false);
  const [expiryTracking,setExpiryTracking]=useState(false);
  const [fefo,setFefo]=useState(false);

  const [receipt,setReceipt]=useState({warehouse_id:"",product_id:"",quantity:"",unit_cost:"",lot_code:"",manufactured_at:"",expires_at:"",document_number:"",note:""});

  const load=async()=>{
    setLoading(true);setError("");
    try{
      const [w,p]=await Promise.all([
        api.get("/api/transactions/inventory/ops/warehouses"),
        api.get("/api/transactions/inventory/ops/lots/products"),
      ]);
      setWarehouses(Array.isArray(w.data)?w.data:[]);
      setProducts(Array.isArray(p.data)?p.data:[]);
      if(!receipt.warehouse_id&&w.data?.[0]?.id)setReceipt(x=>({...x,warehouse_id:String(w.data[0].id)}));
    }catch(e:any){setError(getMessage(e))}finally{setLoading(false)}
  };
  const loadLots=async()=>{
    try{
      const params:any={};if(warehouseId)params.warehouse_id=warehouseId;if(productId)params.product_id=productId;if(status)params.status=status;
      const [l,s]=await Promise.all([
        api.get("/api/transactions/inventory/ops/lots",{params}),
        api.get("/api/transactions/inventory/ops/lots/summary"),
      ]);
      setLots(Array.isArray(l.data)?l.data:[]);setSummary(s.data||{});
    }catch(e:any){setError(getMessage(e))}
  };
  useEffect(()=>{void load()},[]);
  useEffect(()=>{void loadLots()},[warehouseId,productId,status]);

  const tracked=useMemo(()=>products.filter(p=>p.lot_tracking_enabled),[products]);
  const selectedReceiptProduct=products.find(p=>p.id===receipt.product_id);
  const selectedTracking=products.find(p=>p.id===trackProductId);
  useEffect(()=>{if(selectedTracking){setLotTracking(Boolean(selectedTracking.lot_tracking_enabled));setExpiryTracking(Boolean(selectedTracking.expiry_tracking_enabled));setFefo(Boolean(selectedTracking.fefo_enabled))}},[trackProductId,products]);

  const saveTracking=async()=>{
    if(!trackProductId)return setError("Válasszon terméket.");
    if((expiryTracking||fefo)&&!lotTracking)return setError("Lejárat és FEFO csak sarzskövetéssel együtt kapcsolható be.");
    setBusy(true);setError("");setNotice("");
    try{
      await api.patch(`/api/transactions/inventory/ops/catalog/products/${trackProductId}/tracking`,{lot_tracking_enabled:lotTracking,expiry_tracking_enabled:expiryTracking,fefo_enabled:fefo});
      setNotice("A sarzs- és FEFO-beállítás mentve.");await load();await loadLots();
    }catch(e:any){setError(getMessage(e))}finally{setBusy(false)}
  };

  const receive=async()=>{
    if(!receipt.warehouse_id||!receipt.product_id||!(Number(receipt.quantity)>0))return setError("Raktár, termék és pozitív mennyiség szükséges.");
    if(selectedReceiptProduct?.lot_tracking_enabled&&!receipt.lot_code.trim())return setError("Ehhez a termékhez a LOT/sarzsszám kötelező.");
    if(selectedReceiptProduct?.expiry_tracking_enabled&&!receipt.expires_at)return setError("Ehhez a termékhez a lejárati dátum kötelező.");
    setBusy(true);setError("");setNotice("");
    try{
      await api.post("/api/transactions/inventory/ops/lots/receive",{
        warehouse_id:receipt.warehouse_id,product_id:receipt.product_id,quantity:Number(receipt.quantity),unit_cost:Number(receipt.unit_cost||0),lot_code:receipt.lot_code.trim()||null,
        manufactured_at:receipt.manufactured_at||null,expires_at:receipt.expires_at||null,document_number:receipt.document_number.trim()||null,note:receipt.note.trim()||null,
      });
      setNotice("A sarzs bevételezése sikeres.");
      setReceipt(x=>({...x,quantity:"",lot_code:"",manufactured_at:"",expires_at:"",document_number:"",note:""}));await loadLots();
    }catch(e:any){setError(getMessage(e))}finally{setBusy(false)}
  };

  const writeOff=async(row:LotRow)=>{
    const raw=window.prompt(`Kivezetendő mennyiség · ${row.product_name} · ${row.lot_code}`,String(row.quantity));
    if(raw==null)return;const qty=Number(raw);if(!(qty>0)||qty>Number(row.quantity))return setError("Érvénytelen kivezetési mennyiség.");
    setBusy(true);setError("");setNotice("");
    try{
      await api.post("/api/transactions/inventory/ops/lots/issue",{warehouse_id:row.warehouse_id,product_id:row.product_id,quantity:qty,movement_type:"writeoff",lot_id:row.lot_id,allow_expired_lot:true,note:`Sarzs kivezetés: ${row.lot_code}`});
      setNotice("A sarzs kivezetése megtörtént.");await loadLots();
    }catch(e:any){setError(getMessage(e))}finally{setBusy(false)}
  };

  const badge=(r:LotRow)=>{
    const map:any={expired:["Lejárt","#7f1d1d","#fee2e2"],expiring:["30 napon belül","#92400e","#fef3c7"],ok:["Rendben","#166534","#dcfce7"],no_expiry:["Nincs lejárat","#475569","#f1f5f9"]};
    const x=map[r.expiry_status]||map.no_expiry;return <span style={{display:"inline-flex",padding:"5px 9px",borderRadius:999,fontSize:12,fontWeight:800,color:x[1],background:x[2]}}>{x[0]}</span>
  };

  return <div style={{maxWidth:1500,margin:"0 auto",padding:"24px 20px 48px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:18,flexWrap:"wrap",marginBottom:20}}>
      <div><div style={{fontSize:13,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",opacity:.55}}>Készletgazdálkodás</div><h1 style={{margin:"5px 0 8px",fontSize:32}}>Sarzs, lejárat és FEFO</h1><div style={{maxWidth:850,opacity:.7,lineHeight:1.55}}>A rendszer a lejáratos termékek kiadásakor automatikusan a legkorábban lejáró, még felhasználható sarzst fogyasztja. A lejárt tételeket a FEFO nem adja ki automatikusan.</div></div>
      <button style={secondary} onClick={()=>window.location.assign("/warehouse/operations")}>← Raktárak és készletműveletek</button>
    </div>

    {error&&<div style={{...card,borderColor:"#fecaca",background:"#fff7f7",color:"#991b1b",marginBottom:16,fontWeight:650}}>{error}</div>}
    {notice&&<div style={{...card,borderColor:"#bbf7d0",background:"#f7fff9",color:"#166534",marginBottom:16,fontWeight:650}}>{notice}</div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
      {[["Aktív sarzs",summary.lot_count||0],["Lejárt sarzs",summary.expired_lots||0],["30 napon belül lejár",summary.expiring_lots||0],["Lejárt mennyiség",fmt(summary.expired_quantity)],["Hamarosan lejáró mennyiség",fmt(summary.expiring_quantity)]].map(([k,v])=><div key={String(k)} style={card}><div style={{fontSize:12,textTransform:"uppercase",letterSpacing:".08em",opacity:.55,fontWeight:800}}>{k}</div><div style={{fontSize:28,fontWeight:850,marginTop:7}}>{v}</div></div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(300px,.85fr) minmax(360px,1.15fr)",gap:16,marginBottom:18}}>
      <section style={card}>
        <h2 style={{marginTop:0,fontSize:20}}>Termék nyomon követése</h2>
        <label style={{display:"grid",gap:6,fontWeight:650}}>Termék<select style={input} value={trackProductId} onChange={e=>setTrackProductId(e.target.value)}><option value="">Válasszon…</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}{p.internal_code?` · ${p.internal_code}`:""}</option>)}</select></label>
        <div style={{display:"grid",gap:10,margin:"16px 0"}}>
          <label><input type="checkbox" checked={lotTracking} onChange={e=>{setLotTracking(e.target.checked);if(!e.target.checked){setExpiryTracking(false);setFefo(false)}}}/> <b>LOT / sarzskövetés</b></label>
          <label><input type="checkbox" disabled={!lotTracking} checked={expiryTracking} onChange={e=>setExpiryTracking(e.target.checked)}/> Lejárati dátum kötelező</label>
          <label><input type="checkbox" disabled={!lotTracking} checked={fefo} onChange={e=>setFefo(e.target.checked)}/> FEFO automatikus kiadás</label>
        </div>
        <button style={button} disabled={busy||!trackProductId} onClick={saveTracking}>Beállítás mentése</button>
        <div style={{fontSize:12,opacity:.62,marginTop:12,lineHeight:1.5}}>Meglévő, korábban nem sarzsozott készlet átmenetileg „legacy” készletként fogyasztható. Az új bevételezéseknél a bekapcsolás után a LOT-adatok kötelezők.</div>
      </section>

      <section style={card}>
        <h2 style={{marginTop:0,fontSize:20}}>Sarzs bevételezése</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:11}}>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Raktár<select style={input} value={receipt.warehouse_id} onChange={e=>setReceipt(x=>({...x,warehouse_id:e.target.value}))}><option value="">Válasszon…</option>{warehouses.map(w=><option key={String(w.id)} value={String(w.id)}>{w.location_name?`${w.location_name} · `:""}{w.name}</option>)}</select></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Termék<select style={input} value={receipt.product_id} onChange={e=>setReceipt(x=>({...x,product_id:e.target.value}))}><option value="">Válasszon…</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}{p.lot_tracking_enabled?" · LOT":""}</option>)}</select></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Mennyiség<input style={input} type="number" min="0" step="0.001" value={receipt.quantity} onChange={e=>setReceipt(x=>({...x,quantity:e.target.value}))}/></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Egységár<input style={input} type="number" min="0" step="0.01" value={receipt.unit_cost} onChange={e=>setReceipt(x=>({...x,unit_cost:e.target.value}))}/></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>LOT / sarzsszám<input style={input} value={receipt.lot_code} onChange={e=>setReceipt(x=>({...x,lot_code:e.target.value}))} placeholder={selectedReceiptProduct?.lot_tracking_enabled?"Kötelező":"Nem kötelező"}/></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Lejárat<input style={input} type="date" value={receipt.expires_at} onChange={e=>setReceipt(x=>({...x,expires_at:e.target.value}))}/></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Gyártási dátum<input style={input} type="date" value={receipt.manufactured_at} onChange={e=>setReceipt(x=>({...x,manufactured_at:e.target.value}))}/></label>
          <label style={{display:"grid",gap:5,fontWeight:650}}>Bizonylatszám<input style={input} value={receipt.document_number} onChange={e=>setReceipt(x=>({...x,document_number:e.target.value}))}/></label>
        </div>
        <label style={{display:"grid",gap:5,fontWeight:650,marginTop:11}}>Megjegyzés<input style={input} value={receipt.note} onChange={e=>setReceipt(x=>({...x,note:e.target.value}))}/></label>
        <button style={{...button,marginTop:14}} disabled={busy} onClick={receive}>Bevételezés</button>
      </section>
    </div>

    <section style={card}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-end",flexWrap:"wrap",marginBottom:14}}>
        <div><h2 style={{margin:"0 0 4px",fontSize:20}}>Aktív sarzsok és lejáratok</h2><div style={{opacity:.62,fontSize:13}}>FEFO sorrend: legkorábbi lejárat → későbbi lejárat → lejárat nélküli tétel.</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(150px,1fr))",gap:8,minWidth:"min(100%,620px)"}}>
          <select style={input} value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="">Minden raktár</option>{warehouses.map(w=><option key={String(w.id)} value={String(w.id)}>{w.name}</option>)}</select>
          <select style={input} value={productId} onChange={e=>setProductId(e.target.value)}><option value="">Minden termék</option>{tracked.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select style={input} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Minden státusz</option><option value="expired">Lejárt</option><option value="expiring">30 napon belül</option><option value="ok">Rendben</option></select>
        </div>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:980}}><thead><tr>{["Termék","Raktár","LOT / sarzs","Mennyiség","Egységár","Gyártás","Lejárat","Státusz","Művelet"].map(x=><th key={x} style={{textAlign:"left",fontSize:12,textTransform:"uppercase",letterSpacing:".05em",padding:"10px 9px",borderBottom:"1px solid rgba(0,0,0,.1)",opacity:.65}}>{x}</th>)}</tr></thead><tbody>
        {lots.map(r=><tr key={r.lot_balance_id}><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}><b>{r.product_name}</b><div style={{fontSize:12,opacity:.55}}>{r.internal_code||r.brand||""}</div></td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{r.warehouse_name}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)",fontFamily:"ui-monospace,monospace",fontWeight:750}}>{r.lot_code}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)",fontWeight:750}}>{fmt(r.quantity)}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{money(r.unit_cost)}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{date(r.manufactured_at)}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{date(r.expires_at)}{r.days_to_expiry!=null&&<div style={{fontSize:11,opacity:.55}}>{r.days_to_expiry} nap</div>}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{badge(r)}</td><td style={{padding:9,borderBottom:"1px solid rgba(0,0,0,.06)"}}>{r.expiry_status==='expired'?<button style={{...secondary,padding:"7px 10px"}} disabled={busy} onClick={()=>writeOff(r)}>Kivezetés</button>:<span style={{fontSize:12,opacity:.5}}>{r.fefo_enabled?"FEFO aktív":"LOT követett"}</span>}</td></tr>)}
        {!loading&&!lots.length&&<tr><td colSpan={9} style={{padding:28,textAlign:"center",opacity:.55}}>Nincs a szűrésnek megfelelő aktív sarzs.</td></tr>}
      </tbody></table></div>
    </section>
  </div>
}