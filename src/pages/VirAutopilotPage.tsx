import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, CalendarClock, CircleDollarSign, PackageCheck, RefreshCw, ShieldAlert, Sparkles, Workflow } from "lucide-react";
import { getLocations, type LocationRow } from "../api/locations";
import {
  approveWave1,
  createWorkflow,
  getClientBrief,
  getDeposits,
  getProfitEngine,
  getRecipes,
  getWave1Preview,
  getWorkflowActions,
  getWorkflowEvents,
  getWorkflows,
  prepareWave1,
  processWorkflows,
  saveRecipe,
  setDepositStatus,
  type Wave1Preview,
} from "../api/virAutopilot";
import { fetchJSON } from "../utils/fetch";

type Tab = "wave1" | "wave2";
type CatalogRow = { id: string; name: string };
type RecipeDraft = { product_id: string; default_quantity: number; unit: string; waste_percent: number; required: boolean; note?: string };

const money = (value: unknown) => new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(value || 0));
const number = (value: unknown) => new Intl.NumberFormat("hu-HU").format(Number(value || 0));
const pct = (value: unknown) => `${Number(value || 0).toFixed(1)}%`;
const dateTime = (value: unknown) => value ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "short" }).format(new Date(String(value))) : "—";
const normalizeRows = (raw: any): CatalogRow[] => {
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
  return rows.map((row: any) => ({ id: String(row.id || row.service_id || row.product_id || ""), name: String(row.name || row.full_name || row.title || row.id || "") })).filter((row: CatalogRow) => row.id && row.name);
};

