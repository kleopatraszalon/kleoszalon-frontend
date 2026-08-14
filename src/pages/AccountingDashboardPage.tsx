import React from 'react';
import {Link} from 'react-router-dom';
import {Archive,BookOpenCheck,FileText,Landmark,ReceiptText} from 'lucide-react';
import FinanceDailyDashboard from './finance/FinanceDailyDashboard';
import AccountingWorkspaceV2 from './accounting/AccountingWorkspaceV2';

const cards=[
  {to:'/finance',icon:<Landmark size={20}/>,title:'Pénzügyi központ',text:'Bevételek, pénztár, zárások és pénzügyi műveletek.'},
  {to:'/finance?section=invoices',icon:<ReceiptText size={20}/>,title:'Számlák és bizonylatok',text:'Számlázási és könyvelési bizonylatok kezelése.'},
  {to:'/finance?section=control',icon:<BookOpenCheck size={20}/>,title:'Pénzügyi ellenőrzés',text:'Egyeztetések, eltérések és zárási ellenőrzések.'},
  {to:'/workorders',icon:<Archive size={20}/>,title:'Lezárt munkalapok',text:'Kizárólag lezárt és archivált munkalapok, csak olvasásra.'},
];

export default function AccountingDashboardPage(){
  return <div style={{padding:'24px',maxWidth:1600,margin:'0 auto'}}>
    <header style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
      <div style={{width:46,height:46,borderRadius:14,display:'grid',placeItems:'center',background:'#2b2118',color:'#fff'}}><FileText size={23}/></div>
      <div><div style={{fontSize:12,fontWeight:900,letterSpacing:'.08em',color:'#7a6b5e'}}>KÖNYVELÉS</div><h1 style={{margin:'2px 0 0',fontSize:28}}>Könyvelési irányítópult</h1><p style={{margin:'5px 0 0',color:'#667085'}}>Határidők, teendők, pénzügyi kontrollok, bizonylatok és archivált munkalapok egy helyen.</p></div>
    </header>
    <AccountingWorkspaceV2 />
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginBottom:20}}>
      {cards.map(card=><Link key={card.to} to={card.to} style={{textDecoration:'none',color:'inherit',border:'1px solid #e5ddd5',background:'#fff',borderRadius:14,padding:'16px',display:'flex',gap:12,boxShadow:'0 4px 16px rgba(43,33,24,.05)'}}>
        <span style={{width:38,height:38,borderRadius:10,display:'grid',placeItems:'center',background:'#f5efe9',color:'#5d4938',flex:'0 0 auto'}}>{card.icon}</span>
        <span><b style={{display:'block',fontSize:15,marginBottom:4}}>{card.title}</b><small style={{display:'block',color:'#667085',lineHeight:1.45}}>{card.text}</small></span>
      </Link>)}
    </section>
    <FinanceDailyDashboard />
  </div>
}
