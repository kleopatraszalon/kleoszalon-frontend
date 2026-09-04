import React,{useCallback,useEffect,useMemo,useState}from"react";
import{Building2,CheckCircle2,CreditCard,KeyRound,Layers3,MapPin,RefreshCw,ShieldCheck,UsersRound}from"lucide-react";
import api from"../api/api";
import"./TenantSettingsPage.css";

type Tenant={tenant_id?:string;id?:string;slug:string;name:string;legal_name?:string|null;status:string;default_locale?:string;default_currency?:string;timezone?:string;plan_code?:string|null;plan_name?:string|null;plan_features?:Record<string,boolean>|null;subscription_status?:string|null;current_period_end?:string|null;cancel_at_period_end?:boolean;grace_period_end?:string|null;last_payment_status?:string|null;app_name?:string|null;custom_domain?:string|null};
type FeatureOverride={feature_key:string;enabled:boolean;config?:Record<string,unknown>};
type Location={id:string;name:string;city?:string|null;address?:string|null;is_active?:boolean};
type Subscription={id?:string;status?:string;starts_at?:string;trial_ends_at?:string|null;current_period_end?:string|null;cancel_at_period_end?:boolean;grace_period_end?:string|null;last_payment_status?:string|null;plan_code?:string;plan_name?:string;monthly_price?:number|string;currency?:string;features?:Record<string,boolean>};
type ContextResponse={tenant?:Tenant;tenant_role?:string;feature_overrides?:FeatureOverride[]};

type TabKey="general"|"locations"|"users"|"roles"|"modules"|"subscription"|"security";
const TABS:Array<{key:TabKey;label:string;icon:React.ElementType}>=[
 {key:"general",label:"Általános",icon:Building2},{key:"locations",label:"Telephelyek",icon:MapPin},{key:"users",label:"Felhasználók",icon:UsersRound},{key:"roles",label:"Szerepkörök",icon:KeyRound},{key:"modules",label:"Modulok",icon:Layers3},{key:"subscription",label:"Előfizetés",icon:CreditCard},{key:"security",label:"Biztonság",icon:ShieldCheck},
];
const MODULE_LABELS:Record<string,string>={all_modules:"Minden VIR modul",booking:"Foglalás",crm:"Vendégek / CRM",hr:"HR",inventory:"Készlet és beszerzés",finance:"Pénzügy",marketing:"Marketing",franchise:"Franchise",mobile_app:"Mobilalkalmazás",white_label:"White label",api:"API hozzáférés"};
const dt=(value?:string|null)=>value?new Intl.DateTimeFormat("hu-HU",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value)):"—";
const money=(value?:number|string,currency="HUF")=>new Intl.NumberFormat("hu-HU",{style:"currency",currency,maximumFractionDigits:0}).format(Number(value||0));
const errorText=(e:any)=>e?.response?.data?.error||e?.message||"A tenant beállításai nem tölthetők be.";

