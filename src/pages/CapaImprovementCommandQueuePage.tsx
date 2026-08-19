import {useCallback,useEffect,useState} from 'react';
import {AlertTriangle,ArrowLeft,CheckCircle2,Clock3,ExternalLink,FolderKanban,RefreshCw,Search,ShieldAlert,Target,UserRoundCheck,Users} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import api from '../api';
import './CapaImprovementCommandQueuePage.css';

const BASE='/api/transactions/notifications/exceptions/intelligence/capa/improvement-recommendations';
const recommendationHu:Record<string,string>={recommended:'Projekt javasolt',monitoring:'Megfigyelés',dismissed:'Vezető által elutasítva'};
const capaStatusHu:Record<string,string>={proposed:'Javasolt',approved:'Jóváhagyott',in_progress:'Folyamatban',verification:'Verifikáció',verified:'Igazolt',rejected:'Elutasított'};
const reasonHu:Record<string,string>={critical_severity:'Kritikus súlyosság',high_severity:'Magas súlyosság',repeated_exception:'Ismétlődő eltérés',exception_outbreak:'Tömeges eltérés / outbreak',cross_process_cluster:'Több folyamatot érintő klaszter',high_case_count:'Magas esetszám',multiple_cases:'Több kapcsolt eset',multiple_sources:'Több adatforrás',capa_overdue:'Lejárt CAPA határidő'};
const fmtDate=(v:any)=>v?new Date(v).toLocaleDateString('hu-HU'):'—';
const num=(v:any)=>Number(v||0);

