import React from"react";
import{BarChart3,Building2,CalendarDays,Users,WalletCards}from"lucide-react";
import{useNavigate}from"react-router-dom";
import DashboardDailyOperations from"./dashboard/DashboardDailyOperations";

const actions=[
 {title:"Vezetői riportok",text:"Legfőbb mutatók és teljesítmény",route:"/reports/top-metrics",icon:BarChart3},
 {title:"Szalonok",text:"Telephelyek és működés",route:"/masterdata/salons",icon:Building2},
 {title:"Naptár",text:"Szalonok foglalási képe",route:"/appointments/calendar",icon:CalendarDays},
 {title:"Munkatársak",text:"Létszám és munkakörök",route:"/employees",icon:Users},
 {title:"Pénzügyek",text:"Bevétel és eredmény",route:"/finance",icon:WalletCards},
];
export default function ManagerDashboardPage(){const navigate=useNavigate();return <main style={{padding:"20px 24px",maxWidth:1800,overflow:"hidden"}}>
 <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:12}}><div><small style={{color:"#9c2d65",fontWeight:850,letterSpacing:1}}>VEZETŐI MUNKATÉR</small><h1 style={{margin:"4px 0",fontSize:26}}>Vezetői irányítópult</h1><p style={{margin:0,color:"#706269"}}>A napi döntésekhez szükséges működési, kapacitás- és bevételi adatok.</p></div></header>
 <DashboardDailyOperations compact/>
 <section style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(150px,1fr))",gap:10,margin:"0 24px"}}>{actions.map(({title,text,route,icon:Icon})=><button key={route} onClick={()=>navigate(route)} style={{display:"flex",gap:10,textAlign:"left",padding:14,border:"1px solid #e8dfe3",borderRadius:14,background:"#fff",cursor:"pointer"}}><Icon size={20} color="#9c2d65"/><span><b style={{display:"block"}}>{title}</b><small style={{display:"block",marginTop:3,color:"#706269"}}>{text}</small></span></button>)}</section>
 </main>}
