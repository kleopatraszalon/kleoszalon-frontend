import React,{useEffect,useRef,useState}from"react";
import{CalendarCheck2,RefreshCw,X}from"lucide-react";
import{useNavigate,useParams,useSearchParams}from"react-router-dom";
import{apiFetch}from"../utils/api";
import WorkOrderNew from"./WorkOrderNew";
import WorkOrderDetail from"./WorkOrderDetail";
import WorkOrderWorkflowNavigator from"./workorders/WorkOrderWorkflowNavigator";
import"./WorkOrderNewModalPage.css";

type Props={onClose?:()=>void};
type ArrivalResult={work_order_id?:string|null;work_order_number?:string|null;appointment_status?:string|null;created?:boolean};

export default function WorkOrderNewModalPage({onClose}:Props){
 const navigate=useNavigate();
 const{id}=useParams();
 const[searchParams]=useSearchParams();
 const appointmentId=searchParams.get("appointment_id")||"";
 const existing=Boolean(id);
 const fromCalendar=Boolean(!existing&&appointmentId);
 const scrollRef=useRef<HTMLDivElement|null>(null);
 const[retryKey,setRetryKey]=useState(0);
 const[resumeLoading,setResumeLoading]=useState(fromCalendar);
 const[resumeError,setResumeError]=useState("");

 const close=()=>onClose?onClose():navigate(fromCalendar?"/appointments/calendar":"/workorders");

 useEffect(()=>{
  if(!fromCalendar)return;
  let alive=true;
  setResumeLoading(true);
  setResumeError("");
  void(async()=>{
   try{
    const result=await apiFetch<ArrivalResult>(`/api/transactions/booking-workorder/appointments/${encodeURIComponent(appointmentId)}/arrive`,{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:"{}",
    });
    if(!alive)return;
    const workOrderId=String(result?.work_order_id||"").trim();
    if(!workOrderId)throw new Error("A munkalap létrejöttét a szerver nem erősítette meg.");
    navigate(`/workorders/${encodeURIComponent(workOrderId)}`,{replace:true});
   }catch(error:any){
    if(!alive)return;
    setResumeError(error?.response?.data?.message||error?.response?.data?.error||error?.message||"A munkalap nem nyitható meg az időpontból.");
    setResumeLoading(false);
   }
  })();
  return()=>{alive=false};
 },[appointmentId,fromCalendar,navigate,retryKey]);

 const title=existing?"Munkalap kezelése":fromCalendar?"Munkalap megnyitása":"Munkalap rögzítése";
 const subtitle=fromCalendar
  ?"A rendszer lefoglalja és elmenti a munkalapszámot, érkezteti a vendéget, majd a mentett munkalapot nyitja meg."
  :"Vezetett folyamat a vendég azonosításától a fizetésen át a lezárásig.";

 return <div className="wo-modal-backdrop" role="presentation">
  <section className="wo-modal-window" role="dialog" aria-modal="true" aria-labelledby="wo-modal-title">
   <header className="wo-modal-header">
    <div className="wo-modal-heading">
     <span className="wo-modal-kicker"><CalendarCheck2 size={16}/> DIGITÁLIS MUNKALAP</span>
     <h1 id="wo-modal-title">{title}</h1>
     <p>{subtitle}</p>
    </div>
    <button className="wo-modal-close" type="button" onClick={close} aria-label="Munkalap ablak bezárása" title="Bezárás"><X size={22}/></button>
   </header>

   {!fromCalendar&&<WorkOrderWorkflowNavigator scrollRoot={scrollRef}/>} 

   <div className={`wo-modal-scroll${existing?" wo-modal-scroll--detail":""}`} ref={scrollRef}>
    {fromCalendar?
     <div className="wo-resume-state">
      {resumeLoading?<>
       <RefreshCw className="wo-resume-spinner" size={30}/>
       <strong>Munkalap mentése és vendég érkeztetése…</strong>
       <p>Ha ehhez az időponthoz már tartozik munkalap, ugyanaz a munkalapszám nyílik meg. Új számot nem osztunk ki.</p>
      </>:<>
       <strong>A munkalap megnyitása nem sikerült.</strong>
       <p>{resumeError}</p>
       <div className="wo-resume-actions">
        <button type="button" onClick={()=>setRetryKey(value=>value+1)}><RefreshCw size={16}/> Újrapróbálás</button>
        <button type="button" onClick={()=>navigate("/appointments/calendar")}>Vissza a naptárhoz</button>
       </div>
      </>}
     </div>
     :existing?<WorkOrderDetail/>:<WorkOrderNew/>}
   </div>
  </section>
 </div>
}
