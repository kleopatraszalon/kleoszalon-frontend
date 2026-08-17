import React,{useEffect,useMemo,useState}from"react";
import{CalendarDays,ClipboardPlus,ShoppingBag,Users,WalletCards,MessageCircle,CheckSquare,Package,FileBarChart,Dumbbell}from"lucide-react";
import{useNavigate}from"react-router-dom";
import DashboardChecklistCard from"../components/DashboardChecklistCard";
import ReceptionDeviceControlPanel from"../components/ReceptionDeviceControlPanel";
import AppointmentsCalendarCore from"./AppointmentsCalendarCore";
import withBase from"../utils/apiBase";

type HomeItem={key:string;name:string;route:string;is_visible:boolean;sort_order:number};
const icons:Record<string,React.ElementType>={appointments:CalendarDays,workorders:ClipboardPlus,product_sale:ShoppingBag,clients:Users,cashier:WalletCards,staff_chat:MessageCircle,checklists:CheckSquare,inventory:Package,reports:FileBarChart};
const defaults:HomeItem[]=[
 {key:'appointments',name:'Teljes naptár',route:'/appointments/calendar?mode=days',is_visible:true,sort_order:0},
 {key:'workorders',name:'Munkalapok',route:'/workorders',is_visible:true,sort_order:10},
 {key:'product_sale',name:'Termékeladás',route:'/finance/product-sale',is_visible:true,sort_order:20},
 {key:'clients',name:'Vendégek / CRM',route:'/modules/customers/clients',is_visible:true,sort_order:30},
 {key:'cashier',name:'Pénztár',route:'/finance/cashier',is_visible:true,sort_order:40}
];

export default function ReceptionDashboardPage(){
 const navigate=useNavigate();const[items,setItems]=useState<HomeItem[]>(defaults);const[fitnessAllowed,setFitnessAllowed]=useState(false);
 useEffect(()=>{let alive=true;void(async()=>{try{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token')||'';const headers={Authorization:`Bearer ${token}`};const[r,f]=await Promise.all([fetch(withBase('access-control/me/ui-profile'),{headers,credentials:'include'}),fetch(withBase('vir/fitness/access'),{headers,credentials:'include'})]);if(r.ok){const d=await r.json();if(alive&&Array.isArray(d?.items))setItems(d.items)}if(f.ok){const d=await f.json();if(alive)setFitnessAllowed(Boolean(d?.allowed))}}catch{} })();return()=>{alive=false}},[]);
 const visible=useMemo(()=>items.filter(x=>x.is_visible).sort((a,b)=>a.sort_order-b.sort_order),[items]);
 const showCalendar=visible.some(x=>x.key==='appointments');const showChecklist=visible.some(x=>x.key==='checklists');
 return <main style={{padding:"22px 0 28px",maxWidth:1900,margin:0}}>
  <section style={{margin:"0 24px 14px",padding:"18px 20px",border:"1px solid #eadfe4",borderRadius:18,background:"linear-gradient(135deg,#fff 0%,#fff8fb 100%)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}>
   <div><span style={{display:"block",marginBottom:5,color:"#9c2d65",fontSize:11,fontWeight:800,letterSpacing:".09em",textTransform:"uppercase"}}>Recepciós irányítópult</span><h1 style={{margin:0,color:"#2d2227",fontSize:26}}>Napi munka</h1><p style={{margin:"6px 0 0",color:"#76676e",fontSize:13}}>A főoldal gyorsgombjai személyre szabhatók az adminisztrátori Beállítások / Jogosultságok felületen.</p></div>
   <button type="button" onClick={()=>navigate('/workorders/new')} style={{...quickButtonStyle,borderColor:'#e9b6ce',color:'#9c2d65'}}><ClipboardPlus size={17}/> Walk-in munkalap</button>
  </section>
  <section style={{margin:'0 24px 14px',display:'flex',gap:8,flexWrap:'wrap'}}>{visible.map(x=>{const Icon=icons[x.key]||CheckSquare;return <button key={x.key} type="button" onClick={()=>navigate(x.route)} style={{...quickButtonStyle,...(x.key==='product_sale'?productButtonStyle:{})}}><Icon size={17}/>{x.name}</button>})}{fitnessAllowed&&<button type="button" onClick={()=>navigate('/finance/fitness')} style={fitnessButtonStyle}><Dumbbell size={17}/> Fitnesz – Gyöngyös</button>}</section>
  <ReceptionDeviceControlPanel/>
  {showChecklist&&<DashboardChecklistCard/>}
  {showCalendar&&<AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}/>} 
 </main>
}
const quickButtonStyle:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:7,padding:"10px 12px",border:"1px solid #e5dce0",borderRadius:11,background:"#fff",color:"#4f4148",cursor:"pointer",fontSize:13,fontWeight:750};
const productButtonStyle:React.CSSProperties={background:'#2b2118',color:'#fff',borderColor:'#2b2118'};
const fitnessButtonStyle:React.CSSProperties={...quickButtonStyle,background:'#7b1f50',color:'#fff',borderColor:'#7b1f50',fontWeight:850};