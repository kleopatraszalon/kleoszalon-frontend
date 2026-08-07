import React,{useEffect,useMemo,useState}from"react";
import{MessageSquareText,RefreshCw,Search,ShieldCheck,Users}from"lucide-react";
import api from"../api/api";
import{useCapabilities}from"../hooks/useCapabilities";
import"./StaffChatAdminPage.css";

type Conversation={id:string;is_group:boolean;title?:string|null;created_by?:string;created_at:string;updated_at:string;member_count:number;message_count:number;last_message_at?:string|null;members?:string|null};
type Message={id:string|number;sender_key:string;sender_name?:string|null;content:string;created_at:string;read_at?:string|null};

export default function StaffChatAdminPage(){
 const{feature,loading:capLoading}=useCapabilities();
 const[q,setQ]=useState("");const[rows,setRows]=useState<Conversation[]>([]);const[selected,setSelected]=useState<Conversation|null>(null);const[messages,setMessages]=useState<Message[]>([]);const[loading,setLoading]=useState(false);const[error,setError]=useState("");
 const allowed=!capLoading&&feature("staff_chat_all");
 const load=async()=>{if(!allowed)return;setLoading(true);setError("");try{const{data}=await api.get("/transactions/staff-chat/supervision/conversations",{params:{q:q||undefined}});setRows(data||[])}catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||e?.message||"A beszélgetések nem tölthetők be.")}finally{setLoading(false)}};
 const open=async(row:Conversation)=>{setSelected(row);setMessages([]);setError("");try{const{data}=await api.get(`/transactions/staff-chat/supervision/conversations/${row.id}/messages`);setMessages(data||[])}catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||"Az üzenetek nem tölthetők be.")}};
 useEffect(()=>{if(allowed)load()},[allowed]); // eslint-disable-line react-hooks/exhaustive-deps
 const stats=useMemo(()=>({conversations:rows.length,messages:rows.reduce((s,r)=>s+Number(r.message_count||0),0),groups:rows.filter(r=>r.is_group).length}),[rows]);
 if(capLoading)return <main className="chat-admin-page"><div className="chat-admin-state">Jogosultság ellenőrzése…</div></main>;
 if(!allowed)return <main className="chat-admin-page"><div className="chat-admin-denied"><ShieldCheck/><h2>Nincs teljes chat-felügyeleti jogosultság</h2><p>Ehhez az oldalhoz a <b>Teljes chat felügyelet</b> funkció engedélyezése szükséges.</p></div></main>;
 return <main className="chat-admin-page">
  <header className="chat-admin-hero"><div><span>ADMINISZTRÁCIÓ / KOMMUNIKÁCIÓ</span><h1>Munkatársi chat felügyelet</h1><p>A belső beszélgetések felügyeleti nézete. Csak külön staff_chat_all jogosultsággal érhető el.</p></div><button onClick={load} disabled={loading}><RefreshCw size={16}/> Frissítés</button></header>
  <section className="chat-admin-stats"><article><MessageSquareText/><div><small>Beszélgetések</small><strong>{stats.conversations}</strong></div></article><article><Users/><div><small>Csoportok</small><strong>{stats.groups}</strong></div></article><article><MessageSquareText/><div><small>Üzenetek</small><strong>{stats.messages}</strong></div></article></section>
  {error&&<div className="chat-admin-error">{error}</div>}
  <section className="chat-admin-layout"><div className="chat-admin-list"><div className="chat-admin-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load()}} placeholder="Beszélgetés vagy munkatárs keresése…"/><button onClick={load}>Keresés</button></div>{rows.map(r=><button key={r.id} className={selected?.id===r.id?"active":""} onClick={()=>open(r)}><div><strong>{r.is_group?(r.title||"Csoportos beszélgetés"):(r.members||"Beszélgetés")}</strong><small>{r.members||"—"}</small></div><span>{r.message_count} üzenet</span><em>{r.last_message_at?new Date(r.last_message_at).toLocaleString("hu-HU"):"—"}</em></button>)}{!rows.length&&!loading&&<div className="chat-admin-empty">Nincs megjeleníthető beszélgetés.</div>}</div>
   <div className="chat-admin-detail">{selected?<><header><div><h2>{selected.is_group?(selected.title||"Csoportos beszélgetés"):(selected.members||"Beszélgetés")}</h2><p>{selected.members}</p></div><span>{messages.length} üzenet</span></header><div className="chat-admin-messages">{messages.map(m=><article key={m.id}><div><strong>{m.sender_name||m.sender_key}</strong><time>{new Date(m.created_at).toLocaleString("hu-HU")}</time></div><p>{m.content}</p></article>)}{!messages.length&&<div className="chat-admin-empty">Ebben a beszélgetésben nincs üzenet.</div>}</div></>:<div className="chat-admin-placeholder"><MessageSquareText/><h3>Válasszon beszélgetést</h3><p>A bal oldali listából nyitható meg a teljes üzenettörténet.</p></div>}</div>
  </section>
 </main>;
}
