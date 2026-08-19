import React,{lazy,Suspense,useEffect,useState}from"react";
import{RefreshCw}from"lucide-react";
import{useCurrentUser}from"../hooks/useCurrentUser";

const Home=lazy(()=>import("./Home"));
const EmployeeDashboardPage=lazy(()=>import("./EmployeeDashboardPage"));
const CustomerDashboardPage=lazy(()=>import("./CustomerDashboardPage"));
const ReceptionDashboardPage=lazy(()=>import("./ReceptionDashboardPage"));
const AccountingDashboardPage=lazy(()=>import("./AccountingDashboardPage"));
const DashboardDailyOperations=lazy(()=>import("./dashboard/DashboardDailyOperations"));
const WorkOrderDashboardPanel=lazy(()=>import("./dashboard/WorkOrderDashboardPanel"));
const HrPayrollReadinessPanel=lazy(()=>import("./dashboard/HrPayrollReadinessPanel"));
const AdminProductSaleQuickAction=lazy(()=>import("./dashboard/AdminProductSaleQuickAction"));

function roles(raw:unknown){if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase());if(p!=null)return[String(p).toLowerCase()]}catch{}return t.split(",").map(x=>x.replace(/[[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}
const Fallback=()=> <div style={{padding:18,display:"flex",gap:8,alignItems:"center"}}><RefreshCw className="spin" size={16}/> Betöltés…</div>;
function Delayed({ms,children}:{ms:number;children:React.ReactNode}){const[ready,setReady]=useState(false);useEffect(()=>{const id=window.setTimeout(()=>setReady(true),ms);return()=>window.clearTimeout(id)},[ms]);return ready?<Suspense fallback={null}>{children}</Suspense>:null}
function WithWorkOrders({children}:{children:React.ReactNode}){return <><Suspense fallback={null}><WorkOrderDashboardPanel/></Suspense>{children}</>}
export default function RoleDashboardPage(){
 const{user,loading}=useCurrentUser();
 if(loading)return <Fallback/>;
 const r=roles(user?.role);
 const admin=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin"].includes(x));
 const accounting=r.some(x=>["accounting","bookkeeper","konyveles","könyvelés"].includes(x));
 const customer=r.some(x=>["customer","client","guest","ugyfel","ügyfél","vendeg","vendég"].includes(x));
 const receptionist=r.some(x=>["receptionist","reception","recepciós","recepcios"].includes(x));
 const payrollEligible=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin","location_manager","üzletvezető","uzletvezeto","store_manager","branch_manager"].includes(x));
 const elevated=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto","location_manager","üzletvezető","uzletvezeto","store_manager","branch_manager","szalonvezető","szalonvezeto","salon_manager"].includes(x));
 const staff=!elevated&&!customer&&!receptionist&&!accounting&&r.some(x=>["employee","staff","munkatárs","munkatars","professional","specialist"].includes(x));
 if(accounting)return <Suspense fallback={<Fallback/>}><AccountingDashboardPage/></Suspense>;
 if(customer)return <WithWorkOrders><Suspense fallback={<Fallback/>}><CustomerDashboardPage/></Suspense></WithWorkOrders>;
 if(receptionist)return <ReceptionDashboardPage/>;
 if(staff)return <WithWorkOrders><Suspense fallback={<Fallback/>}><EmployeeDashboardPage/></Suspense></WithWorkOrders>;
 return <>
   {admin&&<Suspense fallback={null}><AdminProductSaleQuickAction/></Suspense>}
   <Suspense fallback={<Fallback/>}><Home/></Suspense>
   <Delayed ms={750}><DashboardDailyOperations/></Delayed>
   {payrollEligible&&<Delayed ms={1100}><HrPayrollReadinessPanel/></Delayed>}
 </>;
}
