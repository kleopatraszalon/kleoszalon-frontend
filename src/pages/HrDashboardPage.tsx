import React from"react";
import{BriefcaseBusiness,CalendarClock,ClipboardCheck,GraduationCap,Users,WalletCards}from"lucide-react";
import{useNavigate}from"react-router-dom";

const items=[
 {title:"Munkatársak",text:"Személyi adatok, szerződések és munkakörök",route:"/employees",icon:Users},
 {title:"Beosztás és munkaidő",text:"Beosztások, jelenlét és távollétek",route:"/modules/team/timetable",icon:CalendarClock},
 {title:"Bér és jutalék",text:"Bérezési csomagok és számfejtési előkészítés",route:"/modules/team/payroll",icon:WalletCards},
 {title:"Toborzás",text:"Jelöltek és felvételi folyamat",route:"/employees?view=recruitment",icon:BriefcaseBusiness},
 {title:"Képzések",text:"Képzések, képesítések és tudásanyagok",route:"/employees?view=training",icon:GraduationCap},
 {title:"Értékelések",text:"Teljesítményértékelések és fejlesztési célok",route:"/employees?view=reviews",icon:ClipboardCheck},
];
export default function HrDashboardPage(){const navigate=useNavigate();return <main style={{padding:24,maxWidth:1500}}><header style={{marginBottom:20}}><small style={{color:'#9c2d65',fontWeight:850,letterSpacing:1}}>HR MUNKATÉR</small><h1 style={{margin:'5px 0'}}>Humánerőforrás irányítópult</h1><p style={{color:'#706269'}}>A munkatársak teljes életciklusa egy helyen, adminisztrátori rendszerfunkciók nélkül.</p></header><section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{items.map(({title,text,route,icon:Icon})=><button key={route} onClick={()=>navigate(route)} style={{display:'flex',gap:14,textAlign:'left',padding:18,border:'1px solid #e8dfe3',borderRadius:16,background:'#fff',cursor:'pointer'}}><Icon color="#9c2d65"/><span><b style={{display:'block',fontSize:16}}>{title}</b><small style={{display:'block',marginTop:6,color:'#706269',lineHeight:1.45}}>{text}</small></span></button>)}</section></main>}
