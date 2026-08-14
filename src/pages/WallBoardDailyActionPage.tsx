import React,{useEffect,useMemo,useState}from"react";
import axios from"axios";
import{CheckCircle2,ExternalLink,ImagePlus,MonitorPlay,Plus,RefreshCw,Save,Send,Smartphone,Undo2}from"lucide-react";
import"./WallBoardDailyActionPage.css";

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const API=`${API_BASE}/transactions/daily-actions`;
const WALLBOARD=`${API_BASE}/signage/wallboard`;
const auth=()=>{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token');return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};
const localDate=(d:Date)=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)};
const emptyForm=()=>{const now=new Date(),end=new Date(now.getTime()+24*60*60*1000);return{id:'',name:`WallBoard napi akció – ${now.toLocaleDateString('hu-HU')}`,headline:'',description_html:'',discount_text:'',image_url:'',cta_label:'Foglalok',cta_url:'/foglalas',valid_from:localDate(now),valid_until:localDate(end),channels:['app'],audience:{type:'all'},status:'draft'} as any};
const strip=(html:string)=>String(html||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim();

export default function WallBoardDailyActionPage(){
 const[form,setForm]=useState<any>(emptyForm()),[campaigns,setCampaigns]=useState<any[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[frameKey,setFrameKey]=useState(0);
 const active=useMemo(()=>campaigns.find(c=>c.status==='published'&&new Date(c.valid_from)<=new Date()&&new Date(c.valid_until)>=new Date())||null,[campaigns]);
 async function load(selectId?:string){setLoading(true);setError('');try{const r=await axios.get(API,auth());const rows=Array.isArray(r.data?.campaigns)?r.data.campaigns:[];setCampaigns(rows);if(selectId){const found=rows.find((x:any)=>String(x.id)===String(selectId));if(found)setFromCampaign(found)}}catch(e:any){setError(e?.response?.data?.message||e?.message||'A napi akciók betöltése nem sikerült.')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 function setFromCampaign(c:any){setForm({...c,valid_from:localDate(new Date(c.valid_from)),valid_until:localDate(new Date(c.valid_until)),channels:Array.isArray(c.channels)&&c.channels.length?c.channels:['app'],audience:c.audience||{type:'all'}});setMessage('');setError('')}
 function fresh(){setForm(emptyForm());setMessage('');setError('')}
 function payload(){return{name:form.name,headline:form.headline,description_html:form.description_html,image_url:form.image_url||null,cta_label:form.cta_label||'Foglalok',cta_url:form.cta_url||'/foglalas',discount_text:form.discount_text||null,valid_from:new Date(form.valid_from).toISOString(),valid_until:new Date(form.valid_until).toISOString(),channels:['app'],audience:{type:'all'}}}
 async function save(publish=false){if(!form.headline.trim()||!strip(form.description_html)){setError('A főcím és az akció leírása kötelező.');return}setLoading(true);setError('');setMessage('');try{let id=form.id;let saved;if(id){saved=(await axios.patch(`${API}/${id}`,payload(),auth())).data}else{saved=(await axios.post(API,payload(),auth())).data;id=saved.id}if(publish){await axios.post(`${API}/${id}/publish`,{},auth());setMessage('Az akció publikálva. A vendégapp/push és a WallBoard ugyanebből a kampányból frissül.')}else setMessage('Piszkozat mentve. Értesítés még nem került kiküldésre.');await load(id);setFrameKey(k=>k+1)}catch(e:any){setError(e?.response?.data?.message||e?.message||'A mentés nem sikerült.')}finally{setLoading(false)}}
 function imageFile(file?:File){if(!file)return;if(file.size>5*1024*1024){setError('A WallBoard kép legfeljebb 5 MB legyen.');return}const reader=new FileReader();reader.onload=()=>setForm((p:any)=>({...p,image_url:String(reader.result||'')}));reader.readAsDataURL(file)}
 const desc=strip(form.description_html)||'Írja be az akció rövid leírását…';
 return <main className="wbd-page">
  <header className="wbd-hero"><div><div className="wbd-kicker">MARKETING • TV / WALLBOARD</div><h1>WallBoard / TV napi akció</h1><p>Külön szerkesztő a szalon TV-k napi ajánlatához. A publikált kampány ugyanabból az adatból jelenik meg a vendégappban és a WallBoardon.</p></div><div className="wbd-head-actions"><button onClick={fresh}><Plus size={16}/>Új akció</button><button onClick={()=>load(form.id)} disabled={loading}><RefreshCw size={16}/>Frissítés</button><a href={WALLBOARD} target="_blank" rel="noreferrer"><ExternalLink size={16}/>TV teljes képernyő</a></div></header>
  {error&&<div className="wbd-error">{error}</div>}{message&&<div className="wbd-ok"><CheckCircle2 size={17}/>{message}</div>}
  <section className="wbd-status"><article><MonitorPlay/><div><small>Aktív TV-akció</small><b>{active?.headline||'Nincs aktív publikált akció'}</b></div></article><article><Smartphone/><div><small>Vendégapp csatorna</small><b>Összekapcsolva</b></div></article><article><Send/><div><small>Publikálás</small><b>{form.status==='published'?'Publikált':'Piszkozat'}</b></div></article></section>
  <div className="wbd-workspace">
   <section className="wbd-editor"><div className="wbd-title"><div><h2>Akció szerkesztése</h2><p>Mentés közben nincs kiküldés; csak a Publikálás indítja az app/push folyamatot.</p></div><span>{form.id?'Meglévő kampány':'Új kampány'}</span></div>
    <label>Kampány belső neve<input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></label>
    <label className="wide">TV főcím<input maxLength={180} value={form.headline||''} onChange={e=>setForm({...form,headline:e.target.value})} placeholder="Pl. Ma 20% kedvezmény a Hydrafacial kezelésre"/></label>
    <label className="wide">Leírás<textarea rows={5} value={form.description_html||''} onChange={e=>setForm({...form,description_html:e.target.value})} placeholder="Rövid, jól olvasható szöveg a TV képernyőre."/></label>
    <label>Kedvezmény / kiemelt szöveg<input value={form.discount_text||''} onChange={e=>setForm({...form,discount_text:e.target.value})} placeholder="-20% • CSAK MA"/></label>
    <label>CTA felirat<input value={form.cta_label||''} onChange={e=>setForm({...form,cta_label:e.target.value})}/></label>
    <label>CTA cél URL<input value={form.cta_url||''} onChange={e=>setForm({...form,cta_url:e.target.value})}/></label>
    <label>Kezdete<input type="datetime-local" value={form.valid_from||''} onChange={e=>setForm({...form,valid_from:e.target.value})}/></label>
    <label>Vége<input type="datetime-local" value={form.valid_until||''} onChange={e=>setForm({...form,valid_until:e.target.value})}/></label>
    <div className="wbd-image wide"><label>Kép URL<input value={form.image_url||''} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://… vagy töltsön fel képet"/></label><label className="wbd-upload"><ImagePlus size={16}/>Kép feltöltése<input type="file" accept="image/*" hidden onChange={e=>imageFile(e.target.files?.[0])}/></label>{form.image_url&&<button type="button" onClick={()=>setForm({...form,image_url:''})}><Undo2 size={15}/>Kép törlése</button>}</div>
    <div className="wbd-save wide"><button type="button" onClick={()=>save(false)} disabled={loading}><Save size={16}/>{loading?'Mentés…':'Piszkozat mentése'}</button><button className="publish" type="button" onClick={()=>save(true)} disabled={loading}><Send size={16}/>Mentés és publikálás</button></div>
   </section>
   <section className="wbd-preview"><div className="wbd-title"><div><h2>Azonnali TV előnézet</h2><p>A szerkesztés közben azonnal változik.</p></div><span>16:9</span></div><div className={`wbd-screen ${form.image_url?'with-image':''}`}>{form.image_url&&<div className="wbd-screen-image" style={{backgroundImage:`url(${JSON.stringify(form.image_url).slice(1,-1)})`}}/>}<div className="wbd-screen-copy"><small>KLEOPÁTRA • NAPI AKCIÓ</small><h3>{form.headline||'A napi akció főcíme'}</h3><p>{desc}</p>{form.discount_text&&<strong>{form.discount_text}</strong>}</div></div><div className="wbd-links"><a href={`${WALLBOARD}/daily-action.json`} target="_blank" rel="noreferrer">JSON feed</a><a href={`${WALLBOARD}/daily-action.xml`} target="_blank" rel="noreferrer">XML feed</a></div>
   </section>
  </div>
  <section className="wbd-live"><div className="wbd-title"><div><h2>Éles WallBoard előnézet</h2><p>A jelenleg publikált, időben aktív akció látható. Publikálás után frissítse az előnézetet.</p></div><button onClick={()=>setFrameKey(k=>k+1)}><RefreshCw size={15}/>Előnézet frissítése</button></div><div className="wbd-live-frame"><iframe key={frameKey} src={`${WALLBOARD}?preview=${frameKey}`} title="Éles Kleopátra WallBoard"/></div></section>
  <section className="wbd-history"><div className="wbd-title"><div><h2>Korábbi és ütemezett akciók</h2><p>Kattintson egy kampányra a szerkesztéshez.</p></div></div><div className="wbd-list">{campaigns.map(c=><button key={c.id} onClick={()=>setFromCampaign(c)} className={String(form.id)===String(c.id)?'active':''}><div><b>{c.headline}</b><span>{c.name}</span><small>{new Date(c.valid_from).toLocaleString('hu-HU')} – {new Date(c.valid_until).toLocaleString('hu-HU')}</small></div><em className={c.status}>{c.status}</em></button>)}</div></section>
 </main>
}
