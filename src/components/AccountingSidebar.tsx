import React from "react";
import { NavLink } from "react-router-dom";
import {
  Archive,
  BarChart3,
  BookOpenText,
  Boxes,
  Building2,
  Calculator,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  ShoppingBag,
  Users,
  WalletCards,
} from "lucide-react";
import Logo from "../assets/kleo_logo.png";

type Item={label:string;to:string;icon:React.ReactNode};
const items:Item[]=[
 {label:"Irányítópult",to:"/",icon:<LayoutDashboard size={17}/>},
 {label:"Könyvelési kontrollközpont",to:"/dashboard",icon:<Calculator size={17}/>},
 {label:"Pénzügyek",to:"/finance",icon:<WalletCards size={17}/>},
 {label:"NAV Online Számla",to:"/finance/nav-online-invoice",icon:<ReceiptText size={17}/>},
 {label:"Számlák és bizonylatok",to:"/finance?section=invoices",icon:<FileSpreadsheet size={17}/>},
 {label:"Pénzügyi ellenőrzés",to:"/finance?section=control",icon:<BarChart3 size={17}/>},
 {label:"Bér és járulék",to:"/modules/team/payroll",icon:<Users size={17}/>},
 {label:"Munkatárs törzsadatok",to:"/employees",icon:<Users size={17}/>},
 {label:"Ügyfelek / vevői adatok",to:"/modules/customers/clients",icon:<Users size={17}/>},
 {label:"Raktár és készlet",to:"/warehouse",icon:<Boxes size={17}/>},
 {label:"Beszerzés / szállítók",to:"/warehouse?view=procurement&section=dashboard",icon:<ShoppingBag size={17}/>},
 {label:"Lezárt munkalapok",to:"/workorders",icon:<Archive size={17}/>},
 {label:"Riportok és VIR",to:"/reports/top-metrics",icon:<BarChart3 size={17}/>},
 {label:"Tudásbázis",to:"/knowledge-base",icon:<BookOpenText size={17}/>},
 {label:"Marketing költségforrások",to:"/marketing/newsletter",icon:<Megaphone size={17}/>},
 {label:"Napi akciók",to:"/marketing/daily-deals",icon:<Megaphone size={17}/>},
 {label:"Telephelyek / költséghelyek",to:"/masterdata/salons",icon:<Building2 size={17}/>},
 {label:"Fizetési módok",to:"/masterdata/payment-methods",icon:<Landmark size={17}/>},
];

export default function AccountingSidebar(){
 return <aside className="kleo-sidebar">
  <div className="kleo-sidebar-brand"><img src={Logo} alt="Kleopátra"/></div>
  <nav className="kleo-sidebar-menu" aria-label="Könyvelési menü">
   {items.map(item=><NavLink key={item.label} to={item.to} className={({isActive})=>`kleo-sidebar-menu-item${isActive?" is-active":""}`}>
    <span className="kleo-sidebar-menu-icon">{item.icon}</span><span>{item.label}</span>
   </NavLink>)}
  </nav>
 </aside>;
}
