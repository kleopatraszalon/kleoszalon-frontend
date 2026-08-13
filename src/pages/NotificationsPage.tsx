import React,{useCallback,useEffect,useMemo,useState}from"react";
import{AlertTriangle,Bell,CheckCheck,FileWarning,MessageCircle,PackageX,RefreshCw,ShieldAlert,Sparkles,Truck,WalletCards,X}from"lucide-react";
import{useNavigate}from"react-router-dom";
import api from"../api/api";
import OperationalAlertAdminConsole from"../components/OperationalAlertAdminConsole";
import"./NotificationsPage.css";

type NotificationItem={
 key:string;
 type:"chat"|"stock"|"no_show"|"task"|"ai"|"finance"|"workorder"|"loyalty"|"supplier_expiry"|"employee_document"|"complaint_sla";
 severity:"info"|"warning"|"critical";
 title:string;
 detail:string;
 route?:string;
 created_at:string;
 read:boolean;
};

const iconFor=(type:NotificationItem["type"])=>{
 if(type==="chat")return <MessageCircle/>;
 if(type==="stock")return <PackageX/>;
 if(type==="ai")return <Sparkles/>;
 if(type==="finance"||type==="workorder")return <WalletCards/>;
 if(type==="supplier_expiry")return <Truck/>;
 if(type==="employee_document")return <FileWarning/>;
 if(type==="complaint_sla")return <ShieldAlert/>;
 return <AlertTriangle/>;
};
const typeLabel=(type:NotificationItem["type"])=>({supplier_expiry:"beszállítói lejárat",employee_document:"dolgozói dokumentum",complaint_sla:"panasz SLA",no_show:"no-show",workorder:"munkalap",finance:"pénzügy",loyalty:"hűségprogram",stock:"készlet",chat:"chat",task:"feladat",ai:"AI"}[type]||type.replace("_"," "));

export default function NotificationsPage(){
 const navigate=useNavigate();
 const[items,setItems]=useState<NotificationItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[filter,setFilter]=useState<"all"|"unread"|"critical">("all");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const r=await api.get("/transactions/notifications");setItems(r.data?.items||[])}catch(e:any){setError(e?.response?.data?.message||e?.message||"Az értesítések betöltése sikertelen.")}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const visible=useMemo(()=>items.filter(item=>filter==="all"?true:filter==="unread"?!item.read:item.severity==="critical"),[items,filter]);
 const unread=items.filter(x=>!x.read).length,critical=items.filter(x=>x.severity==="critical").length;
 async function markRead(item:NotificationItem){if(!item.read){await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/read`);setItems(current=>current.map(x=>x.key===item.key?{...x,read:true}:x))}if(item.route)navigate(item.route)}
 async function dismiss(item:NotificationItem){await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/dismiss`);setItems(current=>current.filter(x=>x.key!==item.key))}
 async function markAll(){for(const item of items.filter(x=>!x.read))await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/read`);setItems(current=>current.map(x=>({...x,read:true})))}
 return <main className="notify-page">
  <section className="notify-hero"><div><span>VEZETŐI ÉS OPERATÍV FIGYELMEZTETÉSEK</span><h1>Értesítési központ</h1><p>Készlet, no-show, pénzügy, dolgozói és beszállítói lejáratok, panasz SLA és automatikus kiküldések egy helyen.</p></div><div className="notify-actions"><button onClick={()=>void load()}><RefreshCw className={loading?"spin":""}/>Frissítés</button><button onClick={()=>void markAll()} disabled={!unread}><CheckCheck/>Mind olvasott</button></div></section>
  <section className="notify-stats"><article><Bell/><div><small>Összes aktív</small><strong>{items.length}</strong></div></article><article><MessageCircle/><div><small>Olvasatlan</small><strong>{unread}</strong></div></article><article><AlertTriangle/><div><small>Kritikus</small><strong>{critical}</strong></div></article></section>
  <OperationalAlertAdminConsole/>
  <div className="notify-tabs"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Összes</button><button className={filter==="unread"?"active":""} onClick={()=>setFilter("unread")}>Olvasatlan</button><button className={filter==="critical"?"active":""} onClick={()=>setFilter("critical")}>Kritikus</button></div>
  {error&&<div className="notify-error"><AlertTriangle/>{error}</div>}{loading&&!items.length?<div className="notify-loading"><RefreshCw className="spin"/>Értesítések összeállítása…</div>:null}
  <section className="notify-list">{visible.map(item=><article key={item.key} className={`notify-card sev-${item.severity} ${item.read?"is-read":""}`}><button className="notify-main" onClick={()=>void markRead(item)}><span className="notify-icon">{iconFor(item.type)}</span><span className="notify-copy"><small>{typeLabel(item.type)}</small><b>{item.title}</b><p>{item.detail}</p><em>{new Intl.DateTimeFormat("hu-HU",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.created_at))}</em></span>{!item.read&&<i className="notify-dot"/>}</button><button className="notify-dismiss" onClick={()=>void dismiss(item)} title="Elrejtés"><X/></button></article>)}{!loading&&visible.length===0&&<div className="notify-empty"><CheckCheck/><h3>Nincs megjelenítendő értesítés</h3><p>A kiválasztott szűrőben jelenleg nincs teendő.</p></div>}</section>
 </main>;
}
