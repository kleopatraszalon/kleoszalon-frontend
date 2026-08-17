import React,{useEffect,useMemo,useState}from'react';
import axios from'axios';
import{NavLink,useLocation,useNavigate}from'react-router-dom';
import{BookOpenText,Boxes,CalendarDays,ChartNoAxesCombined,ChevronDown,ChevronRight,Circle,ClipboardCheck,Database,Gift,LayoutDashboard,MonitorPlay,ShoppingBag,UserCog,Users,WalletCards,type LucideIcon}from'lucide-react';
import Logo from'../assets/kleo_logo.png';
import SidebarCalendar from'./SidebarCalendar';
import{translateMenuLabel,useLanguage}from'../i18n/LanguageProvider';
import{featureEnabled,menuEnabled,readStoredVirCustomization,VIR_CUSTOMIZATION_EVENT,type VirCustomization}from'../utils/virCustomization';

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const MENU_CACHE_KEY='kleo.menu.cache.v15';
interface RawMenuItem{id:number;name:string;icon?:string|null;route?:string|null;parent_id?:number|null;required_role?:string|null;order_index?:number|null;submenus?:RawMenuItem[]}
interface MenuItem{id:number;name:string;icon?:string;route?:string;children:MenuItem[]}
interface SidebarProps{user?:{role?:string|string[]|null}|null}
const icons:Record<string,LucideIcon>={LayoutDashboard,CalendarDays,Users,Gift,UserCog,WalletCards,Boxes,ChartNoAxesCombined,ShoppingBag,ClipboardCheck,BookOpenText,Database,MonitorPlay};
const Icon=({name}:{name?:string})=>{const C=(name&&icons[name])||Circle;return <C className="kleo-sidebar-menu-icon" size={17} strokeWidth={1.8}/>};
const LEGACY_ROUTES:Record<string,string>={'/products':'/warehouse/products','/masterdata/products':'/warehouse/products','/inventory/products':'/warehouse/products','/inventory':'/warehouse','/procurement':'/warehouse?view=procurement&section=dashboard','/warehouse/procurement':'/warehouse?view=procurement&section=dashboard','/appointments':'/appointments/calendar','/clients':'/modules/customers/clients','/crm':'/modules/customers/crm','/team':'/employees','/staff':'/employees','/workorders/list':'/workorders'};
const norm=(r?:string)=>{if(!r)return'#';let s=r.trim();if(!s.startsWith('/'))s='/'+s;s=s.replace(/\/{2,}/g,'/');const[p,...rest]=s.split('?');const canonical=LEGACY_ROUTES[p]||p;if(canonical.includes('?'))return canonical;return rest.length?`${canonical}?${rest.join('?')}`:canonical};
const routeActive=(route:string|undefined,location:{pathname:string;search:string})=>{const target=norm(route);if(target==='#')return false;const q=target.indexOf('?'),tp=q>=0?target.slice(0,q):target,ts=q>=0?target.slice(q+1):'';if(tp!==location.pathname)return false;if(!ts)return true;const actual=new URLSearchParams(location.search),expected=new URLSearchParams(ts);for(const[k,v]of expected.entries())if(actual.get(k)!==v)return false;return true};
const roleList=(raw:any):string[]=>{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());try{const p=JSON.parse(String(raw||''));if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase())}catch{}return String(raw||'').split(',').map(x=>x.replace(/[\[\]"]/g,'').trim().toLowerCase()).filter(Boolean)};

const CUSTOMER:MenuItem[]=[{id:99101,name:'Irányítópult',icon:'LayoutDashboard',route:'/',children:[]},{id:99102,name:'Időpontfoglalás',icon:'CalendarDays',route:'/customer/booking',children:[]},{id:99103,name:'Saját munkalapjaim',icon:'ClipboardCheck',route:'/workorders',children:[]}];
const STAFF:MenuItem[]=[{id:99001,name:'Irányítópult',icon:'LayoutDashboard',route:'/',children:[]},{id:99002,name:'Saját beosztás',icon:'CalendarDays',route:'/modules/team/timetable',children:[]},{id:99005,name:'Saját munkalapok',icon:'ClipboardCheck',route:'/workorders',children:[]},{id:99003,name:'Check listák',icon:'ClipboardCheck',route:'/knowledge-base/checklists',children:[]},{id:99006,name:'Tudástár',icon:'BookOpenText',route:'/knowledge-base/library',children:[]},{id:99007,name:'Munkaköri teszt',icon:'ClipboardCheck',route:'/knowledge-base/quiz',children:[]}];
const LOCATION:MenuItem[]=[{id:99201,name:'Irányítópult',icon:'LayoutDashboard',route:'/',children:[]},{id:99202,name:'Időpontok és beosztás',icon:'CalendarDays',children:[{id:99221,name:'Időpontnaptár',route:'/appointments/calendar',children:[]},{id:99224,name:'Munkalapok',route:'/workorders',children:[]}]},{id:99206,name:'Raktár és készlet',icon:'Boxes',children:[{id:99261,name:'Készlet',route:'/warehouse',children:[]},{id:99262,name:'Termékek',route:'/warehouse/products',children:[]},{id:99263,name:'Sarzs és lejárat (FEFO)',route:'/warehouse/lots',children:[]}]},{id:99207,name:'Beszerzés',icon:'ShoppingBag',route:'/warehouse?view=procurement&section=dashboard',children:[]},{id:99208,name:'Tudástár',icon:'BookOpenText',route:'/knowledge-base/library',children:[]},{id:99209,name:'Munkaköri teszt',icon:'ClipboardCheck',route:'/knowledge-base/quiz',children:[]}];
const ACCOUNTING:MenuItem[]=[
 {id:99301,name:'Irányítópult',icon:'LayoutDashboard',route:'/',children:[]},
 {id:99302,name:'Pénzügyek',icon:'WalletCards',children:[
  {id:99321,name:'Pénzügyi áttekintés',route:'/finance',children:[]},
  {id:99322,name:'NAV Online Számla',route:'/finance/nav-online-invoice',children:[]},
  {id:99323,name:'Számlák és bizonylatok',route:'/finance?section=invoices',children:[]},
  {id:99324,name:'Pénzügyi ellenőrzés',route:'/finance?section=control',children:[]},
  {id:99325,name:'Bér és járulék',route:'/modules/team/payroll',children:[]}
 ]},
 {id:99303,name:'Beszerzés',icon:'ShoppingBag',children:[
  {id:99331,name:'Beszerzési áttekintés',route:'/warehouse?view=procurement&section=dashboard',children:[]},
  {id:99332,name:'Jóváhagyások',route:'/warehouse?view=procurement&section=approvals',children:[]},
  {id:99333,name:'Rendelések',route:'/warehouse?view=procurement&section=orders',children:[]},
  {id:99334,name:'Beszállítók',route:'/warehouse?view=procurement&section=suppliers',children:[]}
 ]},
 {id:99304,name:'Raktár és készlet',icon:'Boxes',children:[
  {id:99341,name:'Készlet áttekintés',route:'/warehouse',children:[]},
  {id:99342,name:'Termékek',route:'/warehouse/products',children:[]},
  {id:99343,name:'Készletműveletek',route:'/warehouse/operations',children:[]},
  {id:99344,name:'Sarzs és lejárat (FEFO)',route:'/warehouse/lots',children:[]}
 ]},
 {id:99305,name:'Könyvelési adatok',icon:'Database',children:[
  {id:99351,name:'Lezárt munkalapok',route:'/workorders',children:[]},
  {id:99352,name:'Munkatársak és bérforrások',route:'/employees',children:[]},
  {id:99353,name:'Ügyfelek / vevők',route:'/modules/customers/clients',children:[]},
  {id:99354,name:'Beszállítói törzs',route:'/masterdata/suppliers',children:[]},
  {id:99355,name:'Telephelyek / költséghelyek',route:'/masterdata/salons',children:[]},
  {id:99356,name:'Fizetési módok',route:'/masterdata/payment-methods',children:[]},
  {id:99357,name:'Pénzügyi tranzakciótípusok',route:'/masterdata/financial-transaction-types',children:[]},
  {id:99358,name:'Raktárak',route:'/masterdata/warehouses',children:[]}
 ]},
 {id:99306,name:'Riportok és kimutatások',icon:'ChartNoAxesCombined',route:'/reports/top-metrics',children:[]},
 {id:99307,name:'Könyvelési tudástár',icon:'BookOpenText',route:'/knowledge-base',children:[]}
];
const FALLBACK:MenuItem[]=[{id:90001,name:'Irányítópult',icon:'LayoutDashboard',route:'/',children:[]},{id:90007,name:'Pénzügyek',icon:'WalletCards',route:'/finance',children:[]},{id:90008,name:'Raktár és készlet',icon:'Boxes',route:'/warehouse',children:[]},{id:90009,name:'Beszerzés',icon:'ShoppingBag',route:'/warehouse?view=procurement&section=dashboard',children:[]}];
const SPEC_PARITY:MenuItem={id:99401,name:'VIR specifikáció',icon:'ClipboardCheck',route:'/admin/vir/spec-parity',children:[]};
const WALLBOARD:MenuItem={id:99402,name:'WallBoard / TV napi akció',icon:'MonitorPlay',route:'/marketing/wallboard',children:[]};
const SAAS_ADMIN:MenuItem={id:99403,name:'SaaS / Franchise központ',icon:'Database',route:'/admin/saas',children:[]};
const VIR_ADMIN:MenuItem={id:99404,name:'VIR Admin / testreszabás',icon:'UserCog',route:'/knowledge-base/library?tab=vir',children:[]};

function menuKey(item:MenuItem){const r=norm(item.route);if(r==='/')return'dashboard';if(r.startsWith('/appointments')||r.startsWith('/customer/booking'))return'appointments';if(r.startsWith('/employees')||r.startsWith('/hr')||r.startsWith('/modules/team'))return'employees';if(r.startsWith('/modules/customers')||r.startsWith('/clients')||r.startsWith('/crm'))return'clients';if(r.startsWith('/finance')||r.startsWith('/penzugy'))return'finance';if(r.startsWith('/warehouse')||r.startsWith('/procurement')||r.startsWith('/products'))return'warehouse';if(r.startsWith('/knowledge-base'))return'knowledge';if(r.startsWith('/loyalty')||r.startsWith('/modules/loyalty'))return'loyalty';if(r.startsWith('/marketing'))return'marketing';if(r.startsWith('/webshop'))return'webshop';return''}
function configuredMenu(items:MenuItem[],config:VirCustomization|null):MenuItem[]{return items.flatMap(item=>{const key=menuKey(item);if(key&&!menuEnabled(config,key,true))return[];if(key==='knowledge'&&!featureEnabled(config,'knowledge_base',true))return[];if(norm(item.route).startsWith('/knowledge-base/quiz')&&!featureEnabled(config,'quiz',true))return[];if(key==='loyalty'&&!featureEnabled(config,'loyalty',true))return[];if(key==='webshop'&&!featureEnabled(config,'webshop',true))return[];if(norm(item.route).startsWith('/marketing/wallboard')&&!featureEnabled(config,'wallboard',true))return[];const children=configuredMenu(item.children,config);if(item.children.length&&!children.length&&!item.route)return[];return[{...item,children}]})}
function configuredName(item:MenuItem,config:VirCustomization|null){const key=menuKey(item),labels=config?.labels||{};if(key==='dashboard'&&labels.dashboard)return labels.dashboard;if(key==='employees'&&labels.employees)return labels.employees;if(key==='clients'&&labels.clients)return labels.clients;if(key==='knowledge'&&labels.knowledge)return labels.knowledge;return item.name}

export default function Sidebar({user}:SidebarProps){
 const location=useLocation(),navigate=useNavigate(),{language}=useLanguage(),rk=useMemo(()=>roleList(user?.role),[user?.role]);
 const isCustomer=rk.some(r=>['customer','client','guest','ugyfel','ügyfél','vendeg','vendég'].includes(r));
 const isAccounting=rk.some(r=>['accounting','bookkeeper','konyveles','könyvelés'].includes(r));
 const isAdmin=rk.some(r=>['admin','administrator','rendszergazda','superadmin','super_admin'].includes(r));
 const isManager=rk.some(r=>['manager','vezető','vezeto'].includes(r));
 const isLocationScoped=rk.some(r=>['location_manager','üzletvezető','uzletvezeto','store_manager','branch_manager','szalonvezető','szalonvezeto','salon_manager','receptionist','recepciós','recepcios','reception'].includes(r));
 const isStaff=!isCustomer&&!isAccounting&&!isAdmin&&!isManager&&!isLocationScoped;
 const[menus,setMenus]=useState<MenuItem[]>(FALLBACK),[open,setOpen]=useState<number[]>(()=>isAccounting?[99302,99303,99304]:[]),[vir,setVir]=useState<VirCustomization|null>(()=>readStoredVirCustomization());
 useEffect(()=>{const onVir=(e:Event)=>setVir((e as CustomEvent).detail||readStoredVirCustomization());window.addEventListener(VIR_CUSTOMIZATION_EVENT,onVir);return()=>window.removeEventListener(VIR_CUSTOMIZATION_EVENT,onVir)},[]);
 useEffect(()=>{if(isCustomer||isAccounting||isLocationScoped||isStaff)return;void(async()=>{const token=localStorage.getItem('token')||localStorage.getItem('kleo_token'),config={withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}};try{const r=await axios.get(`${API_BASE}/menus`,config),tree=buildTree(Array.isArray(r.data)?r.data:[],user?.role||null);if(tree.length){setMenus(tree);localStorage.setItem(MENU_CACHE_KEY,JSON.stringify(tree));return}}catch{}try{const p=JSON.parse(localStorage.getItem(MENU_CACHE_KEY)||'null');if(Array.isArray(p)&&p.length)setMenus(p)}catch{}})()},[user,isCustomer,isAccounting,isLocationScoped,isStaff]);
 useEffect(()=>{if(isAccounting)setOpen(p=>Array.from(new Set([...p,99302,99303,99304])));},[isAccounting]);
 const visible=useMemo(()=>{const base=isCustomer?CUSTOMER:isAccounting?ACCOUNTING:isLocationScoped?LOCATION:isStaff?STAFF:menus;let combined=base;if(isAdmin){const extras=[WALLBOARD,SPEC_PARITY,SAAS_ADMIN,VIR_ADMIN].filter(extra=>!base.some(x=>x.route===extra.route));combined=extras.length?[...base,...extras]:base}else if(isManager){const extras=[WALLBOARD,SPEC_PARITY,VIR_ADMIN].filter(extra=>!base.some(x=>x.route===extra.route));combined=extras.length?[...base,...extras]:base}return configuredMenu(combined,vir)},[isCustomer,isAccounting,isLocationScoped,isStaff,isAdmin,isManager,menus,vir]);
 useEffect(()=>{const parents:number[]=[];const walk=(xs:MenuItem[],ps:number[]=[])=>xs.forEach(x=>{if(x.route&&routeActive(x.route,location))parents.push(...ps);if(x.children.length)walk(x.children,[...ps,x.id])});walk(visible);if(parents.length)setOpen(p=>Array.from(new Set([...p,...parents])))},[location.pathname,location.search,visible]);
 const dateSelect=(d:Date)=>{const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;navigate(`/appointments/calendar?date=${s}`)};
 const subtitle=isAccounting?(language==='en'?'Accounting workspace':'Könyvelési felület'):isCustomer?(language==='en'?'Customer account':'Ügyfélfiók'):isLocationScoped?(language==='en'?'Salon workspace':'Szalon felület'):isStaff?(language==='en'?'Staff workspace':'Munkatársi felület'):(language==='en'?'Admin workspace':'Admin felület');
 const logo=String(vir?.brand?.logo_url||'').trim()||Logo,brand=String(vir?.brand?.name||'Kleoszalon');
 return <aside className={`kleo-sidebar app-sidebar ${isAccounting?'is-accounting-sidebar':''}`}><div className="kleo-sidebar-hero-card"><div className="kleo-sidebar-header"><div className="kleo-sidebar-logo-wrap"><img src={logo} alt={brand} className="kleo-sidebar-logo"/></div><div className="kleo-sidebar-brand"><div className="kleo-sidebar-title">{brand}</div><div className="kleo-sidebar-subtitle">{subtitle}</div></div></div>{!isAccounting&&!isStaff&&!isCustomer&&<SidebarCalendar onSelectDate={dateSelect}/>}</div><nav className="kleo-sidebar-nav"><ul className="kleo-sidebar-menu">{visible.map(m=>{const has=m.children.length>0,expanded=open.includes(m.id),displayName=configuredName(m,vir);return <li key={m.id} className={`kleo-sidebar-menu-item ${expanded?'kleo-sidebar-menu-item--open':''}`}>{has?<button type="button" onClick={()=>setOpen(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])} className="kleo-sidebar-menu-button"><Icon name={m.icon}/><span className="kleo-sidebar-menu-label">{translateMenuLabel(displayName,language)}</span><span className="kleo-sidebar-menu-chevron">{expanded?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</span></button>:<NavLink to={norm(m.route)} className={()=>`kleo-sidebar-menu-button kleo-sidebar-menu-link ${routeActive(m.route,location)?'active':''}`}><Icon name={m.icon}/><span className="kleo-sidebar-menu-label">{translateMenuLabel(displayName,language)}</span></NavLink>}{has&&expanded&&<ul className="kleo-sidebar-submenu">{m.children.map(c=><li key={c.id}><NavLink to={norm(c.route)} className={()=>`kleo-sidebar-submenu-item ${routeActive(c.route,location)?'active':''}`}>{translateMenuLabel(configuredName(c,vir),language)}</NavLink></li>)}</ul>}</li>})}</ul></nav></aside>
}
function buildTree(raw:RawMenuItem[],role:any):MenuItem[]{const rs=roleList(role),see=(r?:string|null)=>!r||r==='all'||r==='*'||rs.includes('admin')||rs.includes(String(r).toLowerCase()),f=raw.filter(x=>see(x.required_role)),sort=(a:RawMenuItem,b:RawMenuItem)=>(a.order_index??9999)-(b.order_index??9999);if(f.some(x=>Array.isArray(x.submenus))){const n=(x:RawMenuItem):MenuItem=>({id:x.id,name:x.name,icon:x.icon||undefined,route:x.route||undefined,children:(x.submenus||[]).sort(sort).map(n)});return f.sort(sort).map(n)}const map=new Map<number,MenuItem&{parent_id:number|null}>();f.forEach(x=>map.set(x.id,{id:x.id,name:x.name,icon:x.icon||undefined,route:x.route||undefined,parent_id:x.parent_id??null,children:[]}));const roots:Array<MenuItem&{parent_id:number|null}>=[];map.forEach(x=>x.parent_id&&map.has(x.parent_id)?map.get(x.parent_id)!.children.push(x):roots.push(x));return roots.sort((a,b)=>a.id-b.id)}