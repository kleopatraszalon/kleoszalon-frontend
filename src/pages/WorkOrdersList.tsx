import React,{useCallback,useEffect,useMemo,useRef,useState}from'react';
import{Link}from'react-router-dom';
import{apiFetch}from'../utils/api';
import{rolesFromStoredToken}from'../utils/roles';
import WorkOrderNewModalPage from'./WorkOrderNewModalPage';

type WorkOrder={id:string;work_order_number?:string;kiosk_queue_code?:string|null;source_snapshot?:{source?:string}|null;title:string;status?:string;created_at?:string;locked_at?:string;archived_at?:string;location_name?:string;client_name?:string;employee_id?:string|null;employee_name?:string;can_edit?:boolean};
type Filter='all'|'new'|'open'|'closed';
type Counts=Record<Filter,number>;
type WorkOrderPage={items:WorkOrder[];page:number;limit:number;total:number;total_pages:number;group:Filter;counts:Counts};
const PAGE_SIZE=50;
const EMPTY_COUNTS:Counts={all:0,new:0,open:0,closed:0};

const statusHu=(s?:string)=>({waiting:'Új / várakozik',arrived:'Mehet a szakemberhez',in_progress:'Folyamatban',completed:'Lezárt',cancelled:'Lemondott',no_show:'Nem jelent meg'} as any)[s||'']||s||'—';
const isKiosk=(wo:WorkOrder)=>String(wo.source_snapshot?.source||'').toLowerCase()==='kiosk'||Boolean(wo.kiosk_queue_code);

