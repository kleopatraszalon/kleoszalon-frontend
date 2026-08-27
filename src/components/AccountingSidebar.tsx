import React,{useState}from"react";
import{NavLink}from"react-router-dom";
import{BarChart3,BookOpenText,Boxes,Calculator,ChevronDown,ChevronRight,FileSpreadsheet,LayoutDashboard,ShoppingBag,WalletCards}from"lucide-react";
import Logo from"../assets/kleo_logo.png";
import{useLanguage}from"../i18n/LanguageProvider";
import{menuLabel}from"../utils/menuLabels";
import"../layouts/AccountingSidebarFix.css";

type LinkItem={label:string;to:string};
type Group={label:string;icon:React.ReactNode;items:LinkItem[]};

const groups:Group[]=[
 {label:"Pénzügyek",icon:<WalletCards size={18}/>,items:[
  {label:"Pénzügyi áttekintés",to:"/finance"},
  {label:"Cégek és külön könyvelések",to:"/settings/legal-entities"},
  {label:"Bizonylat-beérkeztetés",to:"/finance/document-intake"},
  {label:"Tárgyi eszközök és amortizáció",to:"/finance/fixed-assets"},
  {label:"NAV Online Számla",to:"/finance/nav-online-invoice"},
  {label:"Számítógépes nyugták",to:"/finance/receipts"},
  {label:"Nyugta és NAV-adatszolgáltatás",to:"/finance/receipt-compliance"},
  {label:"Számlák és bizonylatok",to:"/finance?section=invoices"},
  {label:"Pénzügyi ellenőrzés",to:"/finance?section=control"},
  {label:"Bérszámfejtés és járulékok",to:"/modules/team/payroll"},
 ]},
 {label:"Beszerzés",icon:<ShoppingBag size={18}/>,items:[
  {label:"Beszerzési áttekintés",to:"/warehouse?view=procurement&section=dashboard"},
  {label:"Jóváhagyások",to:"/warehouse?view=procurement&section=approvals"},
  {label:"Rendelések",to:"/warehouse?view=procurement&section=orders"},
  {label:"Beszállítók",to:"/warehouse?view=procurement&section=suppliers"},
 ]},
 {label:"Raktár és készlet",icon:<Boxes size={18}/>,items:[
  {label:"Készletáttekintés",to:"/warehouse"},
  {label:"Termékek",to:"/warehouse/products"},
  {label:"Készletműveletek",to:"/warehouse/operations"},
  {label:"Sarzsok és lejáratok (FEFO)",to:"/warehouse/lots"},
 ]},
 {label:"Könyvelési adatok",icon:<FileSpreadsheet size={18}/>,items:[
  {label:"Lezárt munkalapok",to:"/workorders"},
  {label:"Munkatársak és bérezési adatok",to:"/employees"},
  {label:"Ügyfelek és vevők",to:"/modules/customers/clients"},
  {label:"Beszállítói törzs",to:"/masterdata/suppliers"},
  {label:"Telephelyek és költséghelyek",to:"/masterdata/salons"},
  {label:"Fizetési módok",to:"/masterdata/payment-methods"},
  {label:"Pénzügyi tranzakciótípusok",to:"/masterdata/financial-transaction-types"},
  {label:"Raktárak",to:"/masterdata/warehouses"},
 ]},
];

export default function AccountingSidebar(){
 const{language}=useLanguage();
 const[open,setOpen]=useState<Record<string,boolean>>({Pénzügyek:true,Beszerzés:true,"Raktár és készlet":true});
 return <aside className="kleo-sidebar app-sidebar is-accounting-sidebar">
  <div className="accounting-sidebar-head"><div className="accounting-sidebar-logo"><img src={Logo} alt="Kleopátra"/></div><div className="accounting-sidebar-title"><b>Kleoszalon</b><small>{language==='en'?'Accounting workspace':'Könyvelési felület'}</small></div></div>
  <nav className="accounting-sidebar-nav" aria-label={language==='en'?'Accounting menu':'Könyvelési menü'}>
   <NavLink to="/" end className={({isActive})=>`accounting-main-link${isActive?" active":""}`}><LayoutDashboard size={18}/><span>{menuLabel('Irányítópult',language)}</span></NavLink>
   <NavLink to="/dashboard" className={({isActive})=>`accounting-main-link${isActive?" active":""}`}><Calculator size={18}/><span>{language==='en'?'Accounting overview':'Könyvelési áttekintés'}</span></NavLink>
   <div className="accounting-divider"/>
   {groups.map(g=>{const expanded=!!open[g.label];return <div className="accounting-group" key={g.label}><button type="button" className="accounting-group-button" onClick={()=>setOpen(v=>({...v,[g.label]:!v[g.label]}))} aria-expanded={expanded}>{g.icon}<span>{menuLabel(g.label,language)}</span>{expanded?<ChevronDown size={17}/>:<ChevronRight size={17}/>}</button>{expanded&&<div className="accounting-submenu">{g.items.map(i=><NavLink key={i.label} to={i.to} className={({isActive})=>isActive?"active":""}>{menuLabel(i.label,language)}</NavLink>)}</div>}</div>})}
   <div className="accounting-divider"/>
   <NavLink to="/reports/top-metrics" className={({isActive})=>`accounting-main-link${isActive?" active":""}`}><BarChart3 size={18}/><span>{menuLabel('Riportok és kimutatások',language)}</span></NavLink>
   <NavLink to="/knowledge-base" className={({isActive})=>`accounting-main-link${isActive?" active":""}`}><BookOpenText size={18}/><span>{menuLabel('Könyvelési tudásbázis',language)}</span></NavLink>
  </nav>
 </aside>;
}
