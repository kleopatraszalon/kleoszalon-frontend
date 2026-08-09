import React,{useMemo,useState}from'react';
import api from'../../api/api';

type Mode='cancelled'|'no_show';
type Props={appointment:{id:string;client_name?:string|null;title?:string|null}|null;mode:Mode|null;onClose:()=>void;onDone:()=>void};
const CANCEL_REASONS=['Közbejött valami','Betegség','Egyéb'];

export default function AppointmentTerminationModal({appointment,mode,onClose,onDone}:Props){
 const[reason,setReason]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const title=mode==='no_show'?'Meg nem jelenés rögzítése':'Foglalás lemondása';
 const canSubmit=useMemo(()=>Boolean(reason.trim())&&(mode!=='cancelled'||reason!=='Egyéb'||Boolean(note.trim())),[mode,note,reason]);
 if(!appointment||!mode)return null;
 const submit=async()=>{if(!canSubmit)return;setBusy(true);setError('');try{const path=mode==='no_show'?'no-show':'cancel';await api.post(`/transactions/appointment-lifecycle/appointments/${appointment.id}/${path}`,{reason,note});onDone();onClose()}catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||e?.message||'A művelet nem sikerült.')}finally{setBusy(false)}};
 return <div style={{position:'fixed',inset:0,zIndex:5000,background:'rgba(20,14,24,.42)',display:'grid',placeItems:'center',padding:18}} onMouseDown={onClose}>
  <section onMouseDown={e=>e.stopPropagation()} style={{width:'min(520px,100%)',background:'#fff',borderRadius:18,boxShadow:'0 24px 80px rgba(0,0,0,.28)',padding:22}}>
   <header style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start'}}><div><small style={{fontWeight:800,letterSpacing:'.08em',color:'#806a86'}}>IDŐPONT ÉLETCIKLUS</small><h3 style={{margin:'6px 0 4px'}}>{title}</h3><p style={{margin:0,color:'#6f6573'}}>{appointment.client_name||appointment.title||'Vendég'}</p></div><button onClick={onClose} style={{border:0,background:'transparent',fontSize:22,cursor:'pointer'}}>×</button></header>
   <div style={{display:'grid',gap:12,marginTop:18}}>
    {mode==='cancelled'?<label style={{display:'grid',gap:6,fontWeight:700}}>Lemondás oka<select value={reason} onChange={e=>setReason(e.target.value)} style={{padding:'11px 12px',border:'1px solid #d8d1dc',borderRadius:10}}><option value="">Válasszon…</option>{CANCEL_REASONS.map(x=><option key={x}>{x}</option>)}</select></label>:<label style={{display:'grid',gap:6,fontWeight:700}}>Meg nem jelenés oka<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Pl. nem érte el a szalont" style={{padding:'11px 12px',border:'1px solid #d8d1dc',borderRadius:10}}/></label>}
    <label style={{display:'grid',gap:6,fontWeight:700}}>Megjegyzés {mode==='cancelled'&&reason==='Egyéb'?<b style={{color:'#a33'}}>* kötelező</b>:null}<textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} style={{padding:'11px 12px',border:'1px solid #d8d1dc',borderRadius:10,resize:'vertical'}}/></label>
    <div style={{padding:11,borderRadius:10,background:'#f8f5f9',fontSize:13,color:'#6b5e70'}}>Ha az időponthoz nyitott munkalap tartozik, az is visszavonásra kerül. Már kifizetett vagy lezárt munkalap esetén a rendszer pénzügyi sztornót kér, és nem engedi az egyszerű visszavonást.</div>
    {error?<div style={{padding:10,borderRadius:10,background:'#fff0f0',color:'#9c2626'}}>{error}</div>:null}
   </div>
   <footer style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:18}}><button onClick={onClose} disabled={busy} style={{padding:'10px 14px',border:'1px solid #d8d1dc',borderRadius:10,background:'#fff'}}>Mégsem</button><button onClick={()=>void submit()} disabled={!canSubmit||busy} style={{padding:'10px 14px',border:0,borderRadius:10,background:'#6e4f76',color:'#fff',fontWeight:800,opacity:!canSubmit||busy?.6:1}}>{busy?'Mentés…':mode==='no_show'?'Nem jelent meg':'Foglalás lemondása'}</button></footer>
  </section>
 </div>;
}
