import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const money = (v: unknown) => `${Math.round(Number(v || 0)).toLocaleString("hu-HU")} Ft`;
const dt = (v: unknown) => v ? new Date(String(v)).toLocaleString("hu-HU", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const cycle = (name: string) => {
  const n = String(name || "").toLowerCase();
  if (/gél|géllakk|manik|köröm|pedik/.test(n)) return { min: 21, max: 28, label: "21–28 nap" };
  if (/hajfest|tőfest|balayage|melír|szők/.test(n)) return { min: 35, max: 56, label: "35–56 nap" };
  if (/fodrász|hajvág|friz/.test(n)) return { min: 28, max: 42, label: "28–42 nap" };
  if (/szempilla|szemöldök/.test(n)) return { min: 21, max: 35, label: "21–35 nap" };
  if (/kozmetik|arckez|tisztít/.test(n)) return { min: 28, max: 42, label: "28–42 nap" };
  if (/masszázs/.test(n)) return { min: 14, max: 28, label: "14–28 nap" };
  return { min: 45, max: 70, label: "45–70 nap" };
};

type AutomationMode = "advisory" | "assisted";
type Policy = {
  highRiskThreshold: number;
  depositPercent: number;
  waitlistFirst: boolean;
  rebookingEnabled: boolean;
  mediumRiskReminder: boolean;
};

type QueueItem = {
  key: string;
  kind: "waitlist" | "risk" | "rebooking" | "reminder";
  score: number;
  title: string;
  detail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  locationId: string | null;
  payload: Record<string, unknown>;
};

const DEFAULT_POLICY: Policy = {
  highRiskThreshold: 55,
  depositPercent: 20,
  waitlistFirst: true,
  rebookingEnabled: true,
  mediumRiskReminder: true,
};

function readMode(): AutomationMode {
  const value = localStorage.getItem("booking-v4-automation-mode");
  return value === "assisted" ? "assisted" : "advisory";
}
function readPolicy(): Policy {
  try {
    const raw = localStorage.getItem("booking-v4-automation-policy");
    return raw ? { ...DEFAULT_POLICY, ...JSON.parse(raw) } : DEFAULT_POLICY;
  } catch {
    return DEFAULT_POLICY;
  }
}

const CSS = String.raw`
.bi{max-width:1540px;margin:0 auto;padding:0 26px 46px}.bih{display:flex;justify-content:space-between;align-items:end;margin:18px 0 12px;gap:12px}.bih h2{margin:0}.bih p{margin:4px 0;color:#746a64;font-size:12px}.bikpi{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:12px}.bik{background:#fff;border:1px solid #e8dfd8;border-radius:14px;padding:13px}.bik b{display:block;font-size:24px;margin-top:4px}.bigrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bic{background:#fff;border:1px solid #e8dfd8;border-radius:15px;padding:15px}.birow{display:grid;grid-template-columns:1.4fr .8fr .8fr auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid #eee8e2;font-size:12px}.tag{display:inline-flex;padding:3px 7px;border-radius:999px;background:#f3eee9;font-size:10px;font-weight:800}.danger{background:#ffe9e9}.warn{background:#fff2d6}.ok{background:#e9f7ed}.info{background:#eaf1ff}.bi button,.bi select,.bi input{border:1px solid #ddd3cc;border-radius:9px;padding:8px 10px;background:#fff;font-weight:700}.bi button{cursor:pointer}.bi button.primary{background:#2f241f;color:#fff;border-color:#2f241f}.bi button:disabled{opacity:.45;cursor:not-allowed}.binote{font-size:11px;color:#70655f;background:#f8f4f0;border-radius:9px;padding:9px}.command,.automation{grid-column:1/-1;border:2px solid #e2d4ca}.command h3,.automation h3{margin-bottom:5px}.cmdrow{display:grid;grid-template-columns:auto 1.5fr 1fr 1fr auto;gap:9px;align-items:center;padding:10px 0;border-top:1px solid #eee8e2;font-size:12px}.score{font-size:18px;font-weight:900}.loss{font-size:20px;font-weight:900}.policy{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.policy>div{background:#faf7f4;border-radius:10px;padding:10px;font-size:11px}.autohead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.autogrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.autokpi{background:#faf7f4;border-radius:10px;padding:10px;font-size:11px}.autokpi b{display:block;font-size:20px;margin-top:3px}.settings{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.setting{border:1px solid #eee5df;border-radius:10px;padding:10px;font-size:11px}.setting label{display:block;font-weight:800;margin-bottom:6px}.setting input[type=number]{width:100%;box-sizing:border-box}.switch{display:flex;gap:7px;align-items:center}.queue{max-height:460px;overflow:auto}.queueRow{display:grid;grid-template-columns:auto 1.4fr .6fr 1fr auto;gap:9px;align-items:center;padding:10px 0;border-top:1px solid #eee8e2;font-size:12px}.safety{border-left:4px solid #c38e52;padding-left:10px}.modeButtons{display:flex;gap:6px;flex-wrap:wrap}.modeButtons button.active{background:#2f241f;color:#fff}.toast{margin:8px 0;padding:9px 11px;border-radius:9px;background:#e9f7ed;font-size:12px;font-weight:700}@media(max-width:1100px){.bikpi,.autogrid{grid-template-columns:1fr 1fr}.bigrid{grid-template-columns:1fr}.birow,.cmdrow,.queueRow{grid-template-columns:1fr 1fr}.command,.automation{grid-column:auto}.policy,.settings{grid-template-columns:1fr}.autohead{display:block}}
`;

export default function BookingV4IntelligencePanel() {
  const [data, setData] = useState<any>({ summary: {}, no_show_risks: [], waitlist_matches: [], rebooking_candidates: [] });
  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<AutomationMode>(() => readMode());
  const [policy, setPolicy] = useState<Policy>(() => readPolicy());
  const [queued, setQueued] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [i, o] = await Promise.all([
        api.get(`/admin/booking-v4/intelligence${locationId ? `?location_id=${locationId}` : ""}`),
        api.get("/admin/booking-v4/overview?days=30"),
      ]);
      setData(i.data || {});
      setLocations(o.data?.locations || []);
      setError("");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Betöltési hiba");
    }
  }, [locationId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { localStorage.setItem("booking-v4-automation-mode", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("booking-v4-automation-policy", JSON.stringify(policy)); }, [policy]);

  const high = useMemo(() => data.no_show_risks?.filter((x: any) => Number(x.risk_score || 0) >= policy.highRiskThreshold) || [], [data, policy.highRiskThreshold]);
  const protectedRevenue = useMemo(() => Math.round((data.waitlist_matches || []).reduce((s: number, x: any) => s + Number(x.offer_price || 0), 0)), [data]);

  const command = useMemo(() => {
    const items: any[] = [];
    (data.no_show_risks || []).filter((x: any) => x.risk_level !== "low").forEach((x: any) => items.push({
      key: `risk-${x.id}`, score: x.risk_level === "high" ? 95 : 65, type: "Foglalási kockázat", title: x.client_name,
      detail: `${x.location_name} · ${dt(x.start_time)}`, impact: x.risk_level === "high" ? "Előleg / megerősítés" : "Emlékeztető",
      entity: x.id, location: x.location_id, payload: { risk_score: x.risk_score },
    }));
    (data.waitlist_matches || []).forEach((x: any) => {
      const hours = (new Date(x.start_time).getTime() - Date.now()) / 3600000;
      const score = Math.max(55, Math.min(99, Math.round(95 - hours + Math.max(0, 100 - Number(x.priority || 100)) / 10)));
      items.push({ key: `wait-${x.waitlist_id}-${x.offer_id}`, score, type: "Várólista találat", title: x.client_name,
        detail: `${x.service_name} · ${dt(x.start_time)}`, impact: `${money(x.offer_price)} bevétel védhető`, entity: x.waitlist_id,
        waitlist: true, payload: { offer_id: x.offer_id, priority_score: score } });
    });
    (data.rebooking_candidates || []).forEach((x: any) => {
      const c = cycle(x.service_name); const over = Math.max(0, Number(x.days_since_visit) - c.max);
      if (over > 0) items.push({ key: `re-${x.client_id}-${x.service_id}`, score: Math.min(90, 55 + over), type: "Visszahívás", title: x.client_name,
        detail: `${x.service_name} · ciklus ${c.label}`, impact: `${x.days_since_visit} napja járt`, entity: x.client_id, location: x.location_id,
        payload: { service_id: x.service_id, cycle: c.label, days_since_visit: x.days_since_visit } });
    });
    return items.sort((a, b) => b.score - a.score).slice(0, 30);
  }, [data]);

  const automationQueue = useMemo<QueueItem[]>(() => {
    const items: QueueItem[] = [];
    if (policy.waitlistFirst) {
      (data.waitlist_matches || []).forEach((x: any) => {
        const hours = Math.max(0, (new Date(x.start_time).getTime() - Date.now()) / 3600000);
        const score = Math.max(60, Math.min(99, Math.round(98 - hours)));
        items.push({ key: `auto-wait-${x.waitlist_id}-${x.offer_id}`, kind: "waitlist", score, title: x.client_name,
          detail: `${x.service_name} · ${x.location_name} · ${dt(x.start_time)}`, action: "Várólistás ajánlat előkészítése",
          entityType: "waitlist", entityId: x.waitlist_id, locationId: x.location_id || null,
          payload: { offer_id: x.offer_id, service_name: x.service_name, offer_price: x.offer_price, start_time: x.start_time, channel_status: "not_configured" } });
      });
    }
    (data.no_show_risks || []).forEach((x: any) => {
      const risk = Number(x.risk_score || 0);
      if (risk >= policy.highRiskThreshold) {
        items.push({ key: `auto-risk-${x.id}`, kind: "risk", score: Math.min(99, 70 + Math.round(risk / 3)), title: x.client_name,
          detail: `${x.location_name} · ${dt(x.start_time)} · kockázat ${risk}%`, action: `${policy.depositPercent}% előleg + megerősítés előkészítése`,
          entityType: "appointment", entityId: x.id, locationId: x.location_id || null,
          payload: { risk_score: risk, deposit_percent: policy.depositPercent, action: "deposit_and_confirmation", channel_status: "not_configured" } });
      } else if (policy.mediumRiskReminder && risk >= 25) {
        items.push({ key: `auto-rem-${x.id}`, kind: "reminder", score: 60 + Math.round(risk / 4), title: x.client_name,
          detail: `${x.location_name} · ${dt(x.start_time)} · kockázat ${risk}%`, action: "Megerősítő emlékeztető előkészítése",
          entityType: "appointment", entityId: x.id, locationId: x.location_id || null,
          payload: { risk_score: risk, action: "confirmation_reminder", channel_status: "not_configured" } });
      }
    });
    if (policy.rebookingEnabled) {
      (data.rebooking_candidates || []).forEach((x: any) => {
        const c = cycle(x.service_name); const days = Number(x.days_since_visit || 0); if (days < c.max) return;
        items.push({ key: `auto-re-${x.client_id}-${x.service_id}`, kind: "rebooking", score: Math.min(92, 55 + (days - c.max)), title: x.client_name,
          detail: `${x.service_name} · ${days} napja · ciklus ${c.label}`, action: "Újrafoglalási ajánlat előkészítése",
          entityType: "client", entityId: x.client_id, locationId: x.location_id || null,
          payload: { service_id: x.service_id, service_name: x.service_name, cycle: c.label, days_since_visit: days, channel_status: "not_configured" } });
      });
    }
    return items.sort((a, b) => b.score - a.score).slice(0, 60);
  }, [data, policy]);

  const automationSummary = useMemo(() => ({
    total: automationQueue.length,
    urgent: automationQueue.filter(x => x.score >= 85).length,
    waitlist: automationQueue.filter(x => x.kind === "waitlist").length,
    deposits: automationQueue.filter(x => x.kind === "risk").length,
    rebooking: automationQueue.filter(x => x.kind === "rebooking").length,
  }), [automationQueue]);

  async function log(actionType: string, entityType: string, entityId: string | null, entityLocationId: string | null, payload: Record<string, unknown>) {
    await api.post("/admin/booking-v4/intelligence/actions", { action_type: actionType, entity_type: entityType, entity_id: entityId, location_id: entityLocationId, payload });
  }
  async function markMatched(waitlistId: string) {
    await api.patch(`/admin/booking-v4/waitlist/${waitlistId}`, { status: "matched" });
    await load();
  }
  async function queueItem(item: QueueItem) {
    setBusy(item.key); setNotice("");
    try {
      await log("automation_queued", item.entityType, item.entityId, item.locationId, { ...item.payload, queue_kind: item.kind, score: item.score, automation_mode: mode, safe_mode: true });
      setQueued(prev => new Set(prev).add(item.key));
      setNotice("A művelet auditált előkészítési sorba került. Külső üzenet nem ment ki.");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A művelet nem állítható sorba.");
    } finally { setBusy(null); }
  }
  async function queueTop() {
    const targets = automationQueue.filter(x => x.score >= 85 && !queued.has(x.key)).slice(0, 10);
    setBusy("bulk"); setNotice("");
    try {
      for (const item of targets) {
        await log("automation_queued", item.entityType, item.entityId, item.locationId, { ...item.payload, queue_kind: item.kind, score: item.score, automation_mode: mode, safe_mode: true, bulk: true });
      }
      setQueued(prev => new Set([...prev, ...targets.map(x => x.key)]));
      setNotice(`${targets.length} sürgős tétel auditált előkészítési sorba került. Külső küldés nem történt.`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A tömeges előkészítés megszakadt.");
    } finally { setBusy(null); }
  }

  return <section className="bi"><style>{CSS}</style>
    <div className="bih"><div><h2>Booking Intelligence & Command Center</h2><p>Napi teendők, no-show védelem, várólista, Last Minute, újrafoglalás, automatizálás és bevételvédelem egy helyen.</p></div><div><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Minden szalon</option>{locations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select> <button onClick={() => void load()}>Frissítés</button></div></div>
    {error && <div className="binote">{error}</div>}{notice && <div className="toast">{notice}</div>}
    <div className="bikpi"><div className="bik">Magas no-show<b>{high.length}</b></div><div className="bik">Közepes kockázat<b>{data.summary?.medium_no_show_risk || 0}</b></div><div className="bik">Aktív várólista<b>{data.summary?.waitlist_entries || 0}</b></div><div className="bik">Azonnali találat<b>{data.summary?.waitlist_matches || 0}</b></div><div className="bik">Újrafoglalható<b>{data.summary?.rebooking_candidates || 0}</b></div><div className="bik">Védhető bevétel<b className="loss">{money(protectedRevenue)}</b></div></div>
    <div className="bigrid">
      <div className="bic automation"><div className="autohead"><div><h3>Booking Automation Center</h3><p className="binote safety"><b>Fail-safe mód:</b> az automatizmus jelenleg előkészít és auditál, de nem küld SMS-t/e-mailt és nem terhel előleget. Külső végrehajtás csak külön kommunikációs/fizetési csatorna konfigurálása után kapcsolható be.</p></div><div className="modeButtons"><button className={mode === "advisory" ? "active" : ""} onClick={() => setMode("advisory")}>Csak javaslat</button><button className={mode === "assisted" ? "active" : ""} onClick={() => setMode("assisted")}>Félautomata előkészítés</button></div></div>
        <div className="autogrid"><div className="autokpi">Feldolgozható tétel<b>{automationSummary.total}</b></div><div className="autokpi">Sürgős ≥85<b>{automationSummary.urgent}</b></div><div className="autokpi">Várólista ajánlat<b>{automationSummary.waitlist}</b></div><div className="autokpi">Előlegjavaslat<b>{automationSummary.deposits}</b></div><div className="autokpi">Rebooking<b>{automationSummary.rebooking}</b></div></div>
        <div className="settings"><div className="setting"><label>Magas kockázati küszöb</label><input type="number" min={40} max={90} value={policy.highRiskThreshold} onChange={e => setPolicy(p => ({ ...p, highRiskThreshold: Math.max(40, Math.min(90, Number(e.target.value || 55))) }))}/><small>%</small></div><div className="setting"><label>Javasolt előleg</label><input type="number" min={0} max={100} step={5} value={policy.depositPercent} onChange={e => setPolicy(p => ({ ...p, depositPercent: Math.max(0, Math.min(100, Number(e.target.value || 0))) }))}/><small>%</small></div><div className="setting"><label className="switch"><input type="checkbox" checked={policy.waitlistFirst} onChange={e => setPolicy(p => ({ ...p, waitlistFirst: e.target.checked }))}/> Várólista-first</label><small>Last Minute előtt várólista.</small></div><div className="setting"><label className="switch"><input type="checkbox" checked={policy.mediumRiskReminder} onChange={e => setPolicy(p => ({ ...p, mediumRiskReminder: e.target.checked }))}/> Közepes kockázat</label><small>Emlékeztető előkészítése.</small></div><div className="setting"><label className="switch"><input type="checkbox" checked={policy.rebookingEnabled} onChange={e => setPolicy(p => ({ ...p, rebookingEnabled: e.target.checked }))}/> Rebooking</label><small>Szolgáltatásciklus alapján.</small></div></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8}}><div className="binote">A beállítások ezen a munkaállomáson maradnak meg; minden sorba állítás a szerveroldali Intelligence auditba kerül.</div><button className="primary" disabled={busy === "bulk" || !automationSummary.urgent} onClick={() => void queueTop()}>Sürgős tételek előkészítése</button></div>
        <div className="queue">{!automationQueue.length && <p>Nincs automatizálható tétel.</p>}{automationQueue.map(item => <div className="queueRow" key={item.key}><span className={`tag ${item.score >= 85 ? "danger" : item.score >= 65 ? "warn" : "info"}`}>{item.kind}</span><div><b>{item.title}</b><br/><small>{item.detail}</small></div><div className="score">{item.score}</div><div>{item.action}</div><button disabled={queued.has(item.key) || busy === item.key || mode === "advisory"} onClick={() => void queueItem(item)}>{queued.has(item.key) ? "Előkészítve" : mode === "advisory" ? "Javaslat" : "Előkészítés"}</button></div>)}</div>
      </div>
      <div className="bic command"><h3>Mai teendők – Booking Command Center</h3><div className="binote">A lista üzleti prioritás szerint rendezi a beavatkozásokat. Először a közeli üres kapacitást és a magas no-show kockázatot kezeli, utána a visszahívást.</div>{!command.length && <p>Nincs azonnali beavatkozást igénylő tétel.</p>}{command.map((x: any) => <div className="cmdrow" key={x.key}><span className={`tag ${x.score >= 85 ? "danger" : x.score >= 65 ? "warn" : "info"}`}>{x.type}</span><div><b>{x.title}</b><br/><small>{x.detail}</small></div><div className="score">{x.score} pont</div><div>{x.impact}</div>{x.waitlist ? <button onClick={() => void markMatched(x.entity)}>Találat elfogadása</button> : <button onClick={() => void log("command_center_reviewed", x.type === "Visszahívás" ? "client" : "appointment", x.entity, x.location, x.payload).then(load)}>Intézve</button>}</div>)}</div>
      <div className="bic"><h3>No-show kockázat és előlegpolitika</h3><div className="binote">A kockázat döntéstámogatás. A rendszer nem tilt automatikusan vendéget.</div>{!(data.no_show_risks || []).length && <p>Nincs közelgő foglalás.</p>}{(data.no_show_risks || []).slice(0, 30).map((x: any) => <div className="birow" key={x.id}><div><b>{x.client_name}</b><br/><small>{x.location_name} · {dt(x.start_time)}</small></div><div><span className={`tag ${Number(x.risk_score || 0) >= policy.highRiskThreshold ? "danger" : x.risk_level === "medium" ? "warn" : "ok"}`}>{x.risk_score}%</span></div><div>{Number(x.risk_score || 0) >= policy.highRiskThreshold ? `${policy.depositPercent}% előleg + megerősítés` : x.risk_level === "medium" ? "Automatikus emlékeztető" : "Normál folyamat"}</div><button onClick={() => void log("risk_reviewed", "appointment", x.id, x.location_id, { risk_score: x.risk_score, deposit_percent: policy.depositPercent }).then(load)}>Ellenőrizve</button></div>)}</div>
      <div className="bic"><h3>Várólista × Last Minute</h3><div className="binote">Last Minute kedvezmény előtt először várólista-match: azonos szalon + szolgáltatás + időablak + szakemberpreferencia.</div>{!(data.waitlist_matches || []).length && <p>Nincs automatikus találat.</p>}{(data.waitlist_matches || []).slice(0, 30).map((x: any) => { const hours = (new Date(x.start_time).getTime() - Date.now()) / 3600000; const score = Math.max(55, Math.min(99, Math.round(95 - hours + Math.max(0, 100 - Number(x.priority || 100)) / 10))); return <div className="birow" key={`${x.waitlist_id}-${x.offer_id}`}><div><b>{x.client_name}</b><br/><small>{x.service_name} · {x.location_name}</small></div><div>{dt(x.start_time)}<br/><span className="tag info">prioritás {score}</span></div><div>{money(x.offer_price)} · -{x.discount_percent}%</div><button onClick={() => void markMatched(x.waitlist_id)}>Elfogadás</button></div>; })}</div>
      <div className="bic"><h3>Dinamikus újrafoglalási ciklus</h3><div className="binote">Nem minden szolgáltatás kap azonos 45–70 napos szabályt: a javaslat a szolgáltatás természetes visszatérési ciklusához igazodik.</div>{!(data.rebooking_candidates || []).length && <p>Nincs jelölt.</p>}{(data.rebooking_candidates || []).slice(0, 30).map((x: any) => { const c = cycle(x.service_name); const due = x.days_since_visit >= c.max; return <div className="birow" key={`${x.client_id}-${x.service_id}`}><div><b>{x.client_name}</b><br/><small>{x.service_name} · {x.location_name}</small></div><div>{x.days_since_visit} napja</div><div><span className={`tag ${due ? "warn" : "ok"}`}>{c.label} · {due ? "esedékes" : "figyelendő"}</span></div><button onClick={() => void log("rebooking_candidate_reviewed", "client", x.client_id, x.location_id, { service_id: x.service_id, last_visit: x.last_visit, cycle: c.label, due }).then(load)}>Megjelölés</button></div>; })}</div>
      <div className="bic"><h3>Bevételvédelem és működési szabályok</h3><p className="binote">A jelenlegi várólista-találatokból közvetlenül védhető becsült bevétel: <b>{money(protectedRevenue)}</b>. Ez nem könyvelt árbevétel, hanem az aktuális ajánlati árak összege.</p><div className="policy"><div><b>1. Várólista-first</b><br/>Last Minute kedvezmény előtt mindig meglévő várólista ellenőrzése.</div><div><b>2. Kockázatalapú előleg</b><br/>Csak magas no-show kockázatnál javasolt; közepesnél emlékeztető.</div><div><b>3. Dinamikus ciklus</b><br/>Köröm 21–28, hajfestés 35–56, hajvágás 28–42 nap; szolgáltatásfüggő visszahívás.</div></div><p><b>Aktuális magas kockázat:</b> {high.length} foglalás · <b>Mai prioritásos teendő:</b> {command.length} tétel · <b>Automation queue:</b> {automationSummary.total}.</p></div>
    </div>
  </section>;
}
