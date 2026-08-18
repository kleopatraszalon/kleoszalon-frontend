import React,{useEffect,useMemo,useState}from'react';
import{AlertTriangle,CheckCircle2,ChevronDown,ChevronRight,Database,GitCommit,RefreshCw,Save,Server,ShieldCheck,TestTube2,XCircle}from'lucide-react';
import api from'../api';
import'./ReleaseControlCenter.css';

type GateStatus='pass'|'warning'|'fail'|'pending';
type Gate={key:string;group:string;label:string;status:GateStatus;blocking:boolean;editable?:boolean;message:string;evidence?:string|null;source?:string|null;updated_at?:string|null;updated_by?:string|null};
type Snapshot={generated_at:string;release_ref:string;release_ready:boolean;decision:'GO'|'NO-GO';summary:{total:number;pass:number;warning:number;fail:number;pending:number;blocking_total:number;blocking_open:number};blockers:{key:string;label:string;status:GateStatus;message:string}[];meta:any;gates:Gate[]};
const order=['Verzió és build','Runtime','Adatbázis','Automatikus tesztek','Integrációk','Biztonság','Infrastruktúra','Üzemeltetés','Kódstabilitás','Jóváhagyás'];
const statusLabel:Record<GateStatus,string>={pass:'PASS',warning:'FIGYELEM',fail:'HIBA',pending:'FÜGGŐ'};
const statusIcon=(status:GateStatus)=>status==='pass'?<CheckCircle2 size={18}/>:status==='warning'||status==='pending'?<AlertTriangle size={18}/>:<XCircle size={18}/>;

