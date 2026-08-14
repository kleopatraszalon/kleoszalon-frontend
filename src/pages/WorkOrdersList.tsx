import React,{useEffect,useMemo,useState}from'react';
import{Link}from'react-router-dom';
import{apiFetch}from'../utils/api';
import{rolesFromStoredToken}from'../utils/roles';
import WorkOrderNewModalPage from'./WorkOrderNewModalPage';

type WorkOrder={id:string;work_order_number?:string;title:string;status?:string;created_at?:string;locked_at?:string;archived_at?:string;location_name?:string;client_name?:string;employee_name?:string;can_edit?:boolean};
type Filter='all'|'new'|'open'|'closed';

const statusHu=(s?:string)=>({waiting:'Új',arrived:'Megérkezett',in_progress:'Folyamatban',completed:'Lezárt',cancelled:'Lemondott',no_show:'Nem jelent meg'} as any)[s||'']||s||'—';
const group=(x:WorkOrder):Exclude<Filter,'all'>=>x.status==='waiting'?'new':['arrived','in_progress'].includes(x.status||'')?'open':'closed';

export default function WorkOrdersList(){
  const accounting=rolesFromStoredToken().includes('accounting');
  const[items,setItems]=useState<WorkOrder[]>([]);
  const[scope,setScope]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[warning,setWarning]=useState<string|null>(null);
  const[filter,setFilter]=useState<Filter>(accounting?'closed':'new');
  const[newOpen,setNewOpen]=useState(false);

  async function load(){
    setLoading(true);setError(null);setWarning(null);
    const[listResult,summaryResult]=await Promise.allSettled([
      apiFetch<any[]>('/api/workorders'),
      apiFetch<any>('/api/workorders/dashboard/summary')
    ]);

    if(listResult.status==='fulfilled'){
      setItems(Array.isArray(listResult.value)?listResult.value:[]);
    }else{
      setItems([]);
      setError((listResult.reason as any)?.message||'Nem sikerült betölteni a munkalapokat.');
    }

    if(summaryResult.status==='fulfilled'){
      setScope(summaryResult.value?.scope||null);
    }else{
      setScope(null);
      if(listResult.status==='fulfilled')setWarning('A munkalapok betöltődtek, de a dashboard összesítés átmenetileg nem elérhető.');
    }
    setLoading(false);
  }

  useEffect(()=>{void load()},[]);
  const canEdit=!accounting&&Boolean(scope?.can_edit??items.some(x=>x.can_edit));
  const scopeText=useMemo(()=>accounting?'Lezárt és archivált munkalapok':scope?.kind==='all'?'Összes szalon munkalapjai':scope?.kind==='location'?'A saját szalon munkalapjai':scope?.kind==='employee'?'Saját munkalapjaim':scope?.kind==='customer'?'Saját ügyfélmunkalapjaim':'Munkalapok',[scope,accounting]);
  const counts=useMemo(()=>({all:items.length,new:items.filter(x=>group(x)==='new').length,open:items.filter(x=>group(x)==='open').length,closed:items.filter(x=>group(x)==='closed').length}),[items]);
  const shown=useMemo(()=>items.filter(x=>filter==='all'||group(x)===filter),[items,filter]);
  const filterDefs=accounting?([['closed','Lezárt · archivált',counts.closed],['all','Összes',counts.all]]as any[]):([['new','Új',counts.new],['open','Nyitott',counts.open],['closed','Lezárt',counts.closed],['all','Összes',counts.all]]as any[]);

  return <div className="home-container app-shell app-shell--collapsed"><main className="calendar-container">
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',alignItems:'center',gap:12}}>
      <div><h2 style={{fontSize:'1.5rem',fontWeight:700,margin:0}}>{accounting?'Könyvelési munkalaparchívum':'Munkalapok'}</h2><div style={{fontSize:12,color:'#667085',marginTop:4}}>{scopeText}. {accounting?'A könyvelési fiókban ezek a munkalapok csak olvashatók.':'Az időpontból, online foglalásból és kioskból keletkező munkalapok egy listában vannak.'}</div></div>
      {canEdit&&<button type="button" onClick={()=>setNewOpen(true)} style={{backgroundColor:'#4f46e5',color:'#fff',border:'0',borderRadius:7,padding:'0.55rem 0.95rem',fontSize:'0.9rem',fontWeight:700,cursor:'pointer'}}>+ Új munkalap</button>}
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>{filterDefs.map(([key,label,count])=><button key={key} onClick={()=>setFilter(key)} style={filter===key?activeFilter:filterButton}>{label} <b>{count}</b></button>)}</div>
    {loading&&<p>Betöltés...</p>}
    {warning&&<p style={{color:'#b54708',background:'#fffaeb',padding:'10px 12px',borderRadius:8}}>{warning}</p>}
    {error&&<div style={{color:'#b42318',background:'#fef3f2',padding:'12px',borderRadius:8,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><span>{error}</span><button onClick={()=>void load()} style={retryButton}>Újrapróbálás</button></div>}
    {!loading&&!error&&<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}><thead><tr><th style={th}>Munkalapszám</th><th style={th}>Szalon</th><th style={th}>Vendég</th><th style={th}>Munkatárs</th><th style={th}>Státusz</th><th style={th}>Hozzáférés</th><th style={th}>Létrehozva</th></tr></thead><tbody>{shown.map(wo=><tr key={wo.id}><td style={td}><Link to={`/workorders/${wo.id}`} style={{fontWeight:900,letterSpacing:.25}}>{wo.work_order_number||wo.id}</Link></td><td style={td}>{wo.location_name||'—'}</td><td style={td}>{wo.client_name||'—'}</td><td style={td}>{wo.employee_name||'—'}</td><td style={td}>{statusHu(wo.status)}</td><td style={td}>{accounting||wo.locked_at||wo.archived_at?<span style={locked}>LEZÁRT · ARCHIVÁLT · CSAK OLVASHATÓ</span>:wo.can_edit?<span style={edit}>SZERKESZTHETŐ</span>:<span style={readonly}>CSAK OLVASHATÓ</span>}</td><td style={td}>{wo.created_at?new Date(wo.created_at).toLocaleString('hu-HU'):'—'}</td></tr>)}{shown.length===0&&<tr><td colSpan={7} style={{padding:'1rem',textAlign:'center'}}>{accounting?'Nincs lezárt és archivált munkalap.':'Ebben a státuszcsoportban nincs munkalap.'}</td></tr>}</tbody></table></div>}
  </main>{newOpen&&<WorkOrderNewModalPage onClose={()=>setNewOpen(false)}/>}</div>
}

const th:React.CSSProperties={textAlign:'left',padding:'0.6rem 0.45rem',borderBottom:'1px solid #e5e7eb',whiteSpace:'nowrap'};
const td:React.CSSProperties={padding:'0.6rem 0.45rem',borderTop:'1px solid #e5e7eb',verticalAlign:'middle'};
const pill:React.CSSProperties={display:'inline-block',padding:'3px 7px',borderRadius:999,fontSize:10,fontWeight:900,whiteSpace:'nowrap'};
const locked={...pill,background:'#fef3f2',color:'#b42318'};
const edit={...pill,background:'#ecfdf3',color:'#027a48'};
const readonly={...pill,background:'#f2f4f7',color:'#475467'};
const filterButton:React.CSSProperties={border:'1px solid #ddd3ca',background:'#fff',borderRadius:999,padding:'8px 13px',cursor:'pointer',fontWeight:800,color:'#5c5148'};
const activeFilter:React.CSSProperties={...filterButton,background:'#2b2118',color:'#fff',borderColor:'#2b2118'};
const retryButton:React.CSSProperties={border:'1px solid #f04438',background:'#fff',color:'#b42318',borderRadius:7,padding:'6px 10px',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap'};