export default function TenantSettingsPage(){
 const[tab,setTab]=useState<TabKey>("general");
 const[context,setContext]=useState<ContextResponse>({});
 const[locations,setLocations]=useState<Location[]>([]);
 const[subscription,setSubscription]=useState<Subscription|null>(null);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{
  const[ctx,loc,sub]=await Promise.all([api.get("/saas/context"),api.get("/saas/locations"),api.get("/saas/subscription")]);
  setContext(ctx.data||{});setLocations(Array.isArray(loc.data?.rows)?loc.data.rows:[]);setSubscription(sub.data?.subscription||null);
 }catch(e){setError(errorText(e))}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const tenant=context.tenant;
 const role=String(context.tenant_role||"member");
 const owner=["owner","admin"].includes(role.toLowerCase());
 const features=useMemo(()=>{
  const plan:Record<string,boolean>={...(tenant?.plan_features||subscription?.features||{})};
  for(const row of context.feature_overrides||[])plan[row.feature_key]=Boolean(row.enabled);
  return Object.entries(plan).sort(([a],[b])=>a.localeCompare(b,"hu"));
 },[context.feature_overrides,subscription?.features,tenant?.plan_features]);
 const activeLocations=locations.filter(x=>x.is_active!==false).length;

 return <main className="tenantset-page">
  <header className="tenantset-hero"><div><small>KLEOPÁTRA VIR · TENANT CONTROL CENTER</small><h1><Building2/>Tenant beállítások</h1><p>A szervezet, telephelyek, jogosultságok, modulok és előfizetés egyetlen tenant-környezetben. Ezen az oldalon nincs tenant-választó: mindig a bejelentkezett felhasználó hiteles tenantja látható.</p></div><button onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?"spin":""}/>{loading?"Frissítés…":"Frissítés"}</button></header>
  {error&&<div className="tenantset-error">{error}</div>}
  <section className="tenantset-kpis"><article><Building2/><div><small>Tenant</small><b>{tenant?.name||"—"}</b><span>{tenant?.slug||"—"}</span></div></article><article><MapPin/><div><small>Aktív telephely</small><b>{activeLocations}</b><span>{locations.length} összesen</span></div></article><article><Layers3/><div><small>Csomag</small><b>{tenant?.plan_name||subscription?.plan_name||"—"}</b><span>{tenant?.subscription_status||subscription?.status||"—"}</span></div></article><article><ShieldCheck/><div><small>Tenant szerepkör</small><b>{role}</b><span>{owner?"Adminisztráció engedélyezett":"Megtekintési szint"}</span></div></article></section>
  <nav className="tenantset-tabs" aria-label="Tenant beállítási szekciók">{TABS.map(item=>{const Icon=item.icon;return <button key={item.key} className={tab===item.key?"active":""} onClick={()=>setTab(item.key)}><Icon/>{item.label}</button>})}</nav>

  {tab==="general"&&<section className="tenantset-panel"><h2>Általános tenant adatok</h2><p className="lead">A tenant a VIR legfelső szervezeti és adatbiztonsági határa. A telephelyek ennek alárendelt egységei.</p><div className="tenantset-grid">
   <Info label="Szervezet neve" value={tenant?.name}/><Info label="Jogi név" value={tenant?.legal_name}/><Info label="Tenant azonosító" value={tenant?.slug}/><Info label="Tenant ID" value={tenant?.tenant_id||tenant?.id}/><Info label="Állapot" value={tenant?.status}/><Info label="Időzóna" value={tenant?.timezone}/><Info label="Pénznem" value={tenant?.default_currency}/><Info label="Nyelv / locale" value={tenant?.default_locale}/><Info label="Alkalmazásnév" value={tenant?.app_name}/><Info label="Egyedi domain" value={tenant?.custom_domain}/>
  </div></section>}

  {tab==="locations"&&<section className="tenantset-panel"><h2>Telephelyek</h2><p className="lead">Egy tenant több telephelyet tartalmazhat. A telephely nem külön tenant, ezért a tenant-szintű vezetői összesítések biztonságosan összevonhatók.</p><div className="tenantset-table"><table><thead><tr><th>Telephely</th><th>Város</th><th>Cím</th><th>Állapot</th></tr></thead><tbody>{locations.length?locations.map(row=><tr key={row.id}><td><b>{row.name}</b><small>{row.id}</small></td><td>{row.city||"—"}</td><td>{row.address||"—"}</td><td><Status ok={row.is_active!==false} yes="Aktív" no="Inaktív"/></td></tr>):<tr><td colSpan={4}>Nincs tenant-telephely.</td></tr>}</tbody></table></div></section>}

  {tab==="users"&&<section className="tenantset-panel"><h2>Felhasználók</h2><p className="lead">A tenant-tagság határozza meg, hogy egy felhasználó melyik szervezet adataihoz férhet hozzá. A munkatársi funkciójogokat a VIR hozzáférés-kezelője kezeli.</p><div className="tenantset-callout"><UsersRound/><div><b>Tenant-hozzáférés és munkatársi jogosultságok</b><p>Az aktuális felhasználó tenant szerepköre: <strong>{role}</strong>. Munkatársankénti menü-, főoldal- és funkciójogosultságok a VIR jogosultságkezelő felületén kezelhetők.</p><a href="/settings/roles">Hozzáférések kezelése →</a></div></div></section>}

  {tab==="roles"&&<section className="tenantset-panel"><h2>Szerepkörök</h2><p className="lead">A VIR két külön védelmi réteget használ: tenant-szerepkör a szervezeti határhoz, üzleti szerepkör a napi funkciókhoz.</p><div className="tenantset-rolegrid"><Role title="owner / admin" text="Tenant szintű adminisztráció, előfizetés és központi beállítások."/><Role title="manager" text="Vezetői operáció és riportok a saját jogosultsági körben."/><Role title="member" text="Normál tenant-tagság; a konkrét funkciókat a munkatársi RBAC adja."/></div><a className="tenantset-link" href="/settings/roles">Munkatársi szerepkörök és funkciók →</a></section>}

  {tab==="modules"&&<section className="tenantset-panel"><h2>Modulok</h2><p className="lead">Az effektív modulállapot a csomag funkcióiból és a tenant-specifikus felülírásokból áll össze.</p><div className="tenantset-modules">{features.length?features.map(([key,enabled])=><article key={key}><div><b>{MODULE_LABELS[key]||key}</b><small>{key}</small></div><Status ok={Boolean(enabled)} yes="Engedélyezve" no="Kikapcsolva"/></article>):<p>Nincs deklarált moduljogosultság.</p>}</div></section>}

  {tab==="subscription"&&<section className="tenantset-panel"><h2>Előfizetés</h2><p className="lead">A tenant életciklusa és a hozzá tartozó SaaS csomag külön van kezelve a platform-adminisztrációtól.</p><div className="tenantset-grid"><Info label="Csomag" value={subscription?.plan_name||tenant?.plan_name}/><Info label="Csomagkód" value={subscription?.plan_code||tenant?.plan_code}/><Info label="Előfizetés állapota" value={subscription?.status||tenant?.subscription_status}/><Info label="Havidíj" value={subscription?money(subscription.monthly_price,subscription.currency):"—"}/><Info label="Próba vége" value={dt(subscription?.trial_ends_at)}/><Info label="Aktuális időszak vége" value={dt(subscription?.current_period_end||tenant?.current_period_end)}/><Info label="Fizetés állapota" value={subscription?.last_payment_status||tenant?.last_payment_status}/><Info label="Időszak végén lemondás" value={(subscription?.cancel_at_period_end||tenant?.cancel_at_period_end)?"Igen":"Nem"}/></div>{!owner&&<div className="tenantset-note">Az előfizetés módosításához tenant owner/admin jogosultság szükséges.</div>}</section>}

  {tab==="security"&&<section className="tenantset-panel"><h2>Biztonság és adatleválasztás</h2><p className="lead">A tenant-védelem szerveroldali. A frontend elrejtése önmagában nem jogosultsági mechanizmus.</p><div className="tenantset-security"><Security title="Explicit tenant-kontextus" text="A felhasználó tenantja aktív tenant-tagságból vagy hiteles munkatársi/telephely-kapcsolatból származik."/><Security title="Fail-closed feloldás" text="Ha nincs bizonyítható tenant-hozzáférés, a rendszer nem választ alapértelmezett tenantot."/><Security title="Telephely-határ" text="Más tenant telephelyazonosítója nem használható adatlekéréshez."/><Security title="Modulkapu" text="A csomagból és tenant feature override-ból számított moduljog szerveroldalon is érvényesül."/></div></section>}
 </main>;
}

function Info({label,value}:{label:string;value?:React.ReactNode}){return <div className="tenantset-info"><small>{label}</small><b>{value===undefined||value===null||value===""?"—":value}</b></div>}
function Status({ok,yes,no}:{ok:boolean;yes:string;no:string}){return <span className={`tenantset-status ${ok?"ok":"off"}`}>{ok&&<CheckCircle2/>}{ok?yes:no}</span>}
function Role({title,text}:{title:string;text:string}){return <article><KeyRound/><div><b>{title}</b><p>{text}</p></div></article>}
function Security({title,text}:{title:string;text:string}){return <article><ShieldCheck/><div><b>{title}</b><p>{text}</p></div></article>}
