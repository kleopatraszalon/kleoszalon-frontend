import React from"react";
import{BriefcaseBusiness,CalendarClock,ClipboardCheck,GraduationCap,Users,WalletCards}from"lucide-react";
import{useNavigate}from"react-router-dom";
import HrPayrollReadinessPanel from"./dashboard/HrPayrollReadinessPanel";

const items=[
 {title:"Munkatársak",text:"Személyi adatok, szerződések és munkakörök",route:"/employees",icon:Users},
 {title:"Beosztás és munkaidő",text:"Beosztások, jelenlét és távollétek",route:"/modules/team/timetable",icon:CalendarClock},
 {title:"Bér és jutalék",text:"Bérezési csomagok és számfejtési előkészítés",route:"/modules/team/payroll",icon:WalletCards},
 {title:"Toborzás",text:"Jelöltek és felvételi folyamat",route:"/employees?view=recruitment",icon:BriefcaseBusiness},
 {title:"Képzések",text:"Képzések, képesítések és tudásanyagok",route:"/employees?view=training",icon:GraduationCap},
 {title:"Értékelések",text:"Teljesítményértékelések és fejlesztési célok",route:"/employees?view=reviews",icon:ClipboardCheck},
];
export default function HrDashboardPage(){const navigate=useNavigate();return <main style={{padding:22,maxWidth:1700,background:'radial-gradient(circle at 90% 0,rgba(156,45,101,.07),transparent 30%)'}}><header style={{marginBottom:14,padding:'18px 20px',border:'1px solid #eadfe4',borderRadius:20,background:'rgba(255,255,255,.92)',boxShadow:'0 14px 42px rgba(48,29,38,.06)'}}><small style={{color:'#9c2d65',fontWeight:850,letterSpacing:1}}>HR MUNKATÉR</small><h1 style={{margin:'5px 0',fontSize:28}}>Humánerőforrás irányítópult</h1><p style={{margin:0,color:'#706269'}}>Létszám, munkaidő, bér-előkészítés, toborzás és fejlesztés egyetlen munkafelületen.</p></header><section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginBottom:14}}>{items.map(({title,text,route,icon:Icon})=><button key={route} onClick={()=>navigate(route)} style={{display:'flex',gap:12,textAlign:'left',minHeight:82,padding:14,border:'1px solid #e8dfe3',borderRadius:15,background:'#fff',cursor:'pointer',boxShadow:'0 8px 24px rgba(48,29,38,.045)'}}><Icon size={19} color="#9c2d65"/><span><b style={{display:'block',fontSize:13}}>{title}</b><small style={{display:'block',marginTop:4,color:'#706269',fontSize:10,lineHeight:1.4}}>{text}</small></span></button>)}</section><HrPayrollReadinessPanel/></main>}
