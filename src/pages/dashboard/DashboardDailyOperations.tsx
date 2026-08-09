import React,{useEffect,useState}from"react";
import{useCurrentUser}from"../../hooks/useCurrentUser";
import api from"../../api/api";
import BookingOperationsPanel,{type BookingOperationAppointment}from"../booking/BookingOperationsPanel";

type Employee={id:string;location_id?:string|null};
function asArray<T>(value:any):T[]{return Array.isArray(value)?value:Array.isArray(value?.items)?value.items:Array.isArray(value?.data)?value.data:[]}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}

export default function DashboardDailyOperations(){
 const{user}=useCurrentUser() as any;
 const[appointments,setAppointments]=useState<BookingOperationAppointment[]>([]);
 const[employeeCount,setEmployeeCount]=useState(0);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{setLoading(true);setError("");try{const date=today();const locationId=String(user?.location_id||"");const params:any={from:date,to:date};if(locationId)params.location_id=locationId;const[e,a]=await Promise.all([api.get("/employees",{params:locationId?{location_id:locationId}:{}}),api.get("/timetable",{params})]);if(!active)return;const employees=asArray<Employee>(e.data).filter(x=>!locationId||!x.location_id||String(x.location_id)===locationId);const raw=Array.isArray(a.data?.appointments)?a.data.appointments:asArray<BookingOperationAppointment>(a.data);setEmployeeCount(employees.length);setAppointments(raw)}catch(reason:any){if(active)setError(reason?.response?.data?.error||reason?.message||"A napi működési áttekintés nem tölthető be.")}finally{if(active)setLoading(false)}})();return()=>{active=false}},[user?.location_id]);
 if(loading)return <section style={{margin:"0 24px 18px",padding:18,border:"1px solid #e7e0d6",borderRadius:18,background:"#fff"}}>Napi működési áttekintés betöltése…</section>;
 return <section style={{margin:"0 24px 18px"}}>{error&&<div style={{padding:"10px 12px",marginBottom:8,borderRadius:10,background:"#fff0f0",border:"1px solid #efcaca"}}>{error}</div>}<div style={{maxHeight:"560px",overflowY:"auto",overflowX:"auto",borderRadius:18,scrollbarGutter:"stable"}}><div style={{minWidth:900}}><BookingOperationsPanel appointments={appointments} employeeCount={employeeCount}/></div></div></section>
}
