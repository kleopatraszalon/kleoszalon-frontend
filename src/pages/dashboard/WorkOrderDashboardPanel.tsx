import React,{useEffect,useMemo,useState}from"react";
import{Link}from"react-router-dom";
import{apiFetch}from"../../utils/api";

type WorkOrderSummary={
  scope?:{kind?:string;role?:string;can_edit?:boolean;location_id?:string|null};
  stats?:{total?:number;open?:number;completed?:number;archived?:number;completed_value?:number|string};
  recent?:Array<{id:string;work_order_number?:string;title?:string;status?:string;created_at?:string;location_name?:string;client_name?:string;employee_name?:string}>;
};

const statusHu=(status?:string)=>({waiting:"Új",arrived:"Megérkezett",in_progress:"Folyamatban",completed:"Lezárt",cancelled:"Lemondott",no_show:"Nem jelent meg"}as Record<string,string>)[status||""]||status||"—";

function scopeLabel(kind?:string){
  if(kind==="all")return"Összes szalon";
  if(kind==="location")return"Saját szalon";
  if(kind==="employee")return"Saját munkalapok";
  if(kind==="customer")return"Saját munkalapok";
  return"Jogosultság szerinti nézet";
}

function amount(value:unknown){const n=Number(value||0);return Number.isFinite(n)?new Intl.NumberFormat("hu-HU",{style:"currency",currency:"HUF",maximumFractionDigits:0}).format(n):"0 Ft"}

export default function WorkOrderDashboardPanel(){
  const[data,setData]=useState<WorkOrderSummary|null>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{setData(await apiFetch<WorkOrderSummary>("/api/workorders/dashboard/summary"))}
    catch(reason:any){setData(null);setError(reason?.message||"A munkalap-összesítő nem tölthető be.")}
    finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[]);
  const recent=useMemo(()=>(data?.recent||[]).slice(0,5),[data]);
  const stats=data?.stats||{};

  return <section style={{margin:"0 24px 18px",border:"1px solid #e7e0d6",borderRadius:18,background:"#fff",overflow:"hidden"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #eee7df",flexWrap:"wrap"}}>
      <div><h2 style={{margin:0,fontSize:18}}>Munkalapok</h2><div style={{fontSize:12,color:"#74695f",marginTop:4}}>{scopeLabel(data?.scope?.kind)} · a jogosultság szerinti élő adatok</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{data?.scope?.can_edit&&<Link to="/workorders/new" style={primaryLink}>+ Új munkalap</Link>}<Link to="/workorders" style={secondaryLink}>Munkalapok megnyitása</Link></div>
    </div>
    {loading?<div style={{padding:18}}>Munkalapok betöltése…</div>:error?<div style={{padding:18,color:"#b42318",display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span>{error}</span><button type="button" onClick={()=>void load()} style={retryButton}>Újrapróbálás</button></div>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(135px,1fr))",gap:10,padding:14}}>
        <Metric label="Összes" value={Number(stats.total||0).toLocaleString("hu-HU")}/><Metric label="Nyitott" value={Number(stats.open||0).toLocaleString("hu-HU")}/><Metric label="Lezárt" value={Number(stats.completed||0).toLocaleString("hu-HU")}/><Metric label="Archivált" value={Number(stats.archived||0).toLocaleString("hu-HU")}/><Metric label="Lezárt érték" value={amount(stats.completed_value)}/>
      </div>
      <div style={{borderTop:"1px solid #eee7df",padding:"0 14px 12px"}}>
        <div style={{fontWeight:800,fontSize:13,padding:"12px 2px 8px"}}>Legutóbbi munkalapok</div>
        {recent.length===0?<div style={{fontSize:13,color:"#74695f",padding:"4px 2px 10px"}}>Nincs megjeleníthető munkalap.</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr><th style={th}>Munkalap</th><th style={th}>Szalon</th><th style={th}>Vendég</th><th style={th}>Munkatárs</th><th style={th}>Státusz</th></tr></thead><tbody>{recent.map(row=><tr key={row.id}><td style={td}><Link to={`/workorders/${row.id}`} style={{fontWeight:800}}>{row.work_order_number||row.title||row.id.slice(0,8)}</Link></td><td style={td}>{row.location_name||"—"}</td><td style={td}>{row.client_name||"—"}</td><td style={td}>{row.employee_name||"—"}</td><td style={td}>{statusHu(row.status)}</td></tr>)}</tbody></table></div>}
      </div>
    </>}
  </section>
}

function Metric({label,value}:{label:string;value:string}){return <div style={{border:"1px solid #eee7df",borderRadius:13,padding:"11px 12px",minWidth:0}}><div style={{fontSize:11,color:"#74695f",fontWeight:700,textTransform:"uppercase",letterSpacing:.35}}>{label}</div><div style={{fontSize:20,fontWeight:900,marginTop:4,overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div></div>}

const th:React.CSSProperties={textAlign:"left",padding:"7px 6px",color:"#74695f",borderBottom:"1px solid #eee7df",whiteSpace:"nowrap"};
const td:React.CSSProperties={padding:"8px 6px",borderBottom:"1px solid #f3eee8",whiteSpace:"nowrap"};
const primaryLink:React.CSSProperties={textDecoration:"none",background:"#2b2118",color:"#fff",borderRadius:9,padding:"8px 11px",fontSize:12,fontWeight:800};
const secondaryLink:React.CSSProperties={textDecoration:"none",border:"1px solid #d8cec4",color:"#2b2118",borderRadius:9,padding:"8px 11px",fontSize:12,fontWeight:800,background:"#fff"};
const retryButton:React.CSSProperties={border:"1px solid #f04438",background:"#fff",color:"#b42318",borderRadius:8,padding:"7px 10px",fontWeight:800,cursor:"pointer"};
