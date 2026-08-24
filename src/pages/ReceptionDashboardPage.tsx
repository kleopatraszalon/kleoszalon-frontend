import React,{useEffect,useMemo,useState}from"react";
import{CalendarDays,ClipboardPlus,ShoppingBag,Users,WalletCards,MessageCircle,CheckSquare,Package,FileBarChart,Dumbbell}from"lucide-react";
import{useNavigate}from"react-router-dom";
import AppointmentsCalendarCore from"./AppointmentsCalendarCore";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";
import withBase from"../utils/apiBase";
import"./ReceptionDashboardPage.css";

type HomeItem={key:string;name:string;route:string;is_visible:boolean;sort_order:number};
const icons:Record<string,React.ElementType>={appointments:CalendarDays,new_appointment:CalendarDays,workorders:ClipboardPlus,product_sale:ShoppingBag,clients:Users,cashier:WalletCards,staff_chat:MessageCircle,checklists:CheckSquare,inventory:Package,reports:FileBarChart};
const defaults:HomeItem[]=[
 {key:'appointments',name:'Teljes naptár',route:'/appointments/calendar?mode=days',is_visible:true,sort_order:0},
 {key:'new_appointment',name:'Új időpont',route:'/appointments/new',is_visible:true,sort_order:5},
 {key:'workorders',name:'Munkalapok / elszámolás',route:'/workorders',is_visible:true,sort_order:10},
 {key:'product_sale',name:'Termékeladás',route:'/finance/product-sale',is_visible:true,sort_order:20},
 {key:'clients',name:'Vendégek / CRM',route:'/modules/customers/clients',is_visible:true,sort_order:30},
 {key:'cashier',name:'Pénztár',route:'/finance/cashier',is_visible:true,sort_order:40}
];

export default function ReceptionDashboardPage(){
 const navigate=useNavigate();const[items,setItems]=useState<HomeItem[]>(defaults);const[fitnessAllowed,setFitnessAllowed]=useState(false);
 useEffect(()=>{let alive=true;void(async()=>{try{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token')||'';const headers={Authorization:`Bearer ${token}`};const[r,f]=await Promise.all([fetch(withBase('access-control/me/ui-profile'),{headers,credentials:'include'}),fetch(withBase('vir/fitness/access'),{headers,credentials:'include'})]);if(r.ok){const d=await r.json();if(alive&&Array.isArray(d?.items))setItems(d.items)}if(f.ok){const d=await f.json();if(alive)setFitnessAllowed(Boolean(d?.allowed))}}catch{} })();return()=>{alive=false}},[]);
 const visible=useMemo(()=>items.filter(x=>x.is_visible).sort((a,b)=>a.sort_order-b.sort_order),[items]);
 const showCalendar=visible.some(x=>x.key==='appointments');
 return <main className="reception-home">
  <section className="reception-home__hero">
   <div><span>Recepciós munkatér</span><h1>Mai operáció</h1><p>Időpontok, vendégek, kapacitás és bevétel – egyetlen áttekinthető munkafelületen.</p></div>
   <div className="reception-home__primary-actions"><button className="is-primary" type="button" onClick={()=>navigate('/appointments/new')}><CalendarDays size={17}/> Új időpont</button><button type="button" onClick={()=>navigate('/finance/product-sale')}><ShoppingBag size={17}/> Új értékesítés</button></div>
  </section>
  <nav className="reception-home__shortcuts" aria-label="Recepciós gyorsműveletek">{visible.map(x=>{const Icon=icons[x.key]||CheckSquare;return <button key={x.key} type="button" onClick={()=>navigate(x.route)} className={x.key==='product_sale'?'is-emphasis':''}><Icon size={16}/><span>{x.name}</span></button>})}{fitnessAllowed&&<button type="button" onClick={()=>navigate('/finance/fitness')} className="is-fitness"><Dumbbell size={16}/><span>Fitnesz – Gyöngyös</span></button>}</nav>
  <DashboardDailyOperations compact/>
  {showCalendar&&<section className="reception-home__calendar"><AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}/></section>}
 </main>
}
