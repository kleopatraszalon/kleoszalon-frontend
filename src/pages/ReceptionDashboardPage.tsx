import React from"react";
import{CalendarDays,ClipboardPlus}from"lucide-react";
import{useNavigate}from"react-router-dom";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";

export default function ReceptionDashboardPage(){
 const navigate=useNavigate();
 return <main style={{padding:"24px 0",maxWidth:1600,margin:0}}>
  <DashboardDailyOperations/>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,margin:"0 24px"}}>
   <button onClick={()=>navigate("/workorders/new")} style={{padding:18,textAlign:"left",border:"1px solid #e5e0e8",borderRadius:14,background:"white",cursor:"pointer"}}><ClipboardPlus/><strong style={{display:"block",marginTop:8}}>Új walk-in munkalap</strong><small>Foglalás nélkül érkező vendég munkalapjának indítása</small></button>
   <button onClick={()=>navigate("/appointments/calendar")} style={{padding:18,textAlign:"left",border:"1px solid #e5e0e8",borderRadius:14,background:"white",cursor:"pointer"}}><CalendarDays/><strong style={{display:"block",marginTop:8}}>Teljes időpontnaptár</strong><small>Új foglalás, beosztás és részletes napi nézet</small></button>
  </section>
 </main>
}
