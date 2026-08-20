import React,{useEffect,useMemo,useState}from"react";
import api from"../api";
import {useCurrentUser}from"../hooks/useCurrentUser";
import CentralSupplyPanel from"./inventory/CentralSupplyPanel";
import"./inventory/ProcurementPanel.css";

type Location={id:string;name?:string;title?:string};
const arr=<T,>(v:any):T[]=>Array.isArray(v)?v:Array.isArray(v?.items)?v.items:[];
const roleList=(raw:any)=>{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());try{const p=JSON.parse(String(raw||''));if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase())}catch{}return String(raw||'').split(',').map(x=>x.replace(/[[\]"]/g,'').trim().toLowerCase()).filter(Boolean)};
const ADMIN=["admin","administrator","rendszergazda","superadmin","super_admin"];

export default function CentralSupplyPage(){
 const{user,loading}=useCurrentUser();
 const[locations,setLocations]=useState<Location[]>([]),[locationId,setLocationId]=useState("");
 const roles=useMemo(()=>roleList(user?.role),[user?.role]);
 const isAdmin=roles.some(r=>ADMIN.includes(r));
 const ownLocation=user?.location_id?String(user.location_id):"";
 useEffect(()=>{api.get('/api/locations').then(r=>setLocations(arr<Location>(r.data))).catch(()=>{})},[]);
 useEffect(()=>{if(!loading&&!isAdmin&&ownLocation)setLocationId(ownLocation)},[loading,isAdmin,ownLocation]);
 const selectedName=locations.find(l=>String(l.id)===locationId)?.name||locations.find(l=>String(l.id)===locationId)?.title||user?.location_name||"";
 return <main className="central-supply-page" style={{padding:24,maxWidth:1500}}>
  <header className="central-supply-hero">
   <div><span style={{fontSize:12,fontWeight:800,letterSpacing:1}}>11. ETAP · KÖZPONTI ELLÁTÁS</span><h1 style={{margin:'5px 0'}}>Központi ellátási folyamat</h1><p style={{margin:0,color:'#666'}}>Szalonigény → jóváhagyás → központi kiadás → szalon érkeztetés → eltéréskezelés → szükség esetén beszállítói rendelés.</p></div>
   <label>Szalon <select value={locationId} onChange={e=>setLocationId(e.target.value)} disabled={!isAdmin||loading} style={{marginLeft:8,padding:8}}>{isAdmin&&<option value="">Minden szalon</option>}{locations.map(l=><option key={l.id} value={l.id}>{l.name||l.title||l.id}</option>)}</select></label>
  </header>
  {!isAdmin&&<div className="proc-alert success" style={{marginBottom:16}}>Saját telephely nézet: <b>{selectedName||'a bejelentkezett felhasználó szalonja'}</b>. Más szalon készletadatai ebből a nézetből nem választhatók ki.</div>}
  <CentralSupplyPanel locationId={locationId}/>
 </main>
}
