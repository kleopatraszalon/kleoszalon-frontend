import React,{useEffect,useMemo,useState}from"react";
import{CalendarDays,ShoppingBag}from"lucide-react";
import{useNavigate}from"react-router-dom";
import AppointmentsCalendarCore from"./AppointmentsCalendarCore";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";
import DashboardChecklistCard from"../components/DashboardChecklistCard";
import withBase from"../utils/apiBase";
import"./ReceptionDashboardPage.css";

type HomeItem={key:string;name:string;route:string;is_visible:boolean;sort_order:number};
const defaults:HomeItem[]=[
 {key:'appointments',name:'Teljes naptár',route:'/appointments/calendar?mode=days',is_visible:true,sort_order:0},
 {key:'new_appointment',name:'Új időpont',route:'/appointments/new',is_visible:true,sort_order:5},
 {key:'workorders',name:'Munkalapok / elszámolás',route:'/workorders',is_visible:true,sort_order:10},
 {key:'product_sale',name:'Termékeladás',route:'/finance/product-sale',is_visible:true,sort_order:20},
 {key:'clients',name:'Vendégek / CRM',route:'/modules/customers/clients',is_visible:true,sort_order:30},
 {key:'cashier',name:'Pénztár',route:'/finance/cashier',is_visible:true,sort_order:40}
];

export default function ReceptionDashboardPage(){
 const navigate=useNavigate();const[items,setItems]=useState<HomeItem[]>(defaults);
 useEffect(()=>{let alive=true;void(async()=>{try{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token')||'';const r=await fetch(withBase('access-control/me/ui-profile'),{headers:{Authorization:`Bearer ${token}`},credentials:'include'});if(r.ok){const d=await r.json();if(alive&&Array.isArray(d?.items))setItems(d.items)}}catch{} })();return()=>{alive=false}},[]);
 const visible=useMemo(()=>items.filter(x=>x.is_visible).sort((a,b)=>a.sort_order-b.sort_order),[items]);
 const showCalendar=visible.some(x=>x.key==='appointments');
 return <main className="reception-home">
  <section className="reception-home__hero">
   <div><span>Recepciós munkatér</span><h1>Mai operáció</h1><p>Időpontok, vendégek, kapacitás és bevétel – egyetlen áttekinthető munkafelületen.</p></div>
   <div className="reception-home__primary-actions"><button className="is-primary" type="button" onClick={()=>navigate('/appointments/new')}><CalendarDays size={17}/> Új időpont</button><button type="button" onClick={()=>navigate('/finance/product-sale')}><ShoppingBag size={17}/> Új értékesítés</button></div>
  </section>
  <DashboardDailyOperations compact/>
  <section className="reception-home__checklist"><DashboardChecklistCard/></section>
  {showCalendar&&<section className="reception-home__calendar"><AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}/></section>}
 </main>
}
