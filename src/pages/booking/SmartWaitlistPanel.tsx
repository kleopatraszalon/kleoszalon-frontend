import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing, CalendarClock, CalendarDays, CheckCircle2, Clock3, Plus, RefreshCw,
  Save, Search, Sparkles, UserRoundCheck, Users, X, XCircle,
} from "lucide-react";
import "./SmartWaitlistPanel.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";
const SMART_API = `${API_BASE}/transactions/booking-operations/smart-waitlist`;

type Candidate = {
  id: string; client_name: string; phone?: string | null; email?: string | null;
  service_names?: string; score: number; priority_level?: number; created_at: string;
  score_breakdown?: Record<string, number>;
};
type Offer = {
  id: string; waitlist_id: string; expires_at: string; notification_status?: string;
  client_name?: string; phone?: string; email?: string;
};
type Vacancy = {
  id: string; start_time: string; end_time: string; location_name: string; employee_name: string;
  service_names: string; status: string; candidates: Candidate[]; active_offer?: Offer | null;
};
type WaitlistEntry = {
  id: string; client_name: string; phone?: string; email?: string; service_names?: string;
  employee_name?: string; location_name?: string; preferred_from?: string; preferred_to?: string;
  status: string; priority_level?: number; accept_short_notice?: boolean; auto_offer?: boolean;
  offer_count?: number; created_at: string;
};
type Overview = {
  metrics: { waiting: number; contacted: number; open_vacancies: number; matchable_vacancies: number };
  waitlist: WaitlistEntry[]; vacancies: Vacancy[];
};
type SetupOption = { id: string; name: string; location_id?: string | null };
type SetupOptions = { locations: SetupOption[]; services: SetupOption[]; employees: SetupOption[] };
type EntryForm = {
  location_id: string; client_name: string; phone: string; email: string; service_id: string;
  preferred_employee_id: string; preferred_from: string; preferred_to: string; note: string;
  priority_level: string; accept_short_notice: boolean; auto_offer: boolean;
};

const emptyOverview: Overview = { metrics: { waiting: 0, contacted: 0, open_vacancies: 0, matchable_vacancies: 0 }, waitlist: [], vacancies: [] };
const emptySetup: SetupOptions = { locations: [], services: [], employees: [] };
const emptyForm = (): EntryForm => ({
  location_id: "", client_name: "", phone: "", email: "", service_id: "", preferred_employee_id: "",
  preferred_from: "", preferred_to: "", note: "", priority_level: "0", accept_short_notice: true, auto_offer: true,
});
const fmt = (v: string) => new Intl.DateTimeFormat("hu-HU", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(v));
const minutesLeft = (v: string) => Math.max(0, Math.ceil((new Date(v).getTime() - Date.now()) / 60000));

function authHeaders(json = false) {
  const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
}