export default function ReleaseControlCenter(){
 const[data,setData]=useState<Snapshot|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[openGroups,setOpenGroups]=useState<Record<string,boolean>>({}),[drafts,setDrafts]=useState<Record<string,{status:GateStatus;evidence:string}>>({}),[saving,setSaving]=useState('');
 async function load(){setLoading(true);setError('');try{const r=await api.get('/api/transactions/release-control');setData(r.data);const next:Record<string,{status:GateStatus;evidence:string}>={};for(const g of(r.data?.gates||[]))if(g.editable)next[g.key]={status:g.status,evidence:g.evidence||''};setDrafts(next)}catch(e:any){setError(e?.response?.data?.message||'A Release Control Center nem tölthető be.')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 const groups=useMemo(()=>{const m=new Map<string,Gate[]>();for(const g of(data?.gates||[]){if(!m.has(g.group))m.set(g.group,[]);m.get(g.group)!.push(g)}return Array.from(m.entries()).sort((a,b)=>(order.indexOf(a[0])<0?99:order.indexOf(a[0]))-(order.indexOf(b[0])<0?99:order.indexOf(b[0])));},[data]);
 async function save(g:Gate){const d=drafts[g.key];if(!data||!d)return;setSaving(g.key);setError('');try{await api.post('/api/transactions/release-control/evidence',{release_ref:data.release_ref,key:g.key,status:d.status,evidence:d.evidence,source:'vir-admin'});await load()}catch(e:any){setError(e?.response?.data?.message||'A release-bizonyíték nem menthető.')}finally{setSaving('')}}
 function toggle(group:string){setOpenGroups(x=>({...x,[group]:x[group]===false?true:false}))}
 return <section className="release-control-center">
  <div className="release-control-hero">
   <div className="release-control-title"><span>ADMINISZTRÁCIÓ · RELEASE GATE</span><h1><ShieldCheck/> Release Control Center</h1><p>Élesítési döntés egy helyen: verzió, adatbázis, tesztek, integrációk, infrastruktúra és jóváhagyási bizonyítékok.</p></div>
   <div className={`release-decision ${data?.release_ready?'go':'no-go'}`}><small>RELEASE READY</small><strong>{data?data.release_ready?'YES':'NO':'—'}</strong><span>{data?.decision||'ELLENŐRZÉS'}</span></div>
   <button className="release-refresh" onClick={load} disabled={loading}><RefreshCw size={17}/>{loading?'Frissítés…':'Frissítés'}</button>
  </div>
  {error&&<div className="release-error">{error}</div>}
  {data&&<>
   <div className="release-meta-grid">
    <article><GitCommit/><div><small>BACKEND RELEASE</small><b title={data.release_ref}>{data.release_ref.slice(0,12)}</b><span>{data.meta?.environment||'unknown'}</span></div></article>
    <article><Database/><div><small>ADATBÁZIS</small><b>{data.meta?.migration_count??0} migráció</b><span>{data.meta?.last_migration?.version||'nincs migrációs verzió'}</span></div></article>
    <article><Server/><div><small>INFRASTRUKTÚRA</small><b>{data.meta?.instance_count??1} API instance</b><span>DB HA: {data.meta?.database_ha_enabled?'aktív':'nem aktív'}</span></div></article>
    <article><TestTube2/><div><small>NYITOTT KAPUK</small><b>{data.summary.blocking_open}</b><span>{data.summary.blocking_total} kötelező gate-ből</span></div></article>
   </div>
   <div className="release-summary-strip"><span className="pass"><b>{data.summary.pass}</b> PASS</span><span className="warning"><b>{data.summary.warning}</b> FIGYELEM</span><span className="fail"><b>{data.summary.fail}</b> HIBA</span><span className="pending"><b>{data.summary.pending}</b> FÜGGŐ</span><small>Frissítve: {new Date(data.generated_at).toLocaleString('hu-HU')}</small></div>
   {!data.release_ready&&data.blockers.length>0&&<div className="release-blockers"><div><XCircle size={19}/><b>Élesítést blokkoló tételek</b><span>{data.blockers.length} nyitott kötelező gate</span></div><ul>{data.blockers.slice(0,8).map(b=><li key={b.key}><strong>{b.label}</strong><span>{b.message}</span></li>)}</ul>{data.blockers.length>8&&<small>+ {data.blockers.length-8} további blokkoló tétel az alábbi csoportokban.</small>}</div>}
   <div className="release-groups">{groups.map(([group,gates])=>{const closed=openGroups[group]===false;const bad=gates.filter(x=>x.blocking&&x.status!=='pass').length;return <article className="release-group" key={group}><button className="release-group-head" onClick={()=>toggle(group)}><div>{closed?<ChevronRight/>:<ChevronDown/>}<b>{group}</b></div><span className={bad?'has-blocker':'clear'}>{bad?`${bad} blokkoló`:'rendben'}</span></button>{!closed&&<div className="release-gate-list">{gates.map(g=><div className={`release-gate ${g.status}`} key={g.key}><div className="release-gate-main"><div className="release-status-icon">{statusIcon(g.status)}</div><div><div className="release-gate-name"><b>{g.label}</b>{g.blocking&&<em>KÖTELEZŐ</em>}<span>{statusLabel[g.status]}</span></div><p>{g.message}</p>{g.updated_at&&<small>{g.updated_by||g.source||'rendszer'} · {new Date(g.updated_at).toLocaleString('hu-HU')}</small>}</div></div>{g.editable&&<div className="release-evidence-editor"><select value={drafts[g.key]?.status||g.status} onChange={e=>setDrafts(x=>({...x,[g.key]:{status:e.target.value as GateStatus,evidence:x[g.key]?.evidence||''}}))}><option value="pending">Függő</option><option value="pass">PASS</option><option value="warning">Figyelem</option><option value="fail">Hiba</option></select><input value={drafts[g.key]?.evidence||''} onChange={e=>setDrafts(x=>({...x,[g.key]:{status:x[g.key]?.status||g.status,evidence:e.target.value}}))} placeholder="Bizonyíték / workflow run / jegyzet / SHA"/><button onClick={()=>save(g)} disabled={saving===g.key}><Save size={15}/>{saving===g.key?'Mentés…':'Mentés'}</button></div>}</div>)}</div>}</article>})}</div>
   <div className={`release-final ${data.release_ready?'go':'no-go'}`}>{data.release_ready?<><CheckCircle2/><div><b>GO – a kötelező release gate-ek teljesülnek</b><span>A kiadás technikailag és bizonyíték szinten engedélyezhető. A production deploy továbbra is a jóváhagyott release-folyamaton keresztül történjen.</span></div></>:<><AlertTriangle/><div><b>NO-GO – az élesítés jelenleg blokkolt</b><span>A fent jelzett kötelező kapukat PASS állapotba kell hozni. A Release Control Center nem engedi a hiányzó bizonyítékot zöld állapotként kezelni.</span></div></>}</div>
  </>}
 </section>
}
