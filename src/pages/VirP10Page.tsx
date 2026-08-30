import React,{useEffect,useState} from 'react';
import {getP10DynamicOffers,getP10EmptySlotAutopilot,getP10RevenueGuard,getP10NextBestOffers,simulateP10Promotion} from '../api/virP10';

type Tab='offers'|'slots'|'guard'|'next'|'sim';
const tabs:[Tab,string][]=[['offers','51. Dynamic Offer Engine'],['slots','52. Empty Slot Autopilot 2.0'],['guard','53. Revenue Guard'],['next','54. Next Best Offer'],['sim','55. Promotion Profit Simulator']];
export default function VirP10Page(){
 const [tab,setTab]=useState<Tab>('offers');const [locationId,setLocationId]=useState('');const [data,setData]=useState<any>(null);const [loading,setLoading]=useState(false);
 const [sim,setSim]=useState({audience:100,expected_response_percent:8,avg_ticket:15000,discount_percent:10,communication_cost:0});
 async function load(){setLoading(true);try{const p=locationId?{locationId}:{};const d=tab==='offers'?await getP10DynamicOffers(p):tab==='slots'?await getP10EmptySlotAutopilot(p):tab==='guard'?await getP10RevenueGuard(p):tab==='next'?await getP10NextBestOffers(p):await simulateP10Promotion({...sim,locationId:locationId||undefined});setData(d)}finally{setLoading(false)}}
 useEffect(()=>{void load()},[tab]);
 return <div style={{padding:24,maxWidth:1500,margin:'0 auto'}}><h1>VIR P10 · Revenue Autopilot</h1><p>Bevételnövelő döntéstámogatás automatikus kedvezmény, foglalás vagy kampányindítás nélkül. Minden végrehajtható akció jóváhagyást igényel.</p>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>{tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{fontWeight:tab===k?800:500}}>{l}</button>)}</div>
 <div style={{display:'flex',gap:8,marginBottom:16}}><input value={locationId} onChange={e=>setLocationId(e.target.value)} placeholder="Telephely UUID (opcionális; Empty Slothoz kötelező)" style={{minWidth:390}}/><button onClick={()=>void load()} disabled={loading}>{loading?'Betöltés...':'Frissítés'}</button></div>
 {tab==='sim'&&<div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(140px,1fr))',gap:8,marginBottom:16}}>{Object.entries(sim).map(([k,v])=><label key={k}>{k}<input type="number" value={v} onChange={e=>setSim(s=>({...s,[k]:Number(e.target.value)}))} style={{width:'100%'}}/></label>)}<button onClick={()=>void load()}>Szimuláció</button></div>}
 <section style={{background:'var(--surface,#fff)',border:'1px solid #ddd',borderRadius:12,padding:16}}><pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0}}>{data?JSON.stringify(data,null,2):'Nincs adat.'}</pre></section>
 </div>
}
