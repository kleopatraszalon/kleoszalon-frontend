import React,{useCallback,useEffect,useMemo,useState}from'react';
import{AlertTriangle,BrainCircuit,CheckCircle2,Clock3,Lightbulb,RefreshCw,Send,ShieldCheck,Sparkles,TriangleAlert}from'lucide-react';
import api from'../api';
import'./ExecutiveAiAssistantPage.css';

type Severity='ok'|'info'|'warning'|'critical'|'unknown';
type Signal={key:string;label:string;severity:Severity;headline:string;value?:number|string|null;baseline?:number|string|null;delta_pct?:number|null;evidence:Record<string,any>;recommendation:string};
type Brief={business_date:string;location_id?:string|null;run_type:string;status:'ok'|'warning'|'critical';generated_at:string;ai_used:boolean;narrative:string;signals:Signal[];recommendations:string[]};
type Automation={enabled:boolean;timezone:string;runs:string[];mode:string;autonomous_actions:boolean;openai_configured:boolean;monthly_ai_budget_usd:number};
type History={briefs:any[];alerts:any[];deliveries:any[]};
const BASE='/api/transactions/ai-support/executive';
const budapestDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const quickQuestions=['Miért csökkent ma a forgalom?','Melyik dolgozó kapacitása alacsony?','Hol nőtt a no-show?','Melyik készlet fogy el?','Melyik telephely tér el az átlagtól?','Milyen akciót érdemes indítani?','Hol várható létszámhiány?','Mely panasz sürgős?'];
const statusText:Record<Severity,string>={ok:'RENDBEN',info:'INFORMÁCIÓ',warning:'FIGYELEM',critical:'KRITIKUS',unknown:'NINCS ADAT'};

function Evidence({signal}:{signal:Signal}){
 const e=signal.evidence||{};
 const list=(e.critical||e.at_risk||e.low_capacity_staff||e.outliers||e.risk||e.urgent) as any[]|undefined;
 if(Array.isArray(list)&&list.length)return <div className="exa-evidence-list">{list.slice(0,5).map((x:any,i)=><div key={i}>{x.name||x.employee_name||x.product_name||x.title||x.date||x.location_name||'Tétel'}<small>{x.warehouse_name||x.location_id||x.location_name||''}{x.days_to_zero!=null?` · ${x.days_to_zero} nap kifogyásig`:''}{x.utilization_pct!=null?` · ${x.utilization_pct}% terhelés`:''}{x.delta_pct!=null?` · ${x.delta_pct}% eltérés`:''}</small></div>)}</div>;
 const metrics=Object.entries(e).filter(([,v])=>['number','string'].includes(typeof v)).slice(0,5);
 return metrics.length?<div className="exa-evidence-kv">{metrics.map(([k,v])=><span key={k}><small>{k.replaceAll('_',' ')}</small><b>{String(v)}</b></span>)}</div>:null;
}

