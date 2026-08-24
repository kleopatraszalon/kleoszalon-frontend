import React from"react";
import{BarChart3,Boxes,Building2,CalendarDays,ClipboardCheck,ShoppingBag,Users,WalletCards}from"lucide-react";
import{useNavigate}from"react-router-dom";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";
import HrPayrollReadinessPanel from"./dashboard/HrPayrollReadinessPanel";
import"./OperationalRoleDashboardPage.css";

type Kind="salon"|"manager";
const salonActions=[
 {title:"Naptár és kapacitás",text:"Mai foglalások, munkatársak és szabad idősávok",route:"/appointments/calendar?mode=staff",icon:CalendarDays},
 {title:"Munkatársak",text:"Beosztás, jelenlét és napi feladatkiosztás",route:"/employees",icon:Users},
 {title:"Munkalapok",text:"Szolgáltatások, elszámolások és lezárások",route:"/workorders",icon:ClipboardCheck},
 {title:"Pénzügy",text:"Napi bevétel, pénztár és értékesítések",route:"/finance",icon:WalletCards},
 {title:"Készlet",text:"Kritikus készletek és szalonmozgások",route:"/warehouse",icon:Boxes},
 {title:"Beszerzés",text:"Rendelési igények és beérkezések",route:"/warehouse?view=procurement&section=dashboard",icon:ShoppingBag},
];
const managerActions=[
 {title:"Legfőbb mutatók",text:"Hálózati teljesítmény és vezetői KPI-k",route:"/reports/top-metrics",icon:BarChart3},
 {title:"Szalonok",text:"Telephelyek teljesítménye és működési állapota",route:"/masterdata/salons",icon:Building2},
 {title:"Naptár",text:"Kapacitás és foglalási terhelés szalononként",route:"/appointments/calendar",icon:CalendarDays},
 {title:"Munkatársak",text:"Létszám, beosztás és teljesítmény",route:"/employees",icon:Users},
 {title:"Pénzügy",text:"Bevétel, eredmény és pénzügyi kontroll",route:"/finance",icon:WalletCards},
 {title:"Készlet és beszerzés",text:"Készletérték, hiányok és ellátási helyzet",route:"/warehouse",icon:Boxes},
];

export default function OperationalRoleDashboardPage({kind}:{kind:Kind}){
 const navigate=useNavigate(),salon=kind==="salon",actions=salon?salonActions:managerActions;
 return <main className={`role-ops role-ops--${kind}`}>
  <header className="role-ops__hero"><div><span>{salon?"SZALONVEZETŐI MUNKATÉR":"VEZETŐI MUNKATÉR"}</span><h1>{salon?"Mai szalonműködés":"Vezetői áttekintés"}</h1><p>{salon?"Kapacitás, munkatársak, bevétel és napi teendők egyetlen operatív képernyőn.":"A hálózat teljesítménye, pénzügyei és működési döntési pontjai egy helyen."}</p></div><button onClick={()=>navigate(salon?"/appointments/calendar":"/reports/top-metrics")}><BarChart3 size={17}/>{salon?"Teljes naptár":"Részletes mutatók"}</button></header>
  <DashboardDailyOperations compact/>
  <section className="role-ops__actions" aria-label={salon?"Szalonvezetői gyorsműveletek":"Vezetői gyorsműveletek"}>{actions.map(({title,text,route,icon:Icon})=><button key={title} onClick={()=>navigate(route)}><Icon/><span><b>{title}</b><small>{text}</small></span></button>)}</section>
  {salon&&<HrPayrollReadinessPanel/>}
 </main>
}
