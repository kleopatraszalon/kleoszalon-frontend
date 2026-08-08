import React from"react";
import{RefreshCw}from"lucide-react";
import{useCurrentUser}from"../hooks/useCurrentUser";
import Home from"./Home";
import EmployeeDashboardPage from"./EmployeeDashboardPage";
import CustomerDashboardPage from"./CustomerDashboardPage";

function roles(raw:unknown){if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase());if(p!=null)return[String(p).toLowerCase()]}catch{}return t.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}
export default function RoleDashboardPage(){const{user,loading}=useCurrentUser();if(loading)return <div style={{padding:28,display:"flex",gap:8,alignItems:"center"}}><RefreshCw className="spin"/> Betöltés…</div>;const r=roles(user?.role);const customer=r.some(x=>["customer","client","guest","ugyfel","ügyfél","vendeg","vendég"].includes(x));const elevated=r.some(x=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto"].includes(x));const staff=!elevated&&!customer&&r.some(x=>["employee","receptionist"].includes(x));if(customer)return <CustomerDashboardPage/>;return staff?<EmployeeDashboardPage/>:<Home/>}