export default function ExecutiveAiAssistantPage(){
 const[date,setDate]=useState(budapestDate()),[brief,setBrief]=useState<Brief|null>(null),[automation,setAutomation]=useState<Automation|null>(null),[history,setHistory]=useState<History|null>(null),[loading,setLoading]=useState(false),[running,setRunning]=useState(false),[asking,setAsking]=useState(false),[question,setQuestion]=useState(''),[answer,setAnswer]=useState(''),[error,setError]=useState('');
 const locationId=localStorage.getItem('kleo_location_id')||'',locationName=localStorage.getItem('kleo_location_name')||'Összes telephely';
 const params=useMemo(()=>{const p=new URLSearchParams({date});if(locationId)p.set('location_id',locationId);return p.toString()},[date,locationId]);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const hp=new URLSearchParams({days:'30'});if(locationId)hp.set('location_id',locationId);const[b,a,h]=await Promise.all([api.get(`${BASE}/brief?${params}`),api.get(`${BASE}/automation`),api.get(`${BASE}/history?${hp}`)]);setBrief(b.data);setAutomation(a.data);setHistory(h.data)}catch(e:any){setError(e?.response?.data?.message||'Az AI vezetői adatok nem tölthetők be.')}finally{setLoading(false)}},[params,locationId]);
 useEffect(()=>{void load()},[load]);
 async function run(){setRunning(true);setError('');try{const r=await api.post(`${BASE}/run`,{date,location_id:locationId||null,run_type:'manual',use_ai:true});setBrief(r.data);await load()}catch(e:any){setError(e?.response?.data?.message||'A vezetői elemzés futtatása nem sikerült.')}finally{setRunning(false)}}
 async function ask(q?:string){const text=String(q||question).trim();if(!text)return;setQuestion(text);setAsking(true);setError('');try{const r=await api.post(`${BASE}/ask`,{date,location_id:locationId||null,question:text});setAnswer(r.data?.answer||'Nem érkezett válasz.')}catch(e:any){setError(e?.response?.data?.message||'A vezetői kérdés elemzése nem sikerült.')}finally{setAsking(false)}}
 const critical=brief?.signals?.filter(s=>s.severity==='critical')||[],warnings=brief?.signals?.filter(s=>s.severity==='warning')||[];
 const openAlerts=(history?.alerts||[]).filter((x:any)=>!x.resolved_at);
 return <main className="exa-page">
  <header className="exa-hero"><div><span>VEZETŐI KÖZPONT · AI ELEMZÉS</span><h1><BrainCircuit/> AI vezetői asszisztens</h1><p>{locationName} · valós VIR-adatokból számított vezetői jelzések és AI-értelmezés. Elemző üzemmód: nincs autonóm üzleti döntés.</p></div><div className="exa-actions"><label>Üzleti nap<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="ghost" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?'Frissítés…':'Frissítés'}</button><button className="primary" onClick={run} disabled={running}><Sparkles size={16}/>{running?'Elemzés…':'Vezetői brief most'}</button></div></header>
  {error&&<div className="exa-error"><AlertTriangle size={18}/>{error}</div>}
  <section className="exa-policy"><ShieldCheck/><div><b>Elemző, nem autonóm mód</b><span>Az AI nem indít kampányt, nem módosít beosztást, nem rendel készletet, nem minősít dolgozót és nem zár le panaszt. A javaslat vezetői jóváhagyást igényel.</span></div></section>
  {brief&&<>
   <section className={`exa-status ${brief.status}`}><div>{brief.status==='critical'?<TriangleAlert/>:<CheckCircle2/>}<div><small>MAI VEZETŐI ÁLLAPOT</small><b>{brief.status==='critical'?'AZONNALI VEZETŐI FIGYELEM':brief.status==='warning'?'VANNAK VIZSGÁLANDÓ ELTÉRÉSEK':'NINCS KRITIKUS ELTÉRÉS'}</b><span>{critical.length} kritikus · {warnings.length} figyelmeztetés · {brief.signals.length} elemzett terület</span></div></div><div><small>Utolsó brief</small><b>{new Date(brief.generated_at).toLocaleString('hu-HU')}</b><span>{brief.ai_used?'AI értelmezéssel':'determinista fallback'}</span></div></section>
   <section className="exa-brief"><div className="exa-section-head"><BrainCircuit/><div><b>Vezetői összefoglaló</b><span>Tényadat → lehetséges magyarázat → vezetői javaslat</span></div></div><div className="exa-narrative">{brief.narrative}</div></section>
   <section className="exa-signals"><div className="exa-section-head"><Lightbulb/><div><b>8 automatikus elemzési terület</b><span>A KPI-ket a VIR számolja, az AI csak értelmezi.</span></div></div><div className="exa-grid">{brief.signals.map(s=><article className={`exa-card ${s.severity}`} key={s.key}><header><span>{statusText[s.severity]}</span>{s.delta_pct!=null&&<em>{s.delta_pct>=0?'+':''}{s.delta_pct}%</em>}</header><h3>{s.label}</h3><strong>{s.headline}</strong><Evidence signal={s}/><p>{s.recommendation}</p></article>)}</div></section>
  </>}
  <section className="exa-ask"><div className="exa-section-head"><BrainCircuit/><div><b>Kérdezd a vezetői asszisztenst</b><span>A válasz ugyanabból a pillanatnyi, ellenőrzött adatcsomagból készül.</span></div></div><div className="exa-quick">{quickQuestions.map(q=><button key={q} onClick={()=>void ask(q)}>{q}</button>)}</div><div className="exa-question"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void ask()}} placeholder="Pl. Mi magyarázza a mai forgalomcsökkenést?"/><button onClick={()=>void ask()} disabled={asking}><Send size={16}/>{asking?'Elemzés…':'Kérdezés'}</button></div>{answer&&<div className="exa-answer">{answer}</div>}</section>
  <div className="exa-two">
   <section className="exa-panel"><div className="exa-section-head"><Clock3/><div><b>Automatizálás</b><span>Budapest időzóna</span></div></div>{automation?<div className="exa-auto"><p><b>Állapot:</b> {automation.enabled?'AKTÍV':'KIKAPCSOLVA'}</p><p><b>Automatikus briefek:</b> {automation.runs.join(' · ')}</p><p><b>OpenAI:</b> {automation.openai_configured?'konfigurálva':'nincs kulcs – determinista elemzés működik'}</p><p><b>AI havi keret:</b> ${automation.monthly_ai_budget_usd}</p><p><b>Autonóm műveletek:</b> NEM</p></div>:<div className="exa-empty">Automatizálási állapot betöltése…</div>}</section>
   <section className="exa-panel"><div className="exa-section-head"><TriangleAlert/><div><b>Nyitott vezetői riasztások</b><span>Critical jelzés esetén automatikus admin e-mail</span></div></div>{openAlerts.length?<div className="exa-alerts">{openAlerts.slice(0,8).map((a:any)=><div key={a.alert_key}><b>{a.title}</b><span>{a.detail}</span><small>{new Date(a.last_seen_at).toLocaleString('hu-HU')}</small></div>)}</div>:<div className="exa-empty"><CheckCircle2/> Nincs nyitott kritikus vezetői riasztás.</div>}</section>
  </div>
  <section className="exa-history"><h2>30 napos vezetői brief-történet</h2><div>{(history?.briefs||[]).slice(0,18).map((x:any)=><span className={x.status} key={x.id}><b>{String(x.business_date).slice(0,10)}</b> · {x.run_type} · {x.status.toUpperCase()}</span>)}</div></section>
 </main>
}