export default function WorkOrdersList(){
  const roles=rolesFromStoredToken();
  const accounting=roles.includes('accounting');
  const receptionCanCall=roles.some(role=>['admin','receptionist','location_manager'].includes(role));
  const[items,setItems]=useState<WorkOrder[]>([]);
  const[counts,setCounts]=useState<Counts>(EMPTY_COUNTS);
  const[scope,setScope]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[actionId,setActionId]=useState<string|null>(null);
  const[error,setError]=useState<string|null>(null);
  const[warning,setWarning]=useState<string|null>(null);
  const[filter,setFilter]=useState<Filter>(accounting?'closed':'new');
  const[page,setPage]=useState(1);
  const[total,setTotal]=useState(0);
  const[totalPages,setTotalPages]=useState(1);
  const[newOpen,setNewOpen]=useState(false);
  const requestSeq=useRef(0);

  const load=useCallback(async(targetPage:number,targetFilter:Filter)=>{
    const request=++requestSeq.current;
    setLoading(true);setError(null);setWarning(null);
    const[listResult,summaryResult]=await Promise.allSettled([
      apiFetch<WorkOrderPage>(`/api/workorders?paginated=1&page=${targetPage}&limit=${PAGE_SIZE}&group=${targetFilter}`),
      apiFetch<any>('/api/workorders/dashboard/summary')
    ]);
    if(request!==requestSeq.current)return;
    if(listResult.status==='fulfilled'){
      const value=listResult.value;
      setItems(Array.isArray(value?.items)?value.items:[]);
      setCounts(value?.counts||EMPTY_COUNTS);
      setTotal(Number(value?.total||0));
      const pages=Math.max(1,Number(value?.total_pages||1));
      setTotalPages(pages);
      if(targetPage>pages)setPage(pages);
    }else{
      setItems([]);setCounts(EMPTY_COUNTS);setTotal(0);setTotalPages(1);
      setError((listResult.reason as any)?.message||'Nem sikerült betölteni a munkalapokat.');
    }
    if(summaryResult.status==='fulfilled')setScope(summaryResult.value?.scope||null);
    else{setScope(null);if(listResult.status==='fulfilled')setWarning('A munkalapok betöltődtek, de a dashboard összesítés átmenetileg nem elérhető.');}
    setLoading(false);
  },[]);

  useEffect(()=>{void load(page,filter)},[page,filter,load]);
  const canEdit=!accounting&&Boolean(scope?.can_edit??items.some(x=>x.can_edit));
  const scopeText=useMemo(()=>accounting?'Lezárt és archivált munkalapok':scope?.kind==='all'?'Összes szalon munkalapjai':scope?.kind==='location'?'A saját szalon munkalapjai':scope?.kind==='employee'?'Saját munkalapjaim':scope?.kind==='customer'?'Saját ügyfélmunkalapjaim':'Munkalapok',[scope,accounting]);
  const filterDefs=accounting?([['closed','Lezárt · archivált',counts.closed],['all','Összes',counts.all]]as any[]):([['new','Új / várakozik',counts.new],['open','Szakemberhez / folyamatban',counts.open],['closed','Lezárt',counts.closed],['all','Összes',counts.all]]as any[]);
  const chooseFilter=(next:Filter)=>{setPage(1);setFilter(next)};

  const callKioskGuest=async(wo:WorkOrder)=>{
    if(!receptionCanCall||!wo.can_edit||wo.status!=='waiting'||!isKiosk(wo))return;
    if(!wo.employee_id){setError(`${wo.kiosk_queue_code||wo.work_order_number||'A kioskos munkalap'}: előbb jelölj ki szakembert.`);return;}
    setActionId(wo.id);setError(null);
    try{
      await apiFetch(`/api/workorders/${encodeURIComponent(wo.id)}/lifecycle`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'arrived'})});
      await load(page,filter);
    }catch(e:any){setError(e?.response?.data?.message||e?.message||'A vendég továbbengedése nem sikerült.');}
    finally{setActionId(null);}
  };

  return <div className="home-container app-shell app-shell--collapsed"><main className="calendar-container">
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',alignItems:'center',gap:12}}>
      <div><h2 style={{fontSize:'1.5rem',fontWeight:700,margin:0}}>{accounting?'Könyvelési munkalaparchívum':'Munkalapok'}</h2><div style={{fontSize:12,color:'#667085',marginTop:4}}>{scopeText}. {accounting?'A könyvelési fiókban ezek a munkalapok csak olvashatók.':'Az időpontból, online foglalásból és kioskból keletkező munkalapok egy listában vannak. A kioskos sorszám minden nap KIOSK001-ről indul.'}</div></div>
      {canEdit&&<button type="button" onClick={()=>setNewOpen(true)} style={{backgroundColor:'#4f46e5',color:'#fff',border:'0',borderRadius:7,padding:'0.55rem 0.95rem',fontSize:'0.9rem',fontWeight:700,cursor:'pointer'}}>+ Új munkalap</button>}
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>{filterDefs.map(([key,label,count])=><button key={key} onClick={()=>chooseFilter(key)} style={filter===key?activeFilter:filterButton}>{label} <b>{count}</b></button>)}</div>
    {loading&&<p>Betöltés...</p>}
    {warning&&<p style={{color:'#b54708',background:'#fffaeb',padding:'10px 12px',borderRadius:8}}>{warning}</p>}
    {error&&<div style={{color:'#b42318',background:'#fef3f2',padding:'12px',borderRadius:8,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><span>{error}</span><button onClick={()=>void load(page,filter)} style={retryButton}>Újrapróbálás</button></div>}
    {!loading&&!error&&<><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}><thead><tr><th style={th}>Munkalapszám</th><th style={th}>KIOSK sorszám</th><th style={th}>Szalon</th><th style={th}>Vendég</th><th style={th}>Munkatárs</th><th style={th}>Státusz</th><th style={th}>Recepció</th><th style={th}>Hozzáférés</th><th style={th}>Létrehozva</th></tr></thead><tbody>{items.map(wo=><tr key={wo.id}><td style={td}><Link to={`/workorders/${wo.id}`} style={{fontWeight:900,letterSpacing:.25}}>{wo.work_order_number||wo.id}</Link></td><td style={td}>{wo.kiosk_queue_code?<strong style={queueCode}>{wo.kiosk_queue_code}</strong>:'—'}</td><td style={td}>{wo.location_name||'—'}</td><td style={td}>{wo.client_name||'—'}</td><td style={td}>{wo.employee_name||'—'}</td><td style={td}>{statusHu(wo.status)}</td><td style={td}>{receptionCanCall&&isKiosk(wo)&&wo.status==='waiting'?wo.employee_id?<button type="button" disabled={actionId===wo.id} onClick={()=>void callKioskGuest(wo)} style={callButton}>{actionId===wo.id?'Átállítás…':'Mehet a szakemberhez'}</button>:<Link to={`/workorders/${wo.id}`} style={assignLink}>Szakember kijelölése</Link>:wo.status==='arrived'&&isKiosk(wo)?<span style={readyPill}>KIHÍVVA</span>:'—'}</td><td style={td}>{accounting||wo.locked_at||wo.archived_at?<span style={locked}>LEZÁRT · ARCHIVÁLT · CSAK OLVASHATÓ</span>:wo.can_edit?<span style={edit}>SZERKESZTHETŐ</span>:<span style={readonly}>CSAK OLVASHATÓ</span>}</td><td style={td}>{wo.created_at?new Date(wo.created_at).toLocaleString('hu-HU'):'—'}</td></tr>)}{items.length===0&&<tr><td colSpan={9} style={{padding:'1rem',textAlign:'center'}}>{accounting?'Nincs lezárt és archivált munkalap.':'Ebben a státuszcsoportban nincs munkalap.'}</td></tr>}</tbody></table></div>
    {total>0&&<div style={pager}><span>Találatok: <b>{total}</b> · Oldal <b>{page}</b> / {totalPages}</span><div style={{display:'flex',gap:8}}><button type="button" disabled={page<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))} style={page<=1?disabledPageButton:pageButton}>‹ Előző</button><button type="button" disabled={page>=totalPages||loading} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} style={page>=totalPages?disabledPageButton:pageButton}>Következő ›</button></div></div>}</>}
  </main>{newOpen&&<WorkOrderNewModalPage onClose={()=>{setNewOpen(false);void load(page,filter)}}/>}</div>
}

