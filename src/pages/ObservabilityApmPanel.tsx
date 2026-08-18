import React,{useCallback,useEffect,useMemo,useState}from'react';
import{Activity,AlertTriangle,CheckCircle2,Clock3,Database,MailWarning,RefreshCw,ServerCrash,TriangleAlert}from'lucide-react';
import{CartesianGrid,Legend,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis}from'recharts';
import api from'../api';
import'./ObservabilityApmPanel.css';

type Status='ok'|'warning'|'critical'|'unknown';
type Metric={key:string;group:string;label:string;status:Status;value:number|string;unit?:string;message:string;threshold:string;details?:Record<string,unknown>};
type Snapshot={captured_at:string;window_minutes:number;overall_status:Status;summary:Record<Status,number>;api:{requests:number;p50_ms:number;p95_ms:number;p99_ms:number;rate_4xx:number;rate_5xx:number;top_error_routes:{route:string;count:number}[]};db_pool:{max:number;total:number;idle:number;active:number;waiting:number;utilization_pct:number};slow_queries:{count:number;failed:number;max_ms:number;threshold_ms:number;recent:{at:number;duration_ms:number;query:string;failed:boolean}[]};metrics:Metric[];critical_alerts:{key:string;label:string;value:number|string;message:string;threshold:string}[]};
type AlertRow={alert_key:string;severity:string;title:string;detail:string;value_text:string;threshold_text:string;first_seen_at:string;last_seen_at:string;last_notified_at:string|null;resolved_at:string|null;occurrences:number};
type DeliveryRow={id:number;alert_key:string;recipient:string;channel:string;status:string;error_text?:string|null;created_at:string};
type HistoryRow={captured_at:string;payload?:{api?:{p50_ms?:number;p95_ms?:number;p99_ms?:number;rate_5xx?:number}}};

const statusText:Record<Status,string>={ok:'RENDBEN',warning:'FIGYELEM',critical:'KRITIKUS',unknown:'NINCS ADAT'};
const fmt=(v:number|string,unit?:string)=>`${typeof v==='number'?new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(v):v}${unit?` ${unit}`:''}`;