function Kpi({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) {
  return <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,.06)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><span style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{label}</span>{icon}</div>
    <div style={{ fontSize: 27, fontWeight: 900, marginTop: 8 }}>{value}</div>
    {sub ? <div style={{ marginTop: 5, color: "#64748b", fontSize: 12 }}>{sub}</div> : null}
  </div>;
}
function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return <section style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(15,23,42,.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}><h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>{right}</div>{children}
  </section>;
}
const th: React.CSSProperties = { textAlign: "left", padding: "9px 10px", fontSize: 12, color: "#64748b", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" };
const button: React.CSSProperties = { border: 0, borderRadius: 10, padding: "9px 13px", fontWeight: 800, cursor: "pointer", background: "#111827", color: "white" };
const secondary: React.CSSProperties = { ...button, background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0" };

export default function VirAutopilotPage() {
  const [tab, setTab] = useState<Tab>("wave1");
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [wave1, setWave1] = useState<Wave1Preview | null>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [profit, setProfit] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowEvents, setWorkflowEvents] = useState<any[]>([]);
  const [workflowActions, setWorkflowActions] = useState<any[]>([]);
  const [services, setServices] = useState<CatalogRow[]>([]);
  const [products, setProducts] = useState<CatalogRow[]>([]);
  const [recipeServiceId, setRecipeServiceId] = useState("");
  const [recipeDraft, setRecipeDraft] = useState<RecipeDraft[]>([]);
  const [clientId, setClientId] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState("No-show utáni visszafoglalás");
  const [workflowEventKey, setWorkflowEventKey] = useState("appointment.status.no_show");

  useEffect(() => {
    getLocations().then((rows) => { setLocations(rows); if (rows[0]?.id) setLocationId((old) => old || rows[0].id); }).catch(() => setLocations([]));
    Promise.all([
      fetchJSON<any>("/api/services", undefined, []),
      fetchJSON<any>("/api/products", undefined, []),
    ]).then(([serviceRows, productRows]) => { setServices(normalizeRows(serviceRows)); setProducts(normalizeRows(productRows)); }).catch(() => undefined);
  }, []);

  const loadWave1 = useCallback(async () => {
    if (!locationId) return;
    const [preview, depositData] = await Promise.all([getWave1Preview(locationId, days), getDeposits(locationId)]);
    setWave1(preview); setDeposits(depositData.deposits || []);
  }, [days, locationId]);

  const loadWave2 = useCallback(async () => {
    if (!locationId) return;
    const [profitData, recipeData, workflowData, eventsData, actionsData] = await Promise.all([
      getProfitEngine(locationId), getRecipes(locationId), getWorkflows(locationId), getWorkflowEvents(locationId), getWorkflowActions(locationId),
    ]);
    setProfit(profitData); setRecipes(recipeData.recipes || []); setWorkflows(workflowData.rules || []); setWorkflowEvents(eventsData.events || []); setWorkflowActions(actionsData.actions || []);
  }, [locationId]);

  const refresh = useCallback(async () => {
    if (!locationId) return; setLoading(true); setError("");
    try { if (tab === "wave1") await loadWave1(); else await loadWave2(); }
    catch (e) { setError(e instanceof Error ? e.message : "A VIR Autopilot betöltése sikertelen."); }
    finally { setLoading(false); }
  }, [loadWave1, loadWave2, locationId, tab]);

  useEffect(() => { if (locationId) void refresh(); }, [locationId, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const wave1Summary: any = wave1?.summary || {};
  const runId = wave1?.run?.id || "";
  const profitSummary: any = profit?.summary || {};
  const recipeServices = useMemo(() => new Set(recipes.filter((r) => r.active !== false).map((r) => String(r.service_id))).size, [recipes]);

  const loadRecipeDraft = async (serviceId: string) => {
    setRecipeServiceId(serviceId); if (!serviceId) { setRecipeDraft([]); return; }
    const data = await getRecipes(locationId, serviceId);
    setRecipeDraft((data.recipes || []).filter((r) => r.active !== false).map((r) => ({ product_id: String(r.product_id), default_quantity: Number(r.default_quantity || 1), unit: String(r.unit || "db"), waste_percent: Number(r.waste_percent || 0), required: r.required !== false, note: r.note || "" })));
  };
  const saveCurrentRecipe = async () => {
    if (!recipeServiceId) return; setLoading(true); setError("");
    try { await saveRecipe(recipeServiceId, recipeDraft); setNotice("A receptúra elmentve. A következő végleges munkalap-zárás ezt az anyagnormát használja."); await loadWave2(); }
    catch (e) { setError(e instanceof Error ? e.message : "A receptúra mentése sikertelen."); }
    finally { setLoading(false); }
  };
  const addRecipeLine = () => setRecipeDraft((rows) => [...rows, { product_id: products[0]?.id || "", default_quantity: 1, unit: "db", waste_percent: 0, required: true }]);

  return <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
    <div style={{ maxWidth: 1500, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div><div style={{ color: "#7c3aed", fontWeight: 900, letterSpacing: ".08em", fontSize: 12 }}>VIR AUTOPILOT</div><h1 style={{ margin: "4px 0 0", fontSize: 32 }}>Vezetői automatizálási központ</h1><p style={{ color: "#64748b", margin: "6px 0 0" }}>Üres kapacitás, vendégmegtartás, profit, anyagfelhasználás és workflow egy helyen.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <label><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Szalon</div><select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={{ padding: 9, borderRadius: 10, border: "1px solid #cbd5e1", minWidth: 210 }}>{locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          {tab === "wave1" ? <label><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Előretekintés</div><select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: 9, borderRadius: 10, border: "1px solid #cbd5e1" }}><option value={3}>3 nap</option><option value={7}>7 nap</option><option value={14}>14 nap</option><option value={30}>30 nap</option></select></label> : null}
          <button style={secondary} onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Frissítés</button>
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button style={tab === "wave1" ? button : secondary} onClick={() => setTab("wave1")}>I. hullám · Naptár & vendégmegtartás</button>
        <button style={tab === "wave2" ? button : secondary} onClick={() => setTab("wave2")}>II. hullám · Profit & automatizálás</button>
      </div>
      {error ? <div style={{ background: "#fff1f2", color: "#be123c", padding: 12, borderRadius: 12, marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div style={{ background: "#ecfdf5", color: "#166534", padding: 12, borderRadius: 12, marginBottom: 14 }}>{notice}</div> : null}

      {tab === "wave1" ? <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginBottom: 16 }}>
          <Kpi label="Üres idősávok" value={number(wave1Summary.gaps)} sub={`${number(wave1Summary.gap_minutes)} perc`} icon={<CalendarClock size={20} />} />
          <Kpi label="Várólista egyezések" value={number(wave1Summary.waitlist_matches)} sub={money(wave1Summary.estimated_waitlist_recoverable_value)} icon={<Sparkles size={20} />} />
          <Kpi label="Emelt no-show kockázat" value={number(wave1Summary.elevated_no_show_clients)} icon={<ShieldAlert size={20} />} />
          <Kpi label="Visszafoglalási jelöltek" value={number(wave1Summary.rebooking_candidates)} sub={`magas churn: ${number(wave1Summary.churn_high_risk)}`} icon={<Bot size={20} />} />
        </div>
        <Panel title="Autopilot döntési sor" right={<div style={{ display: "flex", gap: 8 }}><button style={secondary} disabled={!runId||loading} onClick={async()=>{if(!runId)return;setLoading(true);try{const r=await prepareWave1(locationId,runId);setNotice(`${r.created||0} javaslat előkészítve.`)}catch(e){setError(e instanceof Error?e.message:"Előkészítési hiba") }finally{setLoading(false)}}}>Javaslatok előkészítése</button><button style={button} disabled={!runId||loading} onClick={async()=>{if(!runId)return;setLoading(true);try{const r=await approveWave1(locationId,runId);setNotice(`${r.approved||0} javaslat jóváhagyva.`)}catch(e){setError(e instanceof Error?e.message:"Jóváhagyási hiba")}finally{setLoading(false)}}}>Összes jóváhagyása</button></div>}>
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Munkatárs</th><th style={th}>Üres idősáv</th><th style={th}>Perc</th><th style={th}>Becsült kapacitásérték</th></tr></thead><tbody>{(wave1?.gaps||[]).slice(0,12).map((g:any,i:number)=><tr key={`${g.employee_id}-${g.start}-${i}`}><td style={td}>{g.employee_name}</td><td style={td}>{dateTime(g.start)} → {dateTime(g.end)}</td><td style={td}>{g.minutes}</td><td style={td}>{money(g.estimated_value)}</td></tr>)}</tbody></table></div>
        </Panel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(480px,1fr))", gap: 16, marginTop: 16 }}>
          <Panel title="Intelligens várólista"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Vendég</th><th style={th}>Munkatárs</th><th style={th}>Match</th><th style={th}>Érték</th></tr></thead><tbody>{(wave1?.waitlist_matches||[]).slice(0,15).map((x:any)=><tr key={x.waitlist_id}><td style={td}>{x.client_name||"Vendég"}</td><td style={td}>{x.employee_name}</td><td style={td}>{x.match_score}/100</td><td style={td}>{money(x.estimated_value)}</td></tr>)}</tbody></table></div></Panel>
          <Panel title="AI visszafoglalás / churn"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Vendég</th><th style={th}>Ritmus</th><th style={th}>Késés</th><th style={th}>Churn</th></tr></thead><tbody>{(wave1?.rebooking?.candidates||[]).slice(0,15).map((x:any)=><tr key={x.client_id}><td style={td}>{x.client_name}</td><td style={td}>{x.cadence_days} nap</td><td style={td}>{x.overdue_days} nap</td><td style={td}>{x.churn_score}/100</td></tr>)}</tbody></table></div></Panel>
        </div>
        <Panel title="Dinamikus előlegek" right={<span style={{ fontSize: 12, color: "#64748b" }}>assisted módban követelményként rögzül</span>}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Vendég</th><th style={th}>Időpont</th><th style={th}>Kockázat</th><th style={th}>Előleg</th><th style={th}>Státusz</th><th style={th}></th></tr></thead><tbody>{deposits.slice(0,30).map((d:any)=><tr key={d.id}><td style={td}>{d.client_name||"Vendég"}</td><td style={td}>{dateTime(d.start_time)}</td><td style={td}>{d.risk_score}/100</td><td style={td}>{money(d.amount)} · {pct(d.deposit_percent)}</td><td style={td}>{d.status}</td><td style={td}>{d.status==='required'?<div style={{display:'flex',gap:6}}><button style={secondary} onClick={async()=>{await setDepositStatus(d.id,'paid');await loadWave1()}}>Fizetve</button><button style={secondary} onClick={async()=>{await setDepositStatus(d.id,'waived');await loadWave1()}}>Elengedés</button></div>:null}</td></tr>)}</tbody></table></div></Panel>
      </> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginBottom: 16 }}>
          <Kpi label="Árbevétel" value={money(profitSummary.revenue)} icon={<CircleDollarSign size={20} />} />
          <Kpi label="Hozzájárulási profit" value={money(profitSummary.gross_profit)} sub={`margin ${pct(profitSummary.margin_percent)}`} icon={<CircleDollarSign size={20} />} />
          <Kpi label="Célmargin alatt" value={number(profitSummary.below_target)} sub={`cél: ${pct(profit?.target_margin_percent||35)}`} icon={<ShieldAlert size={20} />} />
          <Kpi label="Receptúrázott szolgáltatások" value={number(recipeServices)} sub={`hiányzó: ${number(profitSummary.missing_recipe)}`} icon={<PackageCheck size={20} />} />
        </div>
        <Panel title="Profit Engine"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Szolgáltatás</th><th style={th}>Árbevétel</th><th style={th}>Anyag</th><th style={th}>Munka</th><th style={th}>Jutalék</th><th style={th}>Profit</th><th style={th}>Margin</th><th style={th}>Profit/perc</th></tr></thead><tbody>{(profit?.services||[]).map((x:any)=><tr key={x.service_id} style={{background:x.below_target?'#fff7ed':undefined}}><td style={td}>{x.service_name}{!x.recipe_complete?<div style={{fontSize:11,color:'#b45309'}}>nincs receptúra</div>:null}</td><td style={td}>{money(x.revenue)}</td><td style={td}>{money(x.material_cost)}</td><td style={td}>{money(x.labor_cost)}</td><td style={td}>{money(x.commission_cost)}</td><td style={td}><strong>{money(x.gross_profit)}</strong></td><td style={td}>{pct(x.margin_percent)}</td><td style={td}>{money(x.profit_per_minute)}</td></tr>)}</tbody></table></div></Panel>

        <Panel title="Szolgáltatás-receptúra" right={<button style={secondary} onClick={addRecipeLine}>+ Anyagsor</button>}>
          <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap',marginBottom:12}}><label><div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Szolgáltatás</div><select value={recipeServiceId} onChange={(e)=>void loadRecipeDraft(e.target.value)} style={{padding:9,borderRadius:10,border:'1px solid #cbd5e1',minWidth:280}}><option value="">Válasszon…</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button style={button} disabled={!recipeServiceId||loading} onClick={()=>void saveCurrentRecipe()}>Receptúra mentése</button></div>
          {recipeDraft.length===0?<div style={{color:'#64748b'}}>Nincs aktív anyagsor. A szolgáltatás lezárásakor csak a közvetlenül felvett termékek fogynak.</div>:<div style={{display:'grid',gap:8}}>{recipeDraft.map((r,index)=><div key={`${r.product_id}-${index}`} style={{display:'grid',gridTemplateColumns:'minmax(220px,2fr) 110px 90px 110px auto',gap:8,alignItems:'center'}}><select value={r.product_id} onChange={e=>setRecipeDraft(rows=>rows.map((x,i)=>i===index?{...x,product_id:e.target.value}:x))} style={{padding:8,border:'1px solid #cbd5e1',borderRadius:8}}><option value="">Termék…</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" step="0.001" min="0.001" value={r.default_quantity} onChange={e=>setRecipeDraft(rows=>rows.map((x,i)=>i===index?{...x,default_quantity:Number(e.target.value)}:x))} style={{padding:8,border:'1px solid #cbd5e1',borderRadius:8}}/><input value={r.unit} onChange={e=>setRecipeDraft(rows=>rows.map((x,i)=>i===index?{...x,unit:e.target.value}:x))} style={{padding:8,border:'1px solid #cbd5e1',borderRadius:8}}/><label style={{fontSize:12}}>Veszteség %<input type="number" min="0" max="100" value={r.waste_percent} onChange={e=>setRecipeDraft(rows=>rows.map((x,i)=>i===index?{...x,waste_percent:Number(e.target.value)}:x))} style={{width:'100%',padding:7,border:'1px solid #cbd5e1',borderRadius:8}}/></label><button style={secondary} onClick={()=>setRecipeDraft(rows=>rows.filter((_,i)=>i!==index))}>Törlés</button></div>)}</div>}
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(480px,1fr))", gap: 16, marginTop: 16 }}>
          <Panel title="AI Client Brief"><div style={{display:'flex',gap:8,marginBottom:12}}><input placeholder="Ügyfél UUID" value={clientId} onChange={e=>setClientId(e.target.value)} style={{flex:1,padding:9,border:'1px solid #cbd5e1',borderRadius:9}}/><button style={button} disabled={!clientId} onClick={async()=>{setLoading(true);try{setBrief(await getClientBrief(clientId,true))}catch(e){setError(e instanceof Error?e.message:'Client Brief hiba')}finally{setLoading(false)}}}>Brief készítése</button></div>{brief?<div style={{display:'grid',gap:9}}><strong>{brief.brief?.summary}</strong><div><b>Preferenciák:</b> {(brief.brief?.preferences||[]).join(', ')||'—'}</div><div><b>Visszafoglalás:</b> {brief.brief?.rebooking_hint||'—'}</div><div><b>Lehetőség:</b> {(brief.brief?.upsell_opportunities||[]).join(', ')||'—'}</div><div style={{fontSize:12,color:'#64748b'}}>AI: {brief.ai_used?'igen':'fallback'} · cache: {brief.cache_hit?'igen':'nem'}</div></div>:<div style={{color:'#64748b'}}>Válasszon ügyfelet UUID alapján; a brief nem használ szabad szöveges kezelési jegyzeteket.</div>}</Panel>
          <Panel title="Workflow Engine" right={<Workflow size={20}/>}><div style={{display:'grid',gap:8}}><input value={workflowName} onChange={e=>setWorkflowName(e.target.value)} placeholder="Szabály neve" style={{padding:9,border:'1px solid #cbd5e1',borderRadius:9}}/><input value={workflowEventKey} onChange={e=>setWorkflowEventKey(e.target.value)} placeholder="event_key" style={{padding:9,border:'1px solid #cbd5e1',borderRadius:9}}/><div style={{display:'flex',gap:8}}><button style={button} onClick={async()=>{await createWorkflow({name:workflowName,event_key:workflowEventKey,location_id:locationId,mode:'advisory',conditions:{},actions:[{type:'workflow_task',title:workflowName}]});setNotice('Workflow szabály létrehozva.');await loadWave2()}}>Szabály létrehozása</button><button style={secondary} onClick={async()=>{const r=await processWorkflows();setNotice(`${r.events||0} esemény feldolgozva, ${r.actions||0} akció.`);await loadWave2()}}>Függő események futtatása</button></div><div style={{fontSize:13,color:'#64748b'}}>Aktív szabályok: {workflows.filter(x=>x.active).length} · események: {workflowEvents.length} · akciók: {workflowActions.length}</div>{workflows.slice(0,8).map(w=><div key={w.id} style={{padding:'8px 10px',background:'#f8fafc',borderRadius:9,display:'flex',justifyContent:'space-between'}}><span><b>{w.name}</b><br/><small>{w.event_key} · {w.mode}</small></span><span>{w.active?'Aktív':'Kikapcsolva'}</span></div>)}</div></Panel>
        </div>
      </>}
    </div>
  </div>;
}
