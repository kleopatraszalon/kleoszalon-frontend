import React,{useCallback,useEffect,useState} from 'react';
import {getP10DynamicOffers,getP10EmptySlotAutopilot,getP10RevenueGuard,getP10NextBestOffers,simulateP10Promotion} from '../api/virP10';
import {useLanguage} from '../i18n/LanguageProvider';

type Tab='offers'|'slots'|'guard'|'next'|'sim';
const tabLabels:Record<Tab,{hu:string;en:string}>={
 offers:{hu:'51. Dinamikus ajánlatmotor',en:'51. Dynamic Offer Engine'},
 slots:{hu:'52. Üres idősáv autopilóta 2.0',en:'52. Empty Slot Autopilot 2.0'},
 guard:{hu:'53. Bevételvédelem',en:'53. Revenue Guard'},
 next:{hu:'54. Következő legjobb ajánlat',en:'54. Next Best Offer'},
 sim:{hu:'55. Promóciós profitszimulátor',en:'55. Promotion Profit Simulator'},
};
const simLabels:Record<string,{hu:string;en:string}>={
 audience:{hu:'Célközönség',en:'Audience'},
 expected_response_percent:{hu:'Várt válaszarány (%)',en:'Expected response (%)'},
 avg_ticket:{hu:'Átlagos kosárérték',en:'Average ticket'},
 discount_percent:{hu:'Kedvezmény (%)',en:'Discount (%)'},
 communication_cost:{hu:'Kommunikációs költség',en:'Communication cost'},
};
export default function VirP10Page(){
 const {language}=useLanguage();const lang=language==='en'?'en':'hu';
 const [tab,setTab]=useState<Tab>('offers');const [locationId,setLocationId]=useState('');const [data,setData]=useState<any>(null);const [loading,setLoading]=useState(false);
 const [sim,setSim]=useState({audience:100,expected_response_percent:8,avg_ticket:15000,discount_percent:10,communication_cost:0});
 const load=useCallback(async()=>{setLoading(true);try{const p=locationId?{locationId}:{};const d=tab==='offers'?await getP10DynamicOffers(p):tab==='slots'?await getP10EmptySlotAutopilot(p):tab==='guard'?await getP10RevenueGuard(p):tab==='next'?await getP10NextBestOffers(p):await simulateP10Promotion({...sim,locationId:locationId||undefined});setData(d)}finally{setLoading(false)}},[locationId,sim,tab]);
 useEffect(()=>{void load()},[load]);
 const title=lang==='en'?'Revenue Autopilot':'Bevételi autopilóta';
 const intro=lang==='en'?'Revenue-growth decision support without automatic discounts, bookings or campaign launches. Every executable action requires approval.':'Bevételnövelő döntéstámogatás automatikus kedvezmény, foglalás vagy kampányindítás nélkül. Minden végrehajtható akció jóváhagyást igényel.';
 return <div style={{padding:24,maxWidth:1500,margin:'0 auto'}}><h1>{title}</h1><p>{intro}</p>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>{(Object.keys(tabLabels) as Tab[]).map(k=><button key={k} onClick={()=>setTab(k)} style={{fontWeight:tab===k?800:500}}>{tabLabels[k][lang]}</button>)}</div>
 <div style={{display:'flex',gap:8,marginBottom:16}}><input value={locationId} onChange={e=>setLocationId(e.target.value)} placeholder={lang==='en'?'Location UUID (optional; required for Empty Slot)':'Telephely UUID (opcionális; az üres idősávhoz kötelező)'} style={{minWidth:390}}/><button onClick={()=>void load()} disabled={loading}>{loading?(lang==='en'?'Loading...':'Betöltés...'):(lang==='en'?'Refresh':'Frissítés')}</button></div>
 {tab==='sim'&&<div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(140px,1fr))',gap:8,marginBottom:16}}>{Object.entries(sim).map(([k,v])=><label key={k}>{simLabels[k]?.[lang]||k}<input type="number" value={v} onChange={e=>setSim(s=>({...s,[k]:Number(e.target.value)}))} style={{width:'100%'}}/></label>)}<button onClick={()=>void load()}>{lang==='en'?'Simulate':'Szimuláció'}</button></div>}
 <section style={{background:'var(--surface,#fff)',border:'1px solid #ddd',borderRadius:12,padding:16}}><pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0}}>{data?JSON.stringify(data,null,2):(lang==='en'?'No data.':'Nincs adat.')}</pre></section>
 </div>
}