const th:React.CSSProperties={textAlign:'left',padding:'0.6rem 0.45rem',borderBottom:'1px solid #e5e7eb',whiteSpace:'nowrap'};
const td:React.CSSProperties={padding:'0.6rem 0.45rem',borderTop:'1px solid #e5e7eb',verticalAlign:'middle'};
const pill:React.CSSProperties={display:'inline-block',padding:'3px 7px',borderRadius:999,fontSize:10,fontWeight:900,whiteSpace:'nowrap'};
const locked={...pill,background:'#fef3f2',color:'#b42318'};
const edit={...pill,background:'#ecfdf3',color:'#027a48'};
const readonly={...pill,background:'#f2f4f7',color:'#475467'};
const readyPill={...pill,background:'#fff6d6',color:'#8a5a00'};
const queueCode:React.CSSProperties={display:'inline-block',padding:'5px 9px',borderRadius:8,background:'#2b2118',color:'#fff',letterSpacing:.5,whiteSpace:'nowrap'};
const callButton:React.CSSProperties={border:0,background:'#146c43',color:'#fff',borderRadius:7,padding:'7px 10px',fontWeight:900,cursor:'pointer',whiteSpace:'nowrap'};
const assignLink:React.CSSProperties={display:'inline-block',padding:'6px 9px',borderRadius:7,background:'#fff6ed',color:'#b54708',fontWeight:900,textDecoration:'none',whiteSpace:'nowrap'};
const filterButton:React.CSSProperties={border:'1px solid #ddd3ca',background:'#fff',borderRadius:999,padding:'8px 13px',cursor:'pointer',fontWeight:800,color:'#5c5148'};
const activeFilter:React.CSSProperties={...filterButton,background:'#2b2118',color:'#fff',borderColor:'#2b2118'};
const retryButton:React.CSSProperties={border:'1px solid #f04438',background:'#fff',color:'#b42318',borderRadius:7,padding:'6px 10px',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap'};
const pager:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'14px 0',fontSize:13,color:'#667085'};
const pageButton:React.CSSProperties={border:'1px solid #d0d5dd',background:'#fff',color:'#344054',borderRadius:7,padding:'7px 11px',fontWeight:800,cursor:'pointer'};
const disabledPageButton:React.CSSProperties={...pageButton,opacity:.45,cursor:'default'};