import React,{useEffect,useMemo,useState} from "react";
import {ArrowRightLeft,CheckCircle2,Clock3,FileDown,History,LockKeyhole,Printer,RefreshCw,UnlockKeyhole,Users} from "lucide-react";
import api from "../../api";
import {hasStoredRole} from "../../utils/roles";
import "./CashRegisterShiftPanel.css";

type AnyRow=Record<string,any>;
type CurrentState={shift:AnyRow|null;totals:AnyRow|null;handovers:AnyRow[];pending_handover:AnyRow|null;latest_report:AnyRow|null};
type Props={onChanged?:()=>void|Promise<void>;onShiftStatusChange?:(open:boolean)=>void};
const HUF=(v:any)=>`${Math.round(Number(v||0)).toLocaleString("hu-HU")} Ft`;
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const dt=(v:any)=>v?new Date(v).toLocaleString("hu-HU"):"—";
const esc=(v:any)=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]||m));

export default function CashRegisterShiftPanel({onChanged,onShiftStatusChange}:Props){
 const locationId=localStorage.getItem("kleo_location_id")||"";
 const locationName=localStorage.getItem("kleo_location_name")||"";
 const today=localDate();
 const isManager=hasStoredRole(["admin","location_manager","salon_manager"]);
 const isAdmin=hasStoredRole(["admin"]);
 const[state,setState]=useState<CurrentState>({shift:null,totals:null,handovers:[],pending_handover:null,latest_report:null});
 const[openingCash,setOpeningCash]=useState(0),[openingNote,setOpeningNote]=useState("");
 const[toCashier,setToCashier]=useState(""),[handoverCount,setHandoverCount]=useState(0),[handoverNote,setHandoverNote]=useState("");
 const[acceptCount,setAcceptCount]=useState(0),[acceptNote,setAcceptNote]=useState("");
 const[closeCount,setCloseCount]=useState(0),[closeNote,setCloseNote]=useState("");
 const[history,setHistory]=useState<AnyRow[]>([]),[historySummary,setHistorySummary]=useState<any>(null),[from,setFrom]=useState(`${new Date().getFullYear()}-01-01`),[to,setTo]=useState(today),[allLocations,setAllLocations]=useState(false);
 const[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");

 const active=!!state.shift&&state.shift.status!=="closed";
 const pending=state.shift?.status==="handover_pending";
 const expected=Number(state.totals?.expected_cash||0);
 const closeDifference=Number(closeCount||0)-expected;
 const acceptedHandovers=useMemo(()=>state.handovers.filter(h=>h.status==="accepted"),[state.handovers]);

 async function loadCurrent(){
  if(!locationId){setState({shift:null,totals:null,handovers:[],pending_handover:null,latest_report:null});onShiftStatusChange?.(false);return}
  setLoading(true);setError("");
  try{
   const r=await api.get(`/api/transactions/cashier/shift/current?date=${today}&location_id=${encodeURIComponent(locationId)}`);
   const next=r.data||{};setState(next);onShiftStatusChange?.(!!next.shift&&next.shift.status==="open");
   if(next.totals?.expected_cash!=null){setHandoverCount(Number(next.totals.expected_cash));setCloseCount(Number(next.totals.expected_cash));}
   if(next.pending_handover?.expected_cash!=null)setAcceptCount(Number(next.pending_handover.expected_cash));
  }catch(e:any){setError(e?.response?.data?.message||"A pénztári műszak nem tölthető be.")}
  finally{setLoading(false)}
 }
 async function loadHistory(){
  if(!isManager)return;
  try{
   const loc=isAdmin&&allLocations?"":locationId;
   const q=[`from=${encodeURIComponent(from)}`,`to=${encodeURIComponent(to)}`,loc?`location_id=${encodeURIComponent(loc)}`:""].filter(Boolean).join("&");
   const r=await api.get(`/api/transactions/cashier/shift-history?${q}`);setHistory(r.data?.rows||[]);setHistorySummary(r.data?.summary||null);
  }catch(e:any){setError(e?.response?.data?.message||"A vezetői kasszatörténet nem tölthető be.")}
 }
 useEffect(()=>{void loadCurrent()},[locationId]);
 useEffect(()=>{if(isManager)void loadHistory()},[locationId,allLocations]);
 async function changed(){await loadCurrent();if(isManager)await loadHistory();await onChanged?.()}

 async function openShift(){
  if(!locationId)return setError("Válassz telephelyet.");setLoading(true);setError("");setNotice("");
  try{await api.post("/api/transactions/cashier/shift/open",{location_id:locationId,location_name:locationName||null,business_date:today,opening_cash:Number(openingCash||0),opening_note:openingNote||null});setNotice("A pénztári műszak megnyitva, a nyitópénz rögzítve.");await changed()}
  catch(e:any){setError(e?.response?.data?.message||"A pénztári műszak nem nyitható meg.")}finally{setLoading(false)}
 }
 async function startHandover(){
  if(!state.shift)return;if(!toCashier.trim())return setError("Add meg az átvevő pénztárost.");setLoading(true);setError("");setNotice("");
  try{await api.post(`/api/transactions/cashier/shift/${state.shift.id}/handover`,{location_id:locationId,to_cashier:toCashier.trim(),counted_cash:Number(handoverCount||0),note:handoverNote||null});setNotice("Az átadás rögzítve. Az átvevő pénztárosnak el kell fogadnia.");await changed()}
  catch(e:any){setError(e?.response?.data?.message||"Az átadás nem rögzíthető.")}finally{setLoading(false)}
 }
 async function acceptHandover(){
  const h=state.pending_handover;if(!state.shift||!h)return;setLoading(true);setError("");setNotice("");
  try{await api.post(`/api/transactions/cashier/shift/${state.shift.id}/handovers/${h.id}/accept`,{location_id:locationId,counted_cash:Number(acceptCount||0),note:acceptNote||null});setNotice("Az átadás-átvétel elfogadva. Az új pénztáros aktív.");setToCashier("");setHandoverNote("");setAcceptNote("");await changed()}
  catch(e:any){setError(e?.response?.data?.message||"Az átvétel nem fogadható el.")}finally{setLoading(false)}
 }
 async function cancelHandover(){
  const h=state.pending_handover;if(!state.shift||!h)return;const reason=window.prompt("Az átadás megszakításának indoka:","Téves átadás");if(!reason?.trim())return;setLoading(true);
  try{await api.post(`/api/transactions/cashier/shift/${state.shift.id}/handovers/${h.id}/cancel`,{location_id:locationId,reason:reason.trim()});setNotice("A függő átadás megszakítva.");await changed()}
  catch(e:any){setError(e?.response?.data?.message||"Az átadás nem szakítható meg.")}finally{setLoading(false)}
 }
 async function closeShift(){
  if(!state.shift)return;setLoading(true);setError("");setNotice("");
  try{const r=await api.post(`/api/transactions/cashier/shift/${state.shift.id}/close`,{location_id:locationId,counted_cash:Number(closeCount||0),note:closeNote||null});setNotice(`A pénztár lezárva. Jegyzőkönyv: ${r.data?.report?.report_no||"elkészült"}.`);setCloseNote("");await changed()}
  catch(e:any){setError(e?.response?.data?.message||"A pénztári műszak nem zárható le.")}finally{setLoading(false)}
 }
 async function reportDetail(id:any){const loc=locationId?`?location_id=${encodeURIComponent(locationId)}`:"";const r=await api.get(`/api/transactions/cashier/shift-reports/${id}${loc}`);return r.data}
 async function openPdf(id:any){
  try{const loc=locationId?`?location_id=${encodeURIComponent(locationId)}`:"";const r=await api.get(`/api/transactions/cashier/shift-reports/${id}/pdf${loc}`,{responseType:"blob"});const url=URL.createObjectURL(new Blob([r.data],{type:"application/pdf"}));window.open(url,"_blank","noopener,noreferrer");setTimeout(()=>URL.revokeObjectURL(url),60000)}
  catch(e:any){setError(e?.response?.data?.message||"A PDF nem nyitható meg.")}
 }
 async function printReport(id:any){
  try{
   const d=await reportDetail(id),r=d.report||{},hs=d.handovers||[];
   const rows=[["Nyitópénz",r.opening_cash],["Készpénzes értékesítés",r.cash_sales],["Bankkártya",r.card_sales],["Átutalás",r.transfer_sales],["Utalvány",r.voucher_sales],["Egyéb fizetés",r.other_sales],["Kasszabevét",r.cash_in],["Kasszakivét",r.cash_out],["Várt készpénz",r.expected_cash],["Megszámolt készpénz",r.counted_cash],["Eltérés",r.difference]];
   const w=window.open("","_blank","width=900,height=1100");if(!w)return setError("A böngésző blokkolta a nyomtatási ablakot.");
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.report_no)}</title><style>body{font-family:Arial,sans-serif;color:#241c29;padding:36px}h1{font-size:22px;color:#4c2f69}small{color:#777}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:20px 0}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0}.total{font-weight:700;font-size:16px}.handover{padding:10px 0;border-bottom:1px solid #eee}.sign{margin-top:50px;display:grid;grid-template-columns:1fr 1fr;gap:50px}.line{border-top:1px solid #333;padding-top:6px;text-align:center}@media print{button{display:none}}</style></head><body><h1>KLEOPÁTRA – PÉNZTÁRZÁRÁSI JEGYZŐKÖNYV</h1><small>${esc(r.report_no)} · ${esc(r.business_date_key||r.business_date)}</small><div class="grid"><div><b>Telephely:</b> ${esc(r.location_name||r.location_id)}</div><div><b>Üzleti nap:</b> ${esc(r.business_date_key||r.business_date)}</div><div><b>Nyitotta:</b> ${esc(r.opened_by)}</div><div><b>Nyitás:</b> ${esc(dt(r.opened_at))}</div><div><b>Zárta:</b> ${esc(r.closed_by)}</div><div><b>Zárás:</b> ${esc(dt(r.closed_at))}</div></div>${rows.map(([l,v],i)=>`<div class="row ${i>=8?'total':''}"><span>${esc(l)}</span><b>${esc(HUF(v))}</b></div>`).join("")}<h3>Átadás-átvételek</h3>${hs.length?hs.map((h:any)=>`<div class="handover"><b>${esc(h.from_cashier)} → ${esc(h.to_cashier)}</b><br><small>${esc(dt(h.handed_over_at))} · várt ${esc(HUF(h.expected_cash))} · átadó ${esc(HUF(h.counted_cash))} · átvevő ${esc(HUF(h.accepted_counted_cash))}</small></div>`).join(""):"<p>Nem történt pénztáros átadás-átvétel.</p>"}<p><b>Zárási megjegyzés:</b> ${esc(r.close_note||"—")}</p><div class="sign"><div class="line">Pénztáros</div><div class="line">Ellenőrző / vezető</div></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
  }catch(e:any){setError(e?.response?.data?.message||"A jegyzőkönyv nem nyomtatható.")}
 }

 const latest=state.latest_report;
 return <section className="crs-shell">
  <header className="crs-head"><div><span className="crs-eyebrow">PÉNZTÁRI MŰSZAK</span><h2>Műszak, átadás-átvétel és zárás</h2><p>{today} · {locationName||"Válassz telephelyet"}</p></div><button onClick={()=>void changed()} disabled={loading}><RefreshCw size={16}/> Frissítés</button></header>
  <div className="crs-flow"><span className={active?"done":""}>1. Műszaknyitás</span><span className={active?"done":""}>2. Nyitópénz</span><span className={acceptedHandovers.length?"done":pending?"active":""}>3. Átadás-átvétel</span><span className={latest?"done":""}>4. Zárási jegyzőkönyv</span><span className={latest?"done":""}>5. Nyomtatás / PDF</span><span className={isManager?"active":""}>6. Vezetői történet</span></div>
  {error&&<div className="crs-alert error">{error}</div>}{notice&&<div className="crs-alert ok">{notice}</div>}
  {!locationId?<div className="crs-empty">A pénztári műszak kezeléséhez válassz telephelyet.</div>:!active?<div className="crs-open-card"><div><UnlockKeyhole/><h3>Pénztárnyitás</h3><p>A nyitópénzt a műszak megnyitásakor kell rögzíteni.</p></div><label>Nyitópénz (Ft)<input type="number" min="0" value={openingCash} onChange={e=>setOpeningCash(Number(e.target.value))}/></label><label>Nyitási megjegyzés<input value={openingNote} onChange={e=>setOpeningNote(e.target.value)} placeholder="Váltópénz, előző napi átadás…"/></label><button className="primary" onClick={()=>void openShift()} disabled={loading}><UnlockKeyhole size={16}/> Műszak megnyitása</button></div>:<>
   <div className="crs-kpis"><article><span>Aktív pénztáros</span><b>{state.shift?.current_cashier||"—"}</b></article><article><span>Nyitópénz</span><b>{HUF(state.shift?.opening_cash)}</b></article><article><span>Várt készpénz</span><b>{HUF(expected)}</b></article><article><span>Átadások</span><b>{acceptedHandovers.length}</b></article></div>
   {pending&&state.pending_handover?<div className="crs-pending"><div><Clock3/><h3>Átvételre vár</h3><p>{state.pending_handover.from_cashier} → <b>{state.pending_handover.to_cashier}</b></p><small>Várt {HUF(state.pending_handover.expected_cash)} · átadó számolása {HUF(state.pending_handover.counted_cash)} · eltérés {HUF(state.pending_handover.difference)}</small></div><label>Átvevő által megszámolt készpénz<input type="number" min="0" value={acceptCount} onChange={e=>setAcceptCount(Number(e.target.value))}/></label><label>Átvételi megjegyzés<input value={acceptNote} onChange={e=>setAcceptNote(e.target.value)}/></label><div className="crs-actions"><button onClick={()=>void cancelHandover()} disabled={loading}>Megszakítás</button><button className="primary" onClick={()=>void acceptHandover()} disabled={loading}><CheckCircle2 size={16}/> Átvétel elfogadása</button></div></div>:<div className="crs-two"><div className="crs-card"><ArrowRightLeft/><h3>Pénztáros átadás-átvétel</h3><label>Átvevő pénztáros<input value={toCashier} onChange={e=>setToCashier(e.target.value)} placeholder="Név vagy e-mail"/></label><label>Átadó által megszámolt készpénz<input type="number" min="0" value={handoverCount} onChange={e=>setHandoverCount(Number(e.target.value))}/></label><label>Megjegyzés<input value={handoverNote} onChange={e=>setHandoverNote(e.target.value)}/></label><button onClick={()=>void startHandover()} disabled={loading||!toCashier.trim()}><Users size={16}/> Átadás indítása</button></div><div className="crs-card close"><LockKeyhole/><h3>Műszak és pénztár lezárása</h3><p>Várt készpénz: <b>{HUF(expected)}</b></p><label>Megszámolt készpénz<input type="number" min="0" value={closeCount} onChange={e=>setCloseCount(Number(e.target.value))}/></label><div className={`crs-diff ${closeDifference===0?"ok":closeDifference<0?"neg":"pos"}`}>Aktuális eltérés: <b>{HUF(closeDifference)}</b></div><label>Zárási megjegyzés<input value={closeNote} onChange={e=>setCloseNote(e.target.value)} placeholder="Eltérés oka, átadás, banki befizetés…"/></label><button className="primary" onClick={()=>void closeShift()} disabled={loading}><LockKeyhole size={16}/> Zárás és jegyzőkönyv</button></div></div>}
  </>}
  {latest&&<div className="crs-report"><div><CheckCircle2/><span>UTOLSÓ ZÁRÁS</span><h3>{latest.report_no}</h3><p>{latest.location_name||latest.location_id} · {latest.business_date_key||latest.business_date} · eltérés <b>{HUF(latest.difference)}</b></p></div><div className="crs-actions"><button onClick={()=>void printReport(latest.id)}><Printer size={16}/> Nyomtatás</button><button className="primary" onClick={()=>void openPdf(latest.id)}><FileDown size={16}/> PDF</button></div></div>}
  {isManager&&<div className="crs-history"><header><div><History/><h3>Vezetői kasszatörténet</h3></div><div className="crs-history-filter"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" value={to} onChange={e=>setTo(e.target.value)}/>{isAdmin&&<label className="check"><input type="checkbox" checked={allLocations} onChange={e=>setAllLocations(e.target.checked)}/> Minden telephely</label>}<button onClick={()=>void loadHistory()}>Mutasd</button></div></header>{historySummary&&<div className="crs-history-kpis"><span>Zárások <b>{historySummary.days||0}</b></span><span>Készpénzes forgalom <b>{HUF(historySummary.cash_sales)}</b></span><span>Kártyás forgalom <b>{HUF(historySummary.card_sales)}</b></span><span>Összes eltérés <b>{HUF(historySummary.difference)}</b></span></div>}<div className="crs-table-wrap"><table><thead><tr><th>Nap</th><th>Telephely</th><th>Jegyzőkönyv</th><th>Nyitotta</th><th>Zárta</th><th>Várt</th><th>Számolt</th><th>Eltérés</th><th></th></tr></thead><tbody>{history.map(r=><tr key={r.id}><td>{r.business_date_key||r.business_date}</td><td>{r.location_name||r.location_id}</td><td><b>{r.report_no}</b></td><td>{r.opened_by}</td><td>{r.closed_by}</td><td>{HUF(r.expected_cash)}</td><td>{HUF(r.counted_cash)}</td><td className={Number(r.difference)===0?"ok":Number(r.difference)<0?"neg":"pos"}>{HUF(r.difference)}</td><td><button title="Nyomtatás" onClick={()=>void printReport(r.id)}><Printer size={14}/></button><button title="PDF" onClick={()=>void openPdf(r.id)}><FileDown size={14}/></button></td></tr>)}{!history.length&&<tr><td colSpan={9} className="empty">Nincs zárási jegyzőkönyv a kiválasztott időszakban.</td></tr>}</tbody></table></div></div>}
 </section>
}