export default function SmartWaitlistPanel() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview>(emptyOverview);
  const [setup, setSetup] = useState<SetupOptions>(emptySetup);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<EntryForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${SMART_API}/overview`, { credentials: "include", headers: authHeaders() });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
      setData(body);
    } catch (e: any) { setError(e?.message || "A Smart Waitlist nem tölthető be."); }
    finally { setLoading(false); }
  }, []);

  const loadSetup = useCallback(async () => {
    setSetupLoading(true);
    try {
      const r = await fetch(`${SMART_API}/setup-options`, { credentials: "include", headers: authHeaders() });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
      setSetup({
        locations: Array.isArray(body.locations) ? body.locations : [],
        services: Array.isArray(body.services) ? body.services : [],
        employees: Array.isArray(body.employees) ? body.employees : [],
      });
    } catch (e: any) { setError(e?.message || "A várólista választási adatai nem tölthetők be."); }
    finally { setSetupLoading(false); }
  }, []);

  useEffect(() => { load(); loadSetup(); }, [load, loadSetup]);
  useEffect(() => {
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const toast = (m: string) => { setNotice(m); window.setTimeout(() => setNotice(""), 3200); };
  const mutate = async (key: string, url: string, method: "POST" | "PATCH", body?: any) => {
    setBusy(key); setError("");
    try {
      const r = await fetch(url, {
        method, credentials: "include", headers: authHeaders(true),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(result?.error || `HTTP ${r.status}`);
      await load();
      return result;
    } catch (e: any) { setError(e?.message || "A művelet sikertelen."); throw e; }
    finally { setBusy(null); }
  };

  const offerTop = async (v: Vacancy) => {
    const c = v.candidates?.[0];
    if (!c) return;
    if (!window.confirm(`${c.client_name} kapja meg a felszabadult időpont ajánlatát?`)) return;
    try {
      const result = await mutate(`offer:${v.id}`, `${SMART_API}/vacancies/${v.id}/offer`, "POST", { waitlist_id: c.id, expires_minutes: 15, send_notification: true });
      toast(result.notification_status === "sent" ? "Ajánlat elküldve a vendégnek." : "Ajánlat létrejött; a kommunikáció státusza ellenőrzendő.");
    } catch { /* hiba fent */ }
  };

  const book = async (offer: Offer) => {
    if (!window.confirm("A vendég visszaigazolta az időpontot? A rendszer létrehozza a foglalást és a munkalapot.")) return;
    try {
      const result = await mutate(`book:${offer.id}`, `${SMART_API}/offers/${offer.id}/book`, "POST");
      toast(`Foglalás létrejött${result.work_order_number ? ` – ${result.work_order_number}` : ""}.`);
    } catch { /* hiba fent */ }
  };

  const decline = async (offer: Offer) => {
    try { await mutate(`decline:${offer.id}`, `${SMART_API}/offers/${offer.id}/decline`, "POST"); toast("Ajánlat elutasítva; a következő jelölt felajánlható."); }
    catch { /* hiba fent */ }
  };

  const updateEntryStatus = async (entry: WaitlistEntry, status: "waiting" | "contacted" | "cancelled") => {
    const labels = { waiting: "Visszaállítva várakozó állapotba.", contacted: "A vendég megkeresett állapotba került.", cancelled: "A várólista-bejegyzés lezárva." };
    if (status === "cancelled" && !window.confirm(`${entry.client_name} várólista-bejegyzése lezárható?`)) return;
    try {
      await mutate(`status:${entry.id}`, `${SMART_API}/entries/${entry.id}`, "PATCH", { status });
      toast(labels[status]);
    } catch { /* hiba fent */ }
  };

  const createEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_id || !form.client_name.trim() || !form.service_id) {
      setError("Telephely, vendégnév és szolgáltatás kötelező."); return;
    }
    if (form.preferred_from && form.preferred_to && new Date(form.preferred_to) < new Date(form.preferred_from)) {
      setError("A preferált időablak vége nem lehet korábbi a kezdeténél."); return;
    }
    try {
      await mutate("create", `${SMART_API}/entries`, "POST", {
        location_id: form.location_id,
        client_name: form.client_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        service_ids: [form.service_id],
        preferred_employee_id: form.preferred_employee_id || null,
        preferred_from: form.preferred_from ? new Date(form.preferred_from).toISOString() : null,
        preferred_to: form.preferred_to ? new Date(form.preferred_to).toISOString() : null,
        note: form.note.trim() || null,
        priority_level: Number(form.priority_level || 0),
        accept_short_notice: form.accept_short_notice,
        auto_offer: form.auto_offer,
      });
      setForm(emptyForm()); setShowCreate(false); toast("Új várólista-bejegyzés létrehozva.");
    } catch { /* hiba fent */ }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return data.waitlist.filter(x => {
      const matchesStatus = statusFilter === "all" || x.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return `${x.client_name} ${x.phone || ""} ${x.email || ""} ${x.service_names || ""} ${x.location_name || ""}`.toLowerCase().includes(q);
    });
  }, [data.waitlist, filter, statusFilter]);

  const locationEmployees = useMemo(() => setup.employees.filter(e => !form.location_id || !e.location_id || e.location_id === form.location_id), [setup.employees, form.location_id]);

  return <div className="sw-wrap">
    <section className="ap-kpis sw-kpis">
      <article><Users/><div><strong>{data.metrics.waiting}</strong><span>Várakozó vendég</span></div></article>
      <article><BellRing/><div><strong>{data.metrics.contacted}</strong><span>Aktív megkeresés</span></div></article>
      <article><CalendarClock/><div><strong>{data.metrics.open_vacancies}</strong><span>Felszabadult időpont</span></div></article>
      <article><Sparkles/><div><strong>{data.metrics.matchable_vacancies}</strong><span>Azonnal párosítható</span></div></article>
    </section>

    <section className="ap-card sw-intro">
      <div><h2><Sparkles size={19}/> Smart Waitlist</h2><p>Lemondáskor a VIR automatikusan felszabadult kapacitást hoz létre, majd szolgáltatás, időablak, munkatárs, rövid határidő, prioritás és várakozási idő alapján rangsorolja a vendégeket.</p></div>
      <div className="sw-intro-actions"><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "is-spinning" : ""}/> Frissítés</button><button className="primary" onClick={() => setShowCreate(v => !v)}><Plus size={16}/> Új bejegyzés</button></div>
    </section>

    {showCreate && <form className="ap-card sw-create" onSubmit={createEntry}>
      <div className="sw-create-head"><div><h2>Új várólista-bejegyzés</h2><p>A kötelező mezők: telephely, vendégnév és szolgáltatás.</p></div><button type="button" className="sw-icon-button" onClick={() => setShowCreate(false)} aria-label="Bezárás"><X size={18}/></button></div>
      <div className="sw-form-grid">
        <label><span>Telephely *</span><select value={form.location_id} disabled={setupLoading} onChange={e => setForm({ ...form, location_id: e.target.value, preferred_employee_id: "" })}><option value="">Válasszon telephelyet</option>{setup.locations.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label><span>Vendég neve *</span><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Teljes név" /></label>
        <label><span>Telefon</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+36…" /></label>
        <label><span>E-mail</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="vendeg@email.hu" /></label>
        <label><span>Szolgáltatás *</span><select value={form.service_id} disabled={setupLoading} onChange={e => setForm({ ...form, service_id: e.target.value })}><option value="">Válasszon szolgáltatást</option>{setup.services.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label><span>Preferált munkatárs</span><select value={form.preferred_employee_id} disabled={setupLoading} onChange={e => setForm({ ...form, preferred_employee_id: e.target.value })}><option value="">Bármely munkatárs</option>{locationEmployees.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label><span>Preferált időablak kezdete</span><input type="datetime-local" value={form.preferred_from} onChange={e => setForm({ ...form, preferred_from: e.target.value })} /></label>
        <label><span>Preferált időablak vége</span><input type="datetime-local" value={form.preferred_to} onChange={e => setForm({ ...form, preferred_to: e.target.value })} /></label>
        <label><span>Prioritás</span><select value={form.priority_level} onChange={e => setForm({ ...form, priority_level: e.target.value })}>{[0,1,2,3,4,5].map(x => <option key={x} value={x}>P{x}{x === 0 ? " – normál" : ""}</option>)}</select></label>
        <label className="sw-note"><span>Megjegyzés</span><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Recepciós megjegyzés, vendég kérése…" /></label>
      </div>
      <div className="sw-form-options"><label><input type="checkbox" checked={form.accept_short_notice} onChange={e => setForm({ ...form, accept_short_notice: e.target.checked })}/><span>Rövid határidős ajánlatot is elfogad</span></label><label><input type="checkbox" checked={form.auto_offer} onChange={e => setForm({ ...form, auto_offer: e.target.checked })}/><span>Automatikus ajánlat engedélyezve</span></label></div>
      <div className="sw-form-actions"><button type="button" onClick={() => { setForm(emptyForm()); setShowCreate(false); }}>Mégse</button><button className="primary" type="submit" disabled={busy === "create" || setupLoading}><Save size={16}/> {busy === "create" ? "Mentés…" : "Várólistára teszem"}</button></div>
    </form>}

    {error && <div className="sw-alert error">{error}</div>}
    {notice && <div className="ap-toast">{notice}</div>}

    <section className="sw-section">
      <div className="sw-section-title"><div><h2>Felszabadult időpontok</h2><p>A legjobb jelölt kerül előre. Egy időpontnál egyszerre csak egy aktív ajánlat futhat.</p></div></div>
      <div className="sw-vacancies">
        {data.vacancies.length ? data.vacancies.map(v => <article className="ap-card sw-vacancy" key={v.id}>
          <header>
            <div><strong>{fmt(v.start_time)} – {new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit" }).format(new Date(v.end_time))}</strong><span>{v.location_name} · {v.employee_name}</span></div>
            <em className={`sw-pill ${v.active_offer ? "offered" : "open"}`}>{v.active_offer ? "Ajánlat folyamatban" : "Nyitott"}</em>
          </header>
          <p className="sw-services">{v.service_names || "Szolgáltatás nincs megadva"}</p>
          {v.active_offer ? <div className="sw-active-offer">
            <div><UserRoundCheck size={18}/><span><b>{v.active_offer.client_name || "Várólistás vendég"}</b><small>{minutesLeft(v.active_offer.expires_at)} perc van hátra · {v.active_offer.notification_status || "kommunikáció folyamatban"}</small></span></div>
            <div className="sw-actions"><button className="primary" disabled={busy === `book:${v.active_offer.id}`} onClick={() => book(v.active_offer!)}><CheckCircle2 size={16}/> Foglalásba emelés</button><button disabled={busy === `decline:${v.active_offer.id}`} onClick={() => decline(v.active_offer!)}><XCircle size={16}/> Elutasította</button></div>
          </div> : v.candidates?.length ? <>
            <div className="sw-top-candidate">
              <div className="sw-score">{v.candidates[0].score}<small>/100</small></div>
              <div><b>{v.candidates[0].client_name}</b><span>{v.candidates[0].service_names || "Kért szolgáltatás"}</span><small>{v.candidates[0].phone || v.candidates[0].email || "Nincs elérhetőség"}</small></div>
              <button className="primary" disabled={busy === `offer:${v.id}`} onClick={() => offerTop(v)}><BellRing size={16}/> Ajánlat küldése</button>
            </div>
            {v.candidates.length > 1 && <details className="sw-more"><summary>További {v.candidates.length - 1} kompatibilis jelölt</summary>{v.candidates.slice(1).map(c => <div className="sw-candidate" key={c.id}><span><b>{c.client_name}</b><small>{c.service_names}</small></span><strong>{c.score}/100</strong></div>)}</details>}
          </> : <div className="sw-empty"><Clock3 size={22}/><span>Nincs jelenleg kompatibilis várólistás vendég.</span></div>}
        </article>) : <div className="ap-card sw-empty large"><CalendarClock size={30}/><h3>Nincs nyitott felszabadult időpont</h3><p>Az új lemondások automatikusan megjelennek itt.</p></div>}
      </div>
    </section>

    <section className="ap-card sw-list-card">
      <div className="sw-section-title sw-list-toolbar"><div><h2>Aktív várólista</h2><p>A publikus és Voice Booking várólistás kérések ugyanebbe a motorba kerülnek.</p></div><div className="sw-list-filters"><label className="sw-search"><Search size={16}/><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Keresés vendégre, szolgáltatásra…" /></label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Minden állapot</option><option value="waiting">Várakozik</option><option value="contacted">Megkeresve</option></select></div></div>
      <div className="sw-table-head"><span>Vendég</span><span>Szolgáltatás</span><span>Preferencia</span><span>Prioritás</span><span>Állapot</span><span>Műveletek</span></div>
      {filtered.length ? filtered.map(w => <div className="sw-table-row" key={w.id}>
        <span><b>{w.client_name}</b><small>{w.phone || w.email || "–"}</small></span>
        <span>{w.service_names || "–"}</span>
        <span><b>{w.employee_name || "Bármely munkatárs"}</b><small>{w.preferred_from ? `${fmt(w.preferred_from)}${w.preferred_to ? ` – ${fmt(w.preferred_to)}` : ""}` : "Rugalmas időpont"}</small></span>
        <span><b>P{Number(w.priority_level || 0)}</b><small>{w.accept_short_notice ? "Rövid határidő: igen" : "Rövid határidő: nem"}</small></span>
        <span><em className={`sw-pill ${w.status}`}>{w.status === "contacted" ? "Megkeresve" : "Várakozik"}</em><small>{Number(w.offer_count || 0)} ajánlat · {w.auto_offer === false ? "kézi" : "automata"}</small></span>
        <span className="sw-row-actions">{w.status === "waiting" ? <button disabled={busy === `status:${w.id}`} onClick={() => updateEntryStatus(w, "contacted")}>Megkeresve</button> : <button disabled={busy === `status:${w.id}`} onClick={() => updateEntryStatus(w, "waiting")}>Visszavár</button>}<button onClick={() => navigate("/appointments/calendar")}><CalendarDays size={14}/> Naptár</button><button onClick={() => navigate("/appointments/new")}><Plus size={14}/> Időpont</button><button className="danger" disabled={busy === `status:${w.id}`} onClick={() => updateEntryStatus(w, "cancelled")}><XCircle size={14}/> Lezárás</button></span>
      </div>) : <div className="sw-empty large"><Users size={28}/><h3>Nincs találat az aktív várólistán</h3><p>{filter || statusFilter !== "all" ? "Módosítsa a keresést vagy az állapotszűrőt." : "Vegye fel az első várólistás vendéget."}</p>{!filter && statusFilter === "all" && <button className="primary" onClick={() => setShowCreate(true)}><Plus size={16}/> Új várólista-bejegyzés</button>}</div>}
    </section>
  </div>;
}
