import React from"react";
import{RefreshCw}from"lucide-react";
import{useCurrentUser}from"../hooks/useCurrentUser";
import Home from"./Home";
import EmployeeDashboardPage from"./EmployeeDashboardPage";
import CustomerDashboardPage from"./CustomerDashboardPage";
import ReceptionDashboardPage from"./ReceptionDashboardPage";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";
import WorkOrderDashboardPanel from"./dashboard/WorkOrderDashboardPanel";
import HrPayrollReadinessPanel from"./dashboard/HrPayrollReadinessPanel";

function roles(raw:unknown){if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase());if(p!=null)return[String(p).toLowerCase()]}catch{}return t.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}
function WithWorkOrders({children}:{children:React.ReactNode}){return <><WorkOrderDashboardPanel/>{children}</>}
export default function RoleDashboardPage(){const{user,loading}=useCurrentUser();if(loading)return <div style={{padding:28,display:"flex",gap:8,alignItems:"center"}}><RefreshCw className="spin"/> Betöltés…</div>;const r=roles(user?.role);const customer=r.some(x=>["customer","client","guest","ugyfel","ügyfél","vendeg","vendég"].includes(x));const receptionist=r.some(x=>["receptionist","reception","recepciós","recepcios"].includes(x));const payrollEligible=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin","location_manager","üzletvezető","uzletvezeto","store_manager","branch_manager"].includes(x));const elevated=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto","location_manager","üzletvezető","uzletvezeto","store_manager","branch_manager","szalonvezető","szalonvezeto","salon_manager"].includes(x));const staff=!elevated&&!customer&&!receptionist&&r.some(x=>["employee","staff","munkatárs","munkatars","professional","specialist"].includes(x));if(customer)return <WithWorkOrders><CustomerDashboardPage/></WithWorkOrders>;if(receptionist)return <WithWorkOrders><ReceptionDashboardPage/></WithWorkOrders>;if(staff)return <WithWorkOrders><EmployeeDashboardPage/></WithWorkOrders>;return <WithWorkOrders><>{payrollEligible&&<HrPayrollReadinessPanel/>}<DashboardDailyOperations/><Home/></></WithWorkOrders>}
