import {useCallback,useEffect,useMemo,useState} from 'react';
import {AlertTriangle,ArrowLeft,CheckCircle2,Clock3,ExternalLink,Mail,RefreshCw,Search,ShieldAlert,Target,UserCheck,Users} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import api from '../api';
import './CapaManagementWorkqueuePage.css';

const BASE='/api/transactions/notifications/exceptions/intelligence/capa/improvement-workqueue';
const CAPA_BASE='/api/transactions/notifications/exceptions/intelligence/capa';
const severityHu:Record<string,string>={critical:'KRITIKUS',high:'MAGAS',medium:'KÖZEPES',low:'ALACSONY'};
const recommendationHu:Record<string,string>={recommended:'Projekt javasolt',monitoring:'Megfigyelés',dismissed:'Elutasítva'};
const fmtDate=(value:any)=>value?new Date(value).toLocaleDateString('hu-HU'):'—';
const fmtDateTime=(value:any)=>value?new Date(value).toLocaleString('hu-HU'):'—';

export default function CapaManagementWorkqueuePage(){
  const navigate=useNavigate();
  const currentLocationId=localStorage.getItem('kleo_location_id')||'';
  const[summary,setSummary]=useState<any>(null);
  const[items,setItems]=useState<any[]>([]);
  const[selectedId,setSelectedId]=useState('');
  const[loading,setLoading]=useState(false);
  const[actionLoading,setActionLoading]=useState(false);
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  const[status,setStatus]=useState('recommended');
  const[severity,setSeverity]=useState('all');
  const[q,setQ]=useState('');
  const[onlyOverdue,setOnlyOverdue]=useState(false);
  const[onlyUnassigned,setOnlyUnassigned]=useState(false);
  const[onlyCurrentLocation,setOnlyCurrentLocation]=useState(false);
  const[ownerKey,setOwnerKey]=useState('');
  const[ownerTeam,setOwnerTeam]=useState('');
  const[note,setNote]=useState('');

  const selected=useMemo(()=>items.find(item=>String(item.capa_id)===selectedId)||null,[items,selectedId]);

  const buildParams=useCallback(()=>{
    const params=new URLSearchParams();
    if(status!=='all')params.set('status',status);
    if(severity!=='all')params.set('severity',severity);
    if(q.trim())params.set('q',q.trim());
    if(onlyOverdue)params.set('overdue','1');
    if(onlyUnassigned)params.set('unassigned','1');
    if(onlyCurrentLocation&&currentLocationId)params.set('location_id',currentLocationId);
    params.set('limit','250');
    return params;
  },[currentLocationId,onlyCurrentLocation,onlyOverdue,onlyUnassigned,q,severity,status]);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const params=buildParams();
      const summaryParams=new URLSearchParams();
      if(onlyCurrentLocation&&currentLocationId)summaryParams.set('location_id',currentLocationId);
      const suffix=params.toString()?`?${params.toString()}`:'';
      const summarySuffix=summaryParams.toString()?`?${summaryParams.toString()}`:'';
      const[listResponse,summaryResponse]=await Promise.all([api.get(`${BASE}${suffix}`),api.get(`${BASE}/summary${summarySuffix}`)]);
      const nextItems=listResponse.data?.items||[];
      setItems(nextItems);setSummary(summaryResponse.data||{});
      setSelectedId(current=>current&&nextItems.some((item:any)=>String(item.capa_id)===current)?current:String(nextItems[0]?.capa_id||''));
    }catch(e:any){setError(e?.response?.data?.message||'A CAPA vezetői munkasor nem tölthető be.')}finally{setLoading(false)}
  },[buildParams,currentLocationId,onlyCurrentLocation]);

  useEffect(()=>{void load()},[load]);
  useEffect(()=>{
    setOwnerKey(String(selected?.assigned_owner_key||selected?.suggested_owner_key||''));
    setOwnerTeam(String(selected?.assigned_owner_team||selected?.suggested_owner_team||''));
    setNote(String(selected?.management_note||''));
  },[selected]);

  async function assignOwner(){
    if(!selected)return;
    if(!ownerKey.trim()&&!ownerTeam.trim()){setError('Felelős vagy felelős csapat megadása kötelező.');return}
    setActionLoading(true);setError('');setNotice('');
    try{
      const response=await api.post(`${CAPA_BASE}/${selected.capa_id}/improvement-workqueue/assign`,{owner_key:ownerKey.trim(),owner_team:ownerTeam.trim(),note:note.trim()});
      const notification=response.data?.notification;
      setNotice(notification?.sent?'Felelős kijelölve, az e-mail értesítés elküldve.':notification?.logged?'Felelős kijelölve; az SMTP nem küldött, az értesítés naplózva lett.':'Felelős kijelölve.');
      await load();
    }catch(e:any){setError(e?.response?.data?.message||'A felelős kijelölése nem sikerült.')}finally{setActionLoading(false)}
  }

  async function acknowledge(){
    if(!selected)return;
    setActionLoading(true);setError('');setNotice('');
    try{
      await api.post(`${CAPA_BASE}/${selected.capa_id}/improvement-workqueue/acknowledge`,{note:note.trim()});
      setNotice('A felelősi kijelölés visszaigazolva.');
      await load();
    }catch(e:any){setError(e?.response?.data?.message||'A visszaigazolás nem sikerült.')}finally{setActionLoading(false)}
  }

  const score=Number(selected?.score||0);
  return <div className="capa-mq-page">
    <header className="capa-mq-hero">
      <div>
        <button className="capa-mq-back" onClick={()=>navigate('/finance/exception-command-center/capa')}><ArrowLeft/> CAPA központ</button>
        <span>STATISZTIKA ÉS VIR · MANAGEMENT ESCALATION</span>
        <h1><ShieldAlert/> CAPA vezetői munkasor</h1>
        <p>A fejlesztési projektnek javasolt CAPA-k kockázati sorrendje, felelős-kiosztása, visszaigazolása és projektkapcsolata egy tenant-szintű munkafelületen.</p>
      </div>
      <div className="capa-mq-governance"><Target/><b>GOVERNED WORK QUEUE</b><small>A munkasor nem hoz létre projektet automatikusan. Új projekt csak ember által jóváhagyott CAPA-ból indítható.</small></div>
    </header>

    {summary&&<section className="capa-mq-kpis">
      <article><Target/><div><small>Projekt javasolt</small><b>{summary.recommended||0}</b></div></article>
      <article className={Number(summary.critical)>0?'danger':''}><ShieldAlert/><div><small>Kritikus</small><b>{summary.critical||0}</b></div></article>
      <article><AlertTriangle/><div><small>Magas</small><b>{summary.high||0}</b></div></article>
      <article className={Number(summary.overdue)>0?'danger':''}><Clock3/><div><small>Lejárt</small><b>{summary.overdue||0}</b></div></article>
      <article><Users/><div><small>Kiosztatlan</small><b>{summary.unassigned||0}</b></div></article>
      <article><UserCheck/><div><small>Visszaigazolásra vár</small><b>{summary.needs_ack||0}</b></div></article>
      <article><CheckCircle2/><div><small>Projektre kész</small><b>{summary.ready_to_promote||0}</b></div></article>
      <article><ExternalLink/><div><small>Kapcsolt projekt</small><b>{summary.linked_projects||0}</b></div></article>
    </section>}

    <section className="capa-mq-toolbar">
      <div className="capa-mq-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="CAPA, klaszter vagy probléma keresése…"/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="recommended">Projekt javasolt</option><option value="monitoring">Megfigyelés</option><option value="dismissed">Elutasítva</option><option value="all">Minden állapot</option></select>
      <select value={severity} onChange={e=>setSeverity(e.target.value)}><option value="all">Minden súlyosság</option><option value="critical">Kritikus</option><option value="high">Magas</option><option value="medium">Közepes</option><option value="low">Alacsony</option></select>
      <label><input type="checkbox" checked={onlyOverdue} onChange={e=>setOnlyOverdue(e.target.checked)}/> Csak lejárt</label>
      <label><input type="checkbox" checked={onlyUnassigned} onChange={e=>setOnlyUnassigned(e.target.checked)}/> Csak kiosztatlan</label>
      {currentLocationId&&<label><input type="checkbox" checked={onlyCurrentLocation} onChange={e=>setOnlyCurrentLocation(e.target.checked)}/> Aktuális telephely</label>}
      <button onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button>
    </section>

    {error&&<div className="capa-mq-message error"><AlertTriangle/>{error}</div>}
    {notice&&<div className="capa-mq-message ok"><CheckCircle2/>{notice}</div>}

    <section className="capa-mq-workspace">
      <div className="capa-mq-list">
        <header><b>Prioritási munkasor</b><span>{items.length} rekord</span></header>
        {loading&&!items.length&&<div className="capa-mq-empty">Betöltés…</div>}
        {items.map(item=><button key={item.capa_id} onClick={()=>setSelectedId(String(item.capa_id))} className={`${selectedId===String(item.capa_id)?'active':''} sev-${item.severity}`}>
          <div className="capa-mq-rowtop"><span>{severityHu[item.severity]||item.severity}</span><b>{Number(item.score||0)}/100</b></div>
          <h3>{item.title}</h3>
          <p>{recommendationHu[item.recommendation_status]||item.recommendation_status} · {item.cluster_type} · {item.case_count} eset</p>
          <div className="capa-mq-badges">{item.overdue&&<em>LEJÁRT</em>}{item.unassigned&&<em>KIOSZTATLAN</em>}{item.ready_to_promote&&<em>PROJEKTRE KÉSZ</em>}{item.project_id&&<em>PROJEKT KAPCSOLVA</em>}</div>
          <footer><span>{item.assigned_owner_key||item.assigned_owner_team||'Nincs felelős'}</span><time>{fmtDate(item.suggested_due_at)}</time></footer>
        </button>)}
        {!loading&&!items.length&&<div className="capa-mq-empty"><CheckCircle2/> Nincs találat a szűrésben.</div>}
      </div>

      <div className="capa-mq-detail">
        {!selected?<div className="capa-mq-placeholder"><UserCheck/><h2>Válasszon vezetői tételt</h2><p>A jobb oldalon jelenik meg a CAPA kockázata, felelőse, határideje és approval állapota.</p></div>:<>
          <header className="capa-mq-detail-head"><div><span>{severityHu[selected.severity]||selected.severity} · {recommendationHu[selected.recommendation_status]||selected.recommendation_status}</span><h2>{selected.title}</h2><p>{selected.cluster_key} · telephely {selected.location_id||'—'} · utolsó értékelés: {fmtDateTime(selected.last_evaluated_at)}</p></div><div className={`capa-mq-score ${score>=80?'critical':score>=50?'high':'normal'}`}><b>{score}</b><small>/100</small></div></header>

          <div className="capa-mq-detail-grid">
            <article><small>Javasolt határidő</small><b>{fmtDate(selected.suggested_due_at)}</b><span>{selected.overdue?'Határidő túllépve':'Kockázatalapú célidő'}</span></article>
            <article><small>CAPA állapot</small><b>{selected.capa_status}</b><span>{selected.ready_to_promote?'Projektindítási gate teljesült':'Projektindításhoz approved szükséges'}</span></article>
            <article><small>Felelősi státusz</small><b>{selected.assigned_owner_key||selected.assigned_owner_team||'Kiosztatlan'}</b><span>{selected.acknowledged_at?`Visszaigazolva: ${fmtDateTime(selected.acknowledged_at)}`:'Nincs visszaigazolás'}</span></article>
            <article><small>Kapcsolt projekt</small><b>{selected.project_code||'Nincs'}</b><span>{selected.project_status||'—'} {selected.project_approval_state?`· ${selected.project_approval_state}`:''}</span></article>
          </div>

          <section className="capa-mq-context"><h3>Probléma és gyökérok</h3><p><b>Probléma:</b> {selected.problem_statement||'—'}</p><p><b>Gyökérok:</b> {selected.root_cause_hypothesis||'—'}</p><p><b>Javító intézkedés:</b> {selected.corrective_action||'—'}</p><p><b>Megelőző intézkedés:</b> {selected.preventive_action||'—'}</p></section>

          {!selected.project_id&&selected.recommendation_status==='recommended'&&<section className="capa-mq-assignment"><h3><Users/> Felelős kijelölése</h3><div className="capa-mq-fields"><label>Felelős azonosító / e-mail<input value={ownerKey} onChange={e=>setOwnerKey(e.target.value)} placeholder="nev@kleoszalon.hu"/></label><label>Felelős csapat<input value={ownerTeam} onChange={e=>setOwnerTeam(e.target.value)} placeholder="management / finance / operations"/></label></div><label>Vezetői megjegyzés<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Kiosztási vagy végrehajtási megjegyzés…"/></label><div className="capa-mq-actions"><button className="primary" onClick={assignOwner} disabled={actionLoading}><Mail/> Felelős kijelölése és értesítése</button>{(selected.assigned_owner_key||selected.assigned_owner_team)&&!selected.acknowledged_at&&<button onClick={acknowledge} disabled={actionLoading}><UserCheck/> Kijelölés visszaigazolása</button>}</div><small>Ha a felelős mezőben e-mail cím szerepel, a VIR értesítést küld és delivery evidence-et rögzít.</small></section>}

          <section className="capa-mq-governance-box"><ShieldAlert/><div><b>Projekt governance</b><p>A vezetői munkasor felelőst rendel és eszkalációt követ, de projektet nem hoz létre automatikusan. A projekt létrehozása a CAPA központban, emberi jóváhagyás után történik.</p></div></section>

          <div className="capa-mq-footer-actions"><button onClick={()=>navigate('/finance/exception-command-center/capa')}><ExternalLink/> CAPA központ megnyitása</button>{selected.project_id&&<button className="primary" onClick={()=>navigate(`/operations/improvement?project=${encodeURIComponent(selected.project_id)}`)}><ExternalLink/> Kapcsolt projekt megnyitása</button>}</div>
        </>}
      </div>
    </section>
  </div>
}