export default function CapaImprovementCommandQueuePage(){
  const navigate=useNavigate();
  const [summary,setSummary]=useState<any>(null);
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('all');
  const [risk,setRisk]=useState('all');
  const [owner,setOwner]=useState('all');
  const [project,setProject]=useState('pending');
  const [q,setQ]=useState('');
  const [scopeLocation,setScopeLocation]=useState(false);
  const locationId=localStorage.getItem('kleo_location_id')||'';

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const p=new URLSearchParams();
      if(status!=='all')p.set('status',status);
      if(risk!=='all')p.set('risk',risk);
      if(owner!=='all')p.set('owner',owner);
      if(project!=='all')p.set('project',project);
      if(q.trim())p.set('q',q.trim());
      if(scopeLocation&&locationId)p.set('location_id',locationId);
      const query=p.toString();
      const summaryQuery=scopeLocation&&locationId?`?location_id=${encodeURIComponent(locationId)}`:'';
      const [s,l]=await Promise.all([api.get(`${BASE}/summary${summaryQuery}`),api.get(`${BASE}${query?`?${query}`:''}`)]);
      setSummary(s.data);setItems(l.data?.items||[]);
    }catch(e:any){
      setError(e?.response?.data?.message||'A fejlesztési javaslatok vezetői munkasora nem tölthető be.');
    }finally{setLoading(false)}
  },[status,risk,owner,project,q,scopeLocation,locationId]);

  useEffect(()=>{void load()},[load]);

  return <div className="capa-command-page">
    <header className="capa-command-hero">
      <div>
        <button className="capa-command-back" onClick={()=>navigate('/finance/exception-command-center/capa')}><ArrowLeft/> CAPA központ</button>
        <span>STATISZTIKA ÉS VIR · VEZETŐI FEJLESZTÉSI MUNKASOR</span>
        <h1><FolderKanban/> CAPA fejlesztési javaslatok</h1>
        <p>A rendszer által kockázati sorrendbe állított CAPA → fejlesztési projekt javaslatok. A munkasor tenant-szinten izolált, a projektindítás továbbra is emberi CAPA-jóváhagyáshoz kötött.</p>
      </div>
      <div className="capa-command-governance"><ShieldAlert/><b>HUMAN APPROVAL GATE</b><small>Automatikus priorizálás · manuális döntés · auditálható projektindítás</small></div>
    </header>

    {error&&<div className="capa-command-error"><AlertTriangle/>{error}</div>}

    {summary&&<section className="capa-command-kpis">
      <article><Target/><div><small>Projekt javasolt</small><b>{num(summary.recommended)}</b></div></article>
      <article className={num(summary.high_risk)>0?'risk':''}><ShieldAlert/><div><small>80+ kockázat</small><b>{num(summary.high_risk)}</b></div></article>
      <article className={num(summary.ready_to_promote)>0?'ready':''}><CheckCircle2/><div><small>Projektindításra kész</small><b>{num(summary.ready_to_promote)}</b></div></article>
      <article className={num(summary.overdue)>0?'risk':''}><Clock3/><div><small>Lejárt javaslat</small><b>{num(summary.overdue)}</b></div></article>
      <article className={num(summary.owner_missing)>0?'warn':''}><Users/><div><small>Felelős nélkül</small><b>{num(summary.owner_missing)}</b></div></article>
      <article><FolderKanban/><div><small>Létrehozott projekt</small><b>{num(summary.project_created)}</b></div></article>
    </section>}

    <section className="capa-command-toolbar">
      <div className="capa-command-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Keresés CAPA, klaszter vagy felelős alapján…"/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Javaslat státusz"><option value="all">Minden javaslat</option><option value="recommended">Projekt javasolt</option><option value="monitoring">Megfigyelés</option><option value="dismissed">Elutasított</option></select>
      <select value={risk} onChange={e=>setRisk(e.target.value)} aria-label="Kockázat"><option value="all">Minden kockázat</option><option value="critical">80–100</option><option value="high">50–79</option><option value="normal">0–49</option></select>
      <select value={owner} onChange={e=>setOwner(e.target.value)} aria-label="Felelős"><option value="all">Minden felelős</option><option value="missing">Felelős nélkül</option><option value="assigned">Felelőssel</option></select>
      <select value={project} onChange={e=>setProject(e.target.value)} aria-label="Projekt"><option value="pending">Projekt nélkül</option><option value="created">Projekt létrehozva</option><option value="all">Mindegyik</option></select>
      {locationId&&<label className="capa-command-scope"><input type="checkbox" checked={scopeLocation} onChange={e=>setScopeLocation(e.target.checked)}/> Csak kiválasztott telephely</label>}
      <button className="capa-command-refresh" onClick={load} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button>
    </section>

    <section className="capa-command-list">
      <header><div><b>Prioritásos vezetői munkasor</b><span>{items.length} tétel · átlagos kockázat {summary?.average_score??0}/100</span></div><small>A lista előre sorolja a jóváhagyott, projektindításra kész CAPA-kat.</small></header>
      {loading&&!items.length&&<div className="capa-command-empty">Betöltés…</div>}
      {!loading&&!items.length&&<div className="capa-command-empty"><CheckCircle2/> Nincs a szűrésnek megfelelő fejlesztési javaslat.</div>}
      {items.map(item=>{
        const reasons:Array<string>=Array.isArray(item.reason_codes)?item.reason_codes:[];
        const score=num(item.score);
        return <article key={item.capa_id} className={`capa-command-row ${item.ready_to_promote?'ready':''} ${item.overdue?'overdue':''}`}>
          <div className={`capa-command-score score-${score>=80?'critical':score>=50?'high':'normal'}`}><b>{score}</b><small>/100</small></div>
          <div className="capa-command-main">
            <div className="capa-command-state"><span>{recommendationHu[item.recommendation_status]||item.recommendation_status}</span><em>{capaStatusHu[item.capa_status]||item.capa_status}</em>{item.ready_to_promote&&<strong>PROJEKTINDÍTÁSRA KÉSZ</strong>}{item.project_id&&<strong className="project">PROJEKT LÉTREHOZVA</strong>}</div>
            <h2>{item.title}</h2>
            <p>{item.cluster_type} · {item.location_id} · {num(item.case_count)} eset · {num(item.source_count)} forrás</p>
            <div className="capa-command-reasons">{reasons.length?reasons.map(reason=><span key={reason}>{reasonHu[reason]||reason}</span>):<span>Nincs kiemelt trigger</span>}</div>
          </div>
          <div className="capa-command-meta">
            <div><UserRoundCheck/><span><small>Felelős</small><b>{item.owner_key||item.owner_team||'Nincs kijelölve'}</b></span></div>
            <div><Clock3/><span><small>Javasolt határidő</small><b>{fmtDate(item.suggested_due_at)}</b></span></div>
            <div><Target/><span><small>KPI</small><b>{item.suggested_kpi?.before_value??'—'} → {item.suggested_kpi?.target_value??'—'} {item.suggested_kpi?.unit||''}</b></span></div>
          </div>
          <div className="capa-command-actions">
            {item.project_id?<button onClick={()=>navigate(`/operations/improvement?project=${encodeURIComponent(item.project_id)}`)}><ExternalLink/> Projekt megnyitása</button>:<button onClick={()=>navigate('/finance/exception-command-center/capa')}><ExternalLink/> CAPA megnyitása</button>}
          </div>
        </article>
      })}
    </section>
  </div>;
}
