import React,{useEffect,useMemo,useState}from'react';
import{Building2,LockKeyhole,RefreshCw,ShieldCheck}from'lucide-react';
import api from'../../api';

type Entity={id:string;legal_name:string;short_name?:string|null;tax_number?:string|null;accounting_ledger_code?:string|null;active?:boolean;locations?:Array<{id:string;name:string;city?:string|null;is_default?:boolean}>;is_default?:boolean};
type WorkOrderCompanyResponse={work_order?:{id:string;work_order_number?:string|null;location_id?:string|null;legal_entity_id?:string|null;legal_name?:string|null;short_name?:string|null;tax_number?:string|null;accounting_ledger_code?:string|null};choices?:Entity[];locked?:boolean};
const SELECTED='kleo_workorder_legal_entity_id';
const REQUIRED='kleo_workorder_company_selection_required';
const err=(e:any)=>e?.response?.data?.message||e?.message||'A cégadatok nem tölthetők be.';

export default function WorkOrderCompanySelector({workOrderId}:{workOrderId?:string|null}){
 const[rows,setRows]=useState<Entity[]>([]),[value,setValue]=useState(''),[locked,setLocked]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const selected=useMemo(()=>rows.find(x=>String(x.id)===value)||null,[rows,value]);
 useEffect(()=>{let alive=true;setLoading(true);setError('');void(async()=>{try{
  if(workOrderId){const r=await api.get(`/vir/receipt-compliance/legal-entities/workorders/${encodeURIComponent(workOrderId)}`);if(!alive)return;const d=r.data as WorkOrderCompanyResponse,choices=Array.isArray(d?.choices)?d.choices:[];setRows(choices);setValue(String(d?.work_order?.legal_entity_id||''));setLocked(Boolean(d?.locked));try{sessionStorage.setItem(SELECTED,String(d?.work_order?.legal_entity_id||''));sessionStorage.setItem(REQUIRED,choices.length>1?'1':'0')}catch{}}
  else{const r=await api.get('/vir/receipt-compliance/legal-entities');if(!alive)return;const all=Array.isArray(r.data?.rows)?r.data.rows:[];setRows(all);let stored='';try{stored=sessionStorage.getItem(SELECTED)||''}catch{}if(stored&&!all.some((x:Entity)=>String(x.id)===stored))stored='';if(!stored&&all.length===1)stored=String(all[0].id);setValue(stored);try{sessionStorage.setItem(SELECTED,stored);sessionStorage.setItem(REQUIRED,all.length>1?'1':'0')}catch{}}
 }catch(e){if(alive)setError(err(e))}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[workOrderId]);
 async function change(next:string){setValue(next);setError('');try{sessionStorage.setItem(SELECTED,next)}catch{}if(!workOrderId||!next)return;setSaving(true);try{await api.put(`/vir/receipt-compliance/legal-entities/workorders/${encodeURIComponent(workOrderId)}`,{legal_entity_id:next});}catch(e){setError(err(e))}finally{setSaving(false)}}
 return <section style={{margin:'0 0 14px',padding:'14px 16px',border:'1px solid #ddd6fe',borderRadius:14,background:'linear-gradient(135deg,#faf5ff,#fff)'}} aria-label="Munkalap kibocsátó cég">
  <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
   <div style={{display:'flex',gap:10,alignItems:'center'}}><span style={{width:38,height:38,borderRadius:12,display:'grid',placeItems:'center',background:'#ede9fe',color:'#5b21b6'}}><Building2 size={20}/></span><div><b style={{display:'block'}}>Kibocsátó cég / könyvelési egység</b><small style={{color:'#64748b'}}>A munkalap, fizetés, számla és nyugta ugyanahhoz a céghez kerül.</small></div></div>
   {locked?<span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:800,color:'#92400e'}}><LockKeyhole size={15}/> Pénzügyileg zárolt</span>:<span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:800,color:'#166534'}}><ShieldCheck size={15}/> Cégdimenzió aktív</span>}
  </div>
  <div style={{marginTop:12,display:'grid',gridTemplateColumns:'minmax(260px,1fr) auto',gap:10,alignItems:'center'}}>
   <select value={value} disabled={loading||saving||locked} onChange={e=>void change(e.target.value)} style={{width:'100%',minHeight:42,border:'1px solid #cbd5e1',borderRadius:10,padding:'8px 10px',background:'white'}}>
    <option value="">{rows.length>1?'Válassz kibocsátó céget…':'Automatikus szaloni alapcég'}</option>
    {rows.map(e=><option key={e.id} value={e.id}>{e.short_name||e.legal_name} · {e.tax_number||'nincs adószám'} · {e.accounting_ledger_code||'könyvelés'}</option>)}
   </select>
   {loading||saving?<RefreshCw size={18} style={{animation:'spin 1s linear infinite'}}/>:null}
  </div>
  {selected&&<div style={{marginTop:8,fontSize:12,color:'#475569'}}><b>{selected.legal_name}</b>{selected.locations?.length?` · ${selected.locations.map(l=>l.name).join(', ')}`:''}</div>}
  {rows.length>1&&!value&&!locked&&<div style={{marginTop:8,fontSize:12,fontWeight:700,color:'#b45309'}}>Ebben a környezetben több cég aktív. A munkalap lezárása előtt a cég kiválasztása kötelező.</div>}
  {error&&<div style={{marginTop:8,fontSize:12,fontWeight:700,color:'#b91c1c'}}>{error}</div>}
 </section>;
}
