import React,{useCallback,useEffect,useMemo,useState}from"react";
import{getLocations,type LocationRow}from"../api/locations";
import{getVirCannibalization,getVirEmployeeRevenueCoach,getVirServicePortfolio,getVirSmartShiftGenerator,getVirWorkforceOptimizer}from"../api/virP4";
import{useLanguage}from"../i18n/LanguageProvider";
import"./VirManagement.css";
import"./VirP4.css";

type Tab="21"|"22"|"23"|"24"|"25";
type TabMeta={id:Tab;label:string;short:string;description:string};
type Kpi={label:string;value:React.ReactNode;note?:string;tone?:"neutral"|"good"|"warning"|"critical"};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const allowedDays=(tab:Tab)=>tab==="21"||tab==="22"?[14,30]:tab==="23"?[14,30,60,90]:[30,60,90,180];

export default function VirP4Page(){
 const{language}=useLanguage();
 const en=language==='en';
 const t=useCallback((hu:string,enText:string)=>en?enText:hu,[en]);
 const fmtDate=(v:unknown)=>v?new Intl.DateTimeFormat(en?'en-US':'hu-HU',{year:'numeric',month:'short',day:'2-digit'}).format(new Date(String(v))):"—";
 const money=useCallback((v:unknown)=>new Intl.NumberFormat(en?'en-US':'hu-HU',{style:'currency',currency:'HUF',maximumFractionDigits:0}).format(Number(v)||0),[en]);
 const number=useCallback((v:unknown)=>new Intl.NumberFormat(en?'en-US':'hu-HU',{maximumFractionDigits:1}).format(Number(v)||0),[en]);

 const tabs=useMemo<TabMeta[]>(()=>[
  {id:"21",label:t('Munkaerő-optimalizáló','Workforce Optimizer'),short:t('Kapacitás','Capacity'),description:t('Terhelés és publikált műszakok összevetése, létszámhiány és túlkapacitás korai jelzésével.','Compares demand with published shifts and flags staffing shortages or surplus early.')},
  {id:"22",label:t('Intelligens műszaktervező','Smart Shift Generator'),short:t('Műszakterv','Shift plan'),description:t('Jóváhagyásra váró műszakjavaslatokat készít a várható kapacitáshiányokra.','Creates approval-only shift proposals for forecast capacity gaps.')},
  {id:"23",label:t('Munkatársi bevételi coach','Employee Revenue Coach'),short:t('Bevételi coach','Revenue coach'),description:t('Nem büntető fejlesztési nézet bevétel/óra, visszafoglalás és kapacitás alapján.','Non-punitive coaching view based on revenue/hour, rebooking and capacity.')},
  {id:"24",label:t('Szolgáltatásportfólió-optimalizáló','Service Portfolio Optimizer'),short:t('Portfólió','Portfolio'),description:t('Kereslet és időarányos bevétel alapján mutat növelési, átárazási és felülvizsgálati lehetőségeket.','Highlights growth, repricing and review opportunities using demand and time-adjusted revenue.')},
  {id:"25",label:t('Kannibalizációfigyelő','Cannibalization Detector'),short:t('Hálózati átfedés','Network overlap'),description:t('Telephelyek közötti vendégáramlást és potenciális hálózati átfedést jelez.','Signals cross-location customer movement and potential network overlap.')},
 ],[t]);

 const[locations,setLocations]=useState<LocationRow[]>([]);
 const[locationId,setLocationId]=useState('');
 const[days,setDays]=useState(30);
 const[tab,setTab]=useState<Tab>("21");
 const[data,setData]=useState<any>(null);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');
 const[technicalError,setTechnicalError]=useState('');

 useEffect(()=>{getLocations().then(rows=>setLocations(rows)).catch(()=>setLocations([]));},[]);
 useEffect(()=>{const valid=allowedDays(tab);if(!valid.includes(days))setDays(valid.includes(30)?30:valid[0]);},[tab,days]);

 const load=useCallback(async()=>{
  setLoading(true);setError('');setTechnicalError('');
  try{
   const p={locationId:locationId||undefined,days};
   const result=tab==="21"?await getVirWorkforceOptimizer(p):tab==="22"?await getVirSmartShiftGenerator(p):tab==="23"?await getVirEmployeeRevenueCoach(p):tab==="24"?await getVirServicePortfolio(p):await getVirCannibalization(p);
   setData(result);
  }catch(e:any){
   const detail=e?.response?.data?.error||e?.message||'';
   setTechnicalError(String(detail));
   setError(t('Az adatok betöltése nem sikerült. Próbáld újra; ha a hiba megmarad, a technikai részletet továbbíthatod a fejlesztésnek.','The data could not be loaded. Try again; if the issue persists, the technical detail can be shared with development.'));
  }finally{setLoading(false);}
 },[locationId,days,tab,t]);
 useEffect(()=>{void load();},[load]);

 const active=tabs.find(x=>x.id===tab)!;
 const selectedLocation=locationId?locations.find(x=>String(x.id)===locationId)?.name:t('Minden telephely','All locations');
 const rows:any[]=tab==="22"?(data?.proposals||[]):(data?.items||[]);
 const kpis=useMemo<Kpi[]>(()=>{
  if(tab==="21")return[
   {label:t('Elemzett nap','Days analyzed'),value:number(data?.summary?.days_analyzed),note:selectedLocation},
   {label:t('Hiányos nap','Shortage days'),value:number(data?.summary?.shortage_days),note:t('További kapacitást igényel','Needs additional capacity'),tone:Number(data?.summary?.shortage_days)>0?'warning':'good'},
   {label:t('Kritikus nap','Critical days'),value:number(data?.summary?.critical_days),note:t('Legalább 2 fő hiány','At least 2 staff missing'),tone:Number(data?.summary?.critical_days)>0?'critical':'good'},
   {label:t('Összes létszámhiány','Total staff gap'),value:`+${number(data?.summary?.total_staff_gap)}`,note:t('Becsült fő-kapacitás','Estimated staff capacity'),tone:Number(data?.summary?.total_staff_gap)>0?'warning':'good'},
  ];
  if(tab==="22"){
   const candidates=rows.reduce((sum,x)=>sum+(x.candidates?.length||0),0);
   return[
    {label:t('Javasolt nap','Proposal days'),value:number(data?.summary?.proposal_days),note:selectedLocation,tone:Number(data?.summary?.proposal_days)>0?'warning':'good'},
    {label:t('Összes hiány','Total gap'),value:`+${number(data?.summary?.total_staff_gap)}`,note:t('Fő-kapacitás','Staff capacity'),tone:Number(data?.summary?.total_staff_gap)>0?'warning':'good'},
    {label:t('Elérhető jelölt','Available candidates'),value:number(candidates),note:t('Publikált műszak nélkül','Without a published shift')},
    {label:t('Automatikus írás','Automatic write'),value:t('Kikapcsolva','Off'),note:t('Vezetői jóváhagyás szükséges','Management approval required'),tone:'good'},
   ];
  }
  if(tab==="23"){
   const count=rows.length;const revenue=rows.reduce((s,x)=>s+(Number(x.revenue)||0),0);const score=count?rows.reduce((s,x)=>s+(Number(x.coach_score)||0),0)/count:0;const rebook=count?rows.reduce((s,x)=>s+(Number(x.rebook_rate_percent)||0),0)/count:0;
   return[
    {label:t('Aktív munkatárs','Active staff'),value:number(count),note:selectedLocation},
    {label:t('Átlag coach pont','Average coach score'),value:`${Math.round(score)}/100`,note:t('Fejlesztési iránytű','Development indicator'),tone:score>=70?'good':score>=45?'warning':'critical'},
    {label:t('Összes bevétel','Total revenue'),value:money(revenue),note:`${days} ${t('nap','days')}`},
    {label:t('Átlag visszafoglalás','Average rebooking'),value:`${Math.round(rebook)}%`,note:t('Munkatársi átlag','Staff average'),tone:rebook>=55?'good':rebook>=40?'warning':'critical'},
   ];
  }
  if(tab==="24"){
   const bookings=rows.reduce((s,x)=>s+(Number(x.bookings)||0),0);
   return[
    {label:t('Növelhető','Growth candidates'),value:number(data?.summary?.grow),note:t('Erős kereslet + érték','Strong demand + value'),tone:'good'},
    {label:t('Átárazandó','Repricing candidates'),value:number(data?.summary?.reprice),note:t('Kereslet van, órabevétel gyenge','Demand exists, hourly revenue is weak'),tone:Number(data?.summary?.reprice)>0?'warning':'neutral'},
    {label:t('Felülvizsgálandó','Review candidates'),value:number(data?.summary?.review),note:t('Alacsony kereslet','Low demand'),tone:Number(data?.summary?.review)>0?'warning':'good'},
    {label:t('Foglalások','Bookings'),value:number(bookings),note:`${days} ${t('nap','days')}`},
   ];
  }
  const high=rows.filter(x=>x.signal==='HIGH').length;const shared=rows.reduce((s,x)=>s+(Number(x.shared_clients)||0),0);const rev=rows.reduce((s,x)=>s+(Number(x.destination_revenue)||0),0);
  return[
   {label:t('Telephely-pár','Location pairs'),value:number(rows.length),note:selectedLocation},
   {label:t('Magas jelzés','High signals'),value:number(high),note:t('Erős vendégáramlási átfedés','Strong customer-flow overlap'),tone:high>0?'warning':'good'},
   {label:t('Átfedő vendég','Shared customers'),value:number(shared),note:t('Összes jelzett kapcsolat','Across signaled relationships')},
   {label:t('Céloldali bevétel','Destination revenue'),value:money(rev),note:`${days} ${t('nap','days')}`},
  ];
 },[tab,data,rows,days,selectedLocation,t,money,number]);

 const statusTone=(value:unknown)=>{const v=String(value||'').toUpperCase();if(v.includes('CRITICAL')||v==='HIGH')return'critical';if(v.includes('SHORTAGE')||v==='MEDIUM'||v==='REPRICE'||v==='REVIEW')return'warning';if(v==='BALANCED'||v==='GROW'||v==='LOW')return'good';return'neutral';};
 const statusLabel=(value:unknown)=>{const v=String(value||'');const map:Record<string,string>={CRITICAL_SHORTAGE:t('Kritikus hiány','Critical shortage'),SHORTAGE:t('Kapacitáshiány','Shortage'),SURPLUS:t('Többletkapacitás','Surplus'),BALANCED:t('Kiegyensúlyozott','Balanced'),GROW:t('Növelés','Grow'),REPRICE:t('Átárazás','Reprice'),REVIEW:t('Felülvizsgálat','Review'),HOLD:t('Tartás','Hold'),HIGH:t('Magas','High'),MEDIUM:t('Közepes','Medium'),LOW:t('Alacsony','Low')};return map[v]||v||'—';};
 const empty=<div className="p4-empty"><div className="p4-empty-icon">✓</div><strong>{t('Nincs megjeleníthető eltérés','No actionable variance found')}</strong><span>{t('A kiválasztott szűrésben jelenleg nincs olyan adat, amely beavatkozást vagy külön figyelmet igényel.','There is currently no data in this scope that requires intervention or special attention.')}</span></div>;

 const table=(headers:string[],body:React.ReactNode)=><div className="p4-table-shell"><div className="p4-table-scroll"><table className="vir-source-table p4-table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{body}</tbody></table></div></div>;

 return <div className="vir-management-page p4-page">
  <section className="p4-hero">
   <div className="p4-hero-copy"><div className="p4-eyebrow">VIR · P4 · {t('OPERÁCIÓS DÖNTÉSTÁMOGATÁS','OPERATIONS DECISION SUPPORT')}</div><h1 className="vir-management-title">{t('Működési intelligencia','Operations Intelligence')}</h1><p>{t('A munkaerőt, műszakokat, munkatársi bevételt, szolgáltatásportfóliót és a szalonok közötti átfedést egyetlen vezetői döntési felületre rendezi.','Brings workforce, shifts, staff revenue, service portfolio and cross-salon overlap into one management decision surface.')}</p><div className="p4-capability-row">{tabs.map(x=><span key={x.id}>{x.id} · {x.short}</span>)}</div></div>
   <div className="p4-hero-status"><span className="p4-live-dot"/><div><strong>{t('Döntéstámogató mód','Decision-support mode')}</strong><small>{t('Nincs automatikus műszak-, HR-, ár- vagy katalógusmódosítás.','No automatic shift, HR, price or catalog changes.')}</small></div></div>
  </section>

  <section className="p4-control-card">
   <div className="p4-control-copy"><span>{t('Aktív nézet','Active view')}</span><strong>{active.id}. {active.label}</strong><small>{active.description}</small></div>
   <div className="p4-filters"><label className="vir-field"><span>{t('Telephely','Location')}</span><select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">{t('Minden telephely','All locations')}</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label><label className="vir-field"><span>{t('Időablak','Time window')}</span><select value={days} onChange={e=>setDays(Number(e.target.value))}>{allowedDays(tab).map(d=><option key={d} value={d}>{d} {t('nap','days')}</option>)}</select></label><button className="p4-refresh" onClick={()=>void load()} disabled={loading}>{loading?t('Frissítés…','Refreshing…'):t('Adatok frissítése','Refresh data')}</button></div>
  </section>

  <nav className="p4-tabs" aria-label={t('Működési intelligencia modulok','Operations intelligence modules')}>{tabs.map(x=><button key={x.id} className={tab===x.id?'is-active':''} onClick={()=>setTab(x.id)}><span className="p4-tab-number">{x.id}</span><span><strong>{x.label}</strong><small>{x.short}</small></span></button>)}</nav>

  {error&&<div className="p4-error-card"><div className="p4-error-icon">!</div><div><strong>{t('Az intelligencia-adatok nem tölthetők be','Intelligence data could not be loaded')}</strong><p>{error}</p>{technicalError&&<details><summary>{t('Technikai részlet','Technical detail')}</summary><code>{technicalError}</code></details>}</div><button onClick={()=>void load()}>{t('Újrapróbálás','Retry')}</button></div>}

  {loading?<div className="p4-loading"><div className="p4-skeleton-grid">{[1,2,3,4].map(x=><span key={x}/>)}</div><div className="p4-skeleton-panel"/></div>:<>
   {!error&&<div className="p4-kpi-grid">{kpis.map((k,i)=><article key={i} className={`p4-kpi p4-kpi--${k.tone||'neutral'}`}><span>{k.label}</span><strong>{k.value}</strong>{k.note&&<small>{k.note}</small>}</article>)}</div>}

   {!error&&<section className="vir-panel p4-module-panel"><header className="p4-module-header"><div><div className="p4-module-kicker">{t('MODUL','MODULE')} {active.id}</div><h2>{active.label}</h2><p>{active.description}</p></div><span className="p4-advisory-badge">{t('Javaslat · emberi döntés','Advisory · human decision')}</span></header>

    {tab==="21"&&(rows.length?table([t('Telephely','Location'),t('Nap','Day'),t('Várható terhelés','Expected load'),t('Beosztott','Scheduled'),t('Szükséges','Required'),t('Eltérés','Gap'),t('Kihasználtság','Utilization'),t('Készségblokk','Skill block'),t('Állapot','Status')],rows.map((x:any,i:number)=><tr key={i}><td><strong>{x.location_name}</strong></td><td>{fmtDate(x.day)}</td><td><span className="p4-metric">{number(x.demand_minutes)} <small>perc</small></span></td><td>{number(x.scheduled_staff)}</td><td>{number(x.required_staff)}</td><td><span className={`p4-gap ${Number(x.staff_gap)>0?'is-negative':Number(x.staff_gap)<0?'is-positive':''}`}>{Number(x.staff_gap)>0?'+':''}{number(x.staff_gap)}</span></td><td><div className="p4-util"><strong>{x.utilization_percent==null?'—':`${number(x.utilization_percent)}%`}</strong>{x.utilization_percent!=null&&<span><i style={{width:`${clamp(Number(x.utilization_percent),0,100)}%`}}/></span>}</div></td><td><span className={Number(x.skill_coverage?.blocked_skill_rows)>0?'p4-status p4-status--warning':'p4-status p4-status--good'}>{number(x.skill_coverage?.blocked_skill_rows||0)}</span></td><td><span className={`p4-status p4-status--${statusTone(x.status)}`}>{statusLabel(x.status)}</span></td></tr>)):empty)}

    {tab==="22"&&(rows.length?table([t('Telephely','Location'),t('Nap','Day'),t('Hiány','Gap'),t('Javasolt műszak','Suggested shift'),t('Jelöltek','Candidates'),t('Döntési állapot','Decision status')],rows.map((x:any,i:number)=><tr key={i}><td><strong>{x.location_name}</strong></td><td>{fmtDate(x.day)}</td><td><span className="p4-gap is-negative">+{number(x.staff_gap)}</span></td><td><span className="p4-shift-time">{x.suggested_shift?.start_local}–{x.suggested_shift?.end_local}</span></td><td><div className="p4-candidates">{x.candidates?.length?x.candidates.slice(0,3).map((c:any)=><span key={c.employee_id}>{c.employee_name}</span>):<em>{t('Nincs szabad jelölt','No available candidate')}</em>}{x.candidates?.length>3&&<small>+{x.candidates.length-3}</small>}</div></td><td><span className="p4-status p4-status--warning">{t('Jóváhagyás szükséges','Approval required')}</span></td></tr>)):empty)}

    {tab==="23"&&(rows.length?table([t('Munkatárs','Staff member'),t('Telephely','Location'),t('Időpont','Appointments'),t('Visszafoglalás','Rebooking'),t('Bevétel','Revenue'),t('Bevétel/óra','Revenue/hour'),t('Coach pont','Coach score'),t('Kiemelt javaslat','Primary recommendation')],rows.map((x:any,i:number)=><tr key={i}><td><strong>{x.employee_name}</strong></td><td>{x.location_name}</td><td>{number(x.appointments)}</td><td><span className={`p4-status p4-status--${Number(x.rebook_rate_percent)>=55?'good':Number(x.rebook_rate_percent)>=40?'warning':'critical'}`}>{number(x.rebook_rate_percent)}%</span></td><td><strong>{money(x.revenue)}</strong></td><td>{money(x.revenue_per_booked_hour)}</td><td><div className="p4-score"><strong>{number(x.coach_score)}</strong><span><i style={{width:`${clamp(Number(x.coach_score),0,100)}%`}}/></span></div></td><td className="p4-recommendation">{x.recommendations?.[0]||'—'}</td></tr>)):empty)}

    {tab==="24"&&(rows.length?table([t('Szolgáltatás','Service'),t('Foglalás','Bookings'),t('Vendég','Customers'),t('Átlagár','Average price'),t('Bevétel/óra','Revenue/hour'),t('Ajánlás','Recommendation'),t('Indok','Reason')],rows.map((x:any,i:number)=><tr key={i}><td><strong>{x.service_name}</strong></td><td>{number(x.bookings)}</td><td>{number(x.clients)}</td><td>{money(x.avg_price)}</td><td><strong>{money(x.revenue_per_hour)}</strong></td><td><span className={`p4-status p4-status--${statusTone(x.recommendation)}`}>{statusLabel(x.recommendation)}</span></td><td className="p4-recommendation">{x.rationale}</td></tr>)):empty)}

    {tab==="25"&&(rows.length?table([t('Forrás szalon','Source salon'),t('Cél szalon','Destination salon'),t('Átfedő vendég','Shared customers'),t('Céloldali bevétel','Destination revenue'),t('Jelzés','Signal'),t('Értelmezés','Interpretation')],rows.map((x:any,i:number)=><tr key={i}><td><strong>{x.source_location_name}</strong></td><td><strong>{x.destination_location_name}</strong></td><td>{number(x.shared_clients)}</td><td>{money(x.destination_revenue)}</td><td><span className={`p4-status p4-status--${statusTone(x.signal)}`}>{statusLabel(x.signal)}</span></td><td className="p4-recommendation">{x.interpretation}</td></tr>)):empty)}
   </section>}
  </>}
 </div>;
}