export default function ObservabilityApmPanel(){
 const[snapshot,setSnapshot]=useState<Snapshot|null>(null),[history,setHistory]=useState<HistoryRow[]>([]),[alerts,setAlerts]=useState<AlertRow[]>([]),[deliveries,setDeliveries]=useState<DeliveryRow[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[running,setRunning]=useState(false);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const[current,hist,alertRes,deliveryRes]=await Promise.all([api.get('/api/transactions/notifications/observability'),api.get('/api/transactions/notifications/observability/history?hours=24'),api.get('/api/transactions/notifications/observability/alerts?limit=50'),api.get('/api/transactions/notifications/observability/deliveries?limit=30')]);setSnapshot(current.data);setHistory(hist.data?.points||[]);setAlerts(alertRes.data?.items||[]);setDeliveries(deliveryRes.data?.items||[])}catch(e:any){setError(e?.response?.data?.message||'Az Observability / APM adatok nem tölthetők be.')}finally{setLoading(false)}},[]);
 async function runNow(){setRunning(true);setError('');try{await api.post('/api/transactions/notifications/observability/run',{window_minutes:15});await load()}catch(e:any){setError(e?.response?.data?.message||'Az APM mintavétel nem futtatható.')}finally{setRunning(false)}}
 useEffect(()=>{void load();const id=window.setInterval(()=>void load(),60_000);return()=>window.clearInterval(id)},[load]);
 const groups=useMemo(()=>{const map=new Map<string,Metric[]>();for(const m of snapshot?.metrics||[]){if(!map.has(m.group))map.set(m.group,[]);map.get(m.group)!.push(m)}return[...map.entries()]},[snapshot]);
 const chart=useMemo(()=>history.map(row=>{const p=row.payload||{};return{time:new Date(row.captured_at).toLocaleTimeString('hu-HU',{hour:'2-digit',minute:'2-digit'}),p50:Number(p.api?.p50_ms||0),p95:Number(p.api?.p95_ms||0),p99:Number(p.api?.p99_ms||0)}}),[history]);
 const openAlerts=alerts.filter(x=>!x.resolved_at);
 return <section className="apm-panel">
  <header className="apm-head"><div><span>ÉLES ÜZEM · OBSERVABILITY / APM</span><h2><Activity/> Üzemi megfigyelés</h2><p>Valós idejű API-, adatbázis-, integrációs és üzleti folyamatmetrikák. A kritikus incidensek automatikusan admin értesítést indítanak.</p></div><div className="apm-head-actions"><div className={`apm-overall ${snapshot?.overall_status||'unknown'}`}><small>RENDSZERÁLLAPOT</small><b>{snapshot?statusText[snapshot.overall_status]:'—'}</b><span>{snapshot?.summary?.critical||0} kritikus · {snapshot?.summary?.warning||0} figyelmeztetés</span></div><button onClick={runNow} disabled={running}><RefreshCw size={16}/>{running?'Mintavétel…':'Mérés most'}</button></div></header>
  {error&&<div className="apm-error"><AlertTriangle size={18}/>{error}</div>}
  {snapshot&&<>
   <div className="apm-kpis">
    <article><small>API P50</small><b>{snapshot.api.p50_ms} ms</b><span>{snapshot.api.requests} kérés / {snapshot.window_minutes} perc</span></article>
    <article><small>API P95</small><b>{snapshot.api.p95_ms} ms</b><span>95. percentilis</span></article>
    <article><small>API P99</small><b>{snapshot.api.p99_ms} ms</b><span>99. percentilis</span></article>
    <article><small>HTTP 4XX</small><b>{snapshot.api.rate_4xx}%</b><span>kliensoldali hibaarány</span></article>
    <article><small>HTTP 5XX</small><b>{snapshot.api.rate_5xx}%</b><span>szerverhiba-arány</span></article>
    <article><small>DB POOL</small><b>{snapshot.db_pool.utilization_pct}%</b><span>{snapshot.db_pool.active} aktív · {snapshot.db_pool.waiting} várakozó</span></article>
   </div>

   {openAlerts.length>0&&<section className="apm-critical"><div className="apm-section-title"><ServerCrash/><div><b>Nyitott kritikus incidensek</b><span>{openAlerts.length} aktív riasztás; admin értesítés automatikus cooldownnal.</span></div></div><div className="apm-alert-list">{openAlerts.map(a=><div key={a.alert_key}><TriangleAlert/><div><b>{a.title}</b><p>{a.detail}</p><small>{a.value_text} · {a.threshold_text} · utolsó észlelés: {new Date(a.last_seen_at).toLocaleString('hu-HU')} · értesítés: {a.last_notified_at?new Date(a.last_notified_at).toLocaleString('hu-HU'):'még nem'}</small></div></div>)}</div></section>}

   <div className="apm-grid-two">
    <section className="apm-card"><div className="apm-section-title"><Activity/><div><b>API válaszidő – 24 óra</b><span>p50 / p95 / p99 idősor</span></div></div><div className="apm-chart">{chart.length?<ResponsiveContainer width="100%" height={280}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" minTickGap={30}/><YAxis unit=" ms"/><Tooltip/><Legend/><Line type="monotone" dataKey="p50" name="p50" dot={false}/><Line type="monotone" dataKey="p95" name="p95" dot={false}/><Line type="monotone" dataKey="p99" name="p99" dot={false}/></LineChart></ResponsiveContainer>:<div className="apm-empty">A történeti grafikon az első perces snapshotok után töltődik fel.</div>}</div></section>
    <section className="apm-card"><div className="apm-section-title"><Database/><div><b>DB pool és slow query</b><span>Pool terhelés és a legutóbbi lassú lekérdezések</span></div></div><div className="apm-db-stats"><span><b>{snapshot.db_pool.active}</b> aktív</span><span><b>{snapshot.db_pool.idle}</b> idle</span><span><b>{snapshot.db_pool.waiting}</b> waiting</span><span><b>{snapshot.db_pool.max}</b> max</span></div><div className="apm-slow"><div><b>{snapshot.slow_queries.count}</b><span>slow query / {snapshot.window_minutes} perc</span><small>küszöb: {snapshot.slow_queries.threshold_ms} ms · max: {snapshot.slow_queries.max_ms} ms · hibás: {snapshot.slow_queries.failed}</small></div>{snapshot.slow_queries.recent.slice(0,5).map((q,i)=><code key={`${q.at}-${i}`} title={q.query}>{q.duration_ms} ms · {q.failed?'HIBÁS · ':''}{q.query}</code>)}</div></section>
   </div>

   <section className="apm-metrics"><div className="apm-section-title"><CheckCircle2/><div><b>Üzemi metrikák</b><span>NAV, IMAP, queue-k, scheduler, kassza, settlement, készlet és payroll</span></div></div>{groups.map(([group,items])=><div className="apm-group" key={group}><h3>{group}</h3><div className="apm-metric-grid">{items.map(m=><article className={`apm-metric ${m.status}`} key={m.key}><div><span className="apm-status-dot"/><small>{statusText[m.status]}</small></div><b>{m.label}</b><strong>{fmt(m.value,m.unit)}</strong><p>{m.message}</p><em>{m.threshold}</em></article>)}</div></div>)}</section>

   <div className="apm-grid-two">
    <section className="apm-card"><div className="apm-section-title"><MailWarning/><div><b>Admin értesítési audit</b><span>Legutóbbi kritikus APM e-mail kézbesítések</span></div></div><div className="apm-deliveries">{deliveries.length?deliveries.slice(0,10).map(d=><div key={d.id}><span className={d.status}>{d.status}</span><b>{d.alert_key}</b><small>{d.recipient} · {new Date(d.created_at).toLocaleString('hu-HU')}</small></div>):<div className="apm-empty">Még nincs APM riasztási kézbesítés.</div>}</div></section>
    <section className="apm-card"><div className="apm-section-title"><Clock3/><div><b>Megfigyelési állapot</b><span>Automatikus frissítés 60 másodpercenként</span></div></div><div className="apm-runtime"><p><b>Utolsó mérés:</b> {new Date(snapshot.captured_at).toLocaleString('hu-HU')}</p><p><b>Gördülő API ablak:</b> {snapshot.window_minutes} perc</p><p><b>Történeti megőrzés:</b> 7 nap</p><p><b>Kritikus alert:</b> állapotátmenet + cooldown + auditált admin e-mail</p><button onClick={load} disabled={loading}><RefreshCw size={15}/>{loading?'Frissítés…':'Adatok frissítése'}</button></div></section>
   </div>
  </>}
 </section>
}
