import React,{useCallback,useEffect,useMemo,useState}from"react";
import{CalendarDays,CheckCircle2,Clock3,Phone,RefreshCw,RotateCcw,Search,UserRoundCheck,UsersRound,XCircle}from"lucide-react";
import{useNavigate}from"react-router-dom";
import api from"../api/api";
import"./BookingWaitlistPage.css";

type WaitStatus="waiting"|"contacted"|"booked"|"cancelled";
type WaitItem={
  id:string;
  client_name:string;
  phone?:string|null;
  email?:string|null;
  status:WaitStatus;
  note?:string|null;
  created_at:string;
  updated_at?:string|null;
  preferred_from?:string|null;
  preferred_to?:string|null;
  preferred_employee_id?:string|null;
  employee_name?:string|null;
  location_id?:string|null;
  location_name?:string|null;
};

const statusLabel:Record<WaitStatus,string>={waiting:"Várakozik",contacted:"Kapcsolatfelvétel",booked:"Lefoglalva",cancelled:"Lezárva"};
const statusOrder:WaitStatus[]=["waiting","contacted","booked","cancelled"];
const fmt=(value?:string|null)=>value?new Date(value).toLocaleString("hu-HU",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"—";
const errorText=(error:any)=>error?.response?.data?.error||error?.response?.data?.message||error?.message||"A művelet nem sikerült.";

export default function BookingWaitlistPage(){
  const navigate=useNavigate();
  const[items,setItems]=useState<WaitItem[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[query,setQuery]=useState("");
  const[status,setStatus]=useState<"all"|WaitStatus>("waiting");
  const[busy,setBusy]=useState<Record<string,boolean>>({});
  const locationId=useMemo(()=>localStorage.getItem("kleo_location_id")||"",[]);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const response=await api.get("/transactions/booking-operations/waitlist",{params:{status:"all",location_id:locationId||undefined}});
      setItems(Array.isArray(response.data)?response.data:[]);
    }catch(reason:any){setError(errorText(reason))}
    finally{setLoading(false)}
  },[locationId]);

  useEffect(()=>{void load()},[load]);

  const changeStatus=async(item:WaitItem,next:WaitStatus)=>{
    if(busy[item.id])return;
    setBusy(current=>({...current,[item.id]:true}));setError("");
    try{
      const response=await api.patch(`/transactions/booking-operations/waitlist/${encodeURIComponent(item.id)}`,{status:next});
      setItems(current=>current.map(row=>row.id===item.id?{...row,...response.data,status:next}:row));
    }catch(reason:any){setError(errorText(reason))}
    finally{setBusy(current=>{const nextBusy={...current};delete nextBusy[item.id];return nextBusy})}
  };

  const metrics=useMemo(()=>Object.fromEntries(statusOrder.map(key=>[key,items.filter(item=>item.status===key).length])) as Record<WaitStatus,number>,[items]);
  const filtered=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("hu-HU");
    return items.filter(item=>{
      if(status!=="all"&&item.status!==status)return false;
      if(!needle)return true;
      return [item.client_name,item.phone,item.email,item.employee_name,item.location_name,item.note]
        .some(value=>String(value||"").toLocaleLowerCase("hu-HU").includes(needle));
    }).sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
  },[items,query,status]);

  return <main className="waitlist-page">
    <header className="waitlist-hero">
      <div>
        <span className="waitlist-eyebrow">IDŐPONTOK ÉS BEOSZTÁS</span>
        <h1>Intelligens várólista</h1>
        <p>A szabad helyre váró vendégek operatív kezelése: kapcsolatfelvétel, foglalás és lezárás egy helyen.</p>
      </div>
      <div className="waitlist-hero-actions">
        <button className="waitlist-secondary" onClick={()=>navigate("/appointments/calendar")}><CalendarDays size={17}/>Naptár megnyitása</button>
        <button className="waitlist-primary" onClick={()=>void load()} disabled={loading}><RefreshCw size={17} className={loading?"spin":""}/>Frissítés</button>
      </div>
    </header>

    {error&&<div className="waitlist-alert">{error}</div>}

    <section className="waitlist-metrics">
      <button className={status==="waiting"?"active":""} onClick={()=>setStatus("waiting")}><Clock3/><strong>{metrics.waiting}</strong><span>várakozik</span></button>
      <button className={status==="contacted"?"active":""} onClick={()=>setStatus("contacted")}><Phone/><strong>{metrics.contacted}</strong><span>kapcsolatfelvétel</span></button>
      <button className={status==="booked"?"active":""} onClick={()=>setStatus("booked")}><CheckCircle2/><strong>{metrics.booked}</strong><span>lefoglalva</span></button>
      <button className={status==="cancelled"?"active":""} onClick={()=>setStatus("cancelled")}><XCircle/><strong>{metrics.cancelled}</strong><span>lezárva</span></button>
      <button className={status==="all"?"active":""} onClick={()=>setStatus("all")}><UsersRound/><strong>{items.length}</strong><span>összes</span></button>
    </section>

    <section className="waitlist-panel">
      <header className="waitlist-toolbar">
        <div><h2>Várólista tételek</h2><small>{filtered.length} megjelenített bejegyzés{locationId?" · kiválasztott telephely":""}</small></div>
        <label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Vendég, telefon, e-mail, munkatárs…"/></label>
      </header>

      {loading?<div className="waitlist-empty">Várólista betöltése…</div>:filtered.length?<div className="waitlist-table-wrap"><table className="waitlist-table">
        <thead><tr><th>Vendég</th><th>Preferencia</th><th>Telephely / munkatárs</th><th>Várakozás kezdete</th><th>Állapot</th><th>Műveletek</th></tr></thead>
        <tbody>{filtered.map(item=><tr key={item.id}>
          <td><strong>{item.client_name||"Névtelen vendég"}</strong><small>{item.phone||item.email||"Nincs elérhetőség"}</small>{item.note&&<em>{item.note}</em>}</td>
          <td><span>{item.preferred_from?fmt(item.preferred_from):"Rugalmas időpont"}</span>{item.preferred_to&&<small>eddig: {fmt(item.preferred_to)}</small>}</td>
          <td><span>{item.location_name||"Bármely telephely"}</span><small>{item.employee_name||"Bármely munkatárs"}</small></td>
          <td><span>{fmt(item.created_at)}</span></td>
          <td><span className={`waitlist-status is-${item.status}`}>{statusLabel[item.status]||item.status}</span></td>
          <td><div className="waitlist-actions">
            {item.status!=="contacted"&&item.status!=="booked"&&<button disabled={busy[item.id]} onClick={()=>void changeStatus(item,"contacted")}><Phone size={14}/>Megkeresve</button>}
            {item.status!=="booked"&&<button className="is-positive" disabled={busy[item.id]} onClick={()=>void changeStatus(item,"booked")}><UserRoundCheck size={14}/>Foglalva</button>}
            {item.status!=="waiting"&&<button disabled={busy[item.id]} onClick={()=>void changeStatus(item,"waiting")}><RotateCcw size={14}/>Vissza váróra</button>}
            {item.status!=="cancelled"&&<button className="is-danger" disabled={busy[item.id]} onClick={()=>void changeStatus(item,"cancelled")}><XCircle size={14}/>Lezárás</button>}
          </div></td>
        </tr>)}</tbody>
      </table></div>:<div className="waitlist-empty"><UsersRound size={32}/><strong>Nincs megjeleníthető várólista-bejegyzés.</strong><span>Válts másik állapotra vagy töröld a keresést.</span></div>}
    </section>
  </main>;
}
