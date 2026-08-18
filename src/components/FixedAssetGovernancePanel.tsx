import React,{useCallback,useEffect,useMemo,useState}from"react";
import{AlertTriangle,CheckCircle2,RefreshCw,ShieldCheck}from"lucide-react";
import api from"../api";
import{hasStoredRole}from"../utils/roles";
import"./FixedAssetGovernancePanel.css";

type Row=Record<string,any>;

export default function FixedAssetGovernancePanel(){
 const[data,setData]=useState<Row|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const locationId=localStorage.getItem("kleo_location_id")||"";
 const approver=hasStoredRole(["accounting","bookkeeper","konyveles","könyvelés","admin","administrator","rendszergazda","superadmin","super_admin"]);
 const url=`/fixed-assets/governance/readiness${locationId?`?location_id=${encodeURIComponent(locationId)}`:""}`;
 const load=useCallback(async()=>{setLoading(true);setError("");try{setData((await api.get(url)).data)}catch(e:any){setError(e?.response?.data?.message||"A tárgyi eszköz könyvelési készültsége nem tölthető be.")}finally{setLoading(false)}},[url]);
 useEffect(()=>{void load()},[load]);
 const unmapped=useMemo(()=>data?.chart_of_accounts?.rows?.filter((r:Row)=>r.mapping_status!=="approved"||!String(r.external_account_code||"").trim())||[],[data]);
 const review=useMemo(()=>data?.assets?.rows?.filter((r:Row)=>r.depreciation_policy_status!=="approved")||[],[data]);

 async function mapAccount(row:Row){
  const value=window.prompt(`${row.code} · ${row.name}\nAdja meg a Kleoszalon tényleges főkönyvi számlaszámát:`,row.external_account_code||"");
  if(value===null)return;const external=value.trim();if(!external){setError("A tényleges főkönyvi számlaszám nem lehet üres.");return}
  const note=window.prompt("Leképezés megjegyzése / számlatükör-verzió (opcionális):",row.mapping_note||"");
  try{await api.put(`/fixed-assets/governance/chart/${encodeURIComponent(row.code)}`,{external_account_code:external,mapping_note:note||null});setNotice(`${row.code} leképezése jóváhagyva.`);await load()}
  catch(e:any){setError(e?.response?.data?.message||"A számlatükör-leképezés nem sikerült.")}
 }
 async function approveAsset(row:Row){
  if(!window.confirm(`${row.asset_code} · ${row.name}\nJóváhagyja a hasznos élettartamot, maradványértéket, TAO-adatokat és a gyártói karbantartási periódust?`))return;
  try{await api.post(`/fixed-assets/governance/assets/${row.id}/approve`,locationId?{location_id:locationId}:{});setNotice(`${row.asset_code} számviteli/TAO politikája jóváhagyva.`);await load()}
  catch(e:any){setError(e?.response?.data?.message||"Az eszköz jóváhagyása nem sikerült.")}
 }

 if(!data&&!error)return <section className="fa-governance loading"><RefreshCw size={18}/><span>Könyvelési készültség ellenőrzése…</span></section>;
 return <section className={`fa-governance ${data?.posting_ready?"ready":"blocked"}`}>
  <div className="fa-governance-head"><div className="fa-governance-title">{data?.posting_ready?<CheckCircle2 size={22}/>:<ShieldCheck size={22}/>}<div><b>Könyvelési aktiválási kapu</b><span>{data?.posting_ready?"Minden kötelező számlatükör- és eszközpolitikai adat jóváhagyva.":"A hiányos tételek lezárásáig az aktiválás / amortizáció könyvelése blokkolt."}</span></div></div><button onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/>{loading?"Frissítés…":"Ellenőrzés"}</button></div>
  {error&&<div className="fa-governance-message error"><AlertTriangle size={16}/>{error}</div>}{notice&&<div className="fa-governance-message ok"><CheckCircle2 size={16}/>{notice}</div>}
  <div className="fa-governance-kpis"><article><span>FA-* számlák</span><b>{data?.chart_of_accounts?.mapped||0}/{data?.chart_of_accounts?.total||0}</b><small>{data?.chart_of_accounts?.unmapped||0} nincs leképezve</small></article><article><span>Eszközpolitika</span><b>{data?.assets?.approved||0}/{data?.assets?.total||0}</b><small>{data?.assets?.needs_review||0} felülvizsgálandó</small></article><article><span>Gyártói karbantartás</span><b>{Math.max(0,Number(data?.assets?.total||0)-Number(data?.assets?.maintenance_source_missing||0))}/{data?.assets?.total||0}</b><small>{data?.assets?.maintenance_source_missing||0} hiányos</small></article><article><span>TAO / VTSZ</span><b>{Math.max(0,Number(data?.assets?.total||0)-Number(data?.assets?.tao_missing||0))}/{data?.assets?.total||0}</b><small>{data?.assets?.tao_missing||0} hiányos</small></article></div>
  {(unmapped.length>0||review.length>0)&&<div className="fa-governance-grid">
   <div><h3>Hiányzó számlatükör-leképezések</h3>{unmapped.length?unmapped.map((r:Row)=><div className="fa-governance-row" key={r.code}><div><b>{r.code}</b><span>{r.name}</span></div>{approver?<button onClick={()=>void mapAccount(r)}>Főkönyvi számlaszám</button>:<em>Könyvelői jóváhagyás kell</em>}</div>):<p className="fa-governance-empty">Minden FA-* számla leképezve.</p>}</div>
   <div><h3>Jóváhagyásra váró eszközök</h3>{review.length?review.slice(0,20).map((r:Row)=><div className="fa-governance-row asset" key={r.id}><div><b>{r.asset_code} · {r.name}</b><span>{r.policy_review_reason||"Számviteli/TAO/karbantartási felülvizsgálat szükséges."}</span><small>{!r.useful_life_months?"Élettartam hiányzik · ":""}{!r.tax_classification||r.tax_depreciation_rate==null?"TAO hiányos · ":""}{!r.maintenance_source_approved_ready?"gyártói karbantartás hiányos":""}</small></div>{approver?<button onClick={()=>void approveAsset(r)}>Jóváhagyás</button>:<em>Könyvelői jóváhagyás kell</em>}</div>):<p className="fa-governance-empty">Minden eszközpolitika jóváhagyva.</p>}</div>
  </div>}
 </section>;
}