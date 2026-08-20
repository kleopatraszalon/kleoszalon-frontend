import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, CheckCircle2, Clock3, RefreshCw, Sparkles, UserRoundCheck, Users, XCircle } from "lucide-react";
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
  status: string; priority_level?: number; accept_short_notice?: boolean; offer_count?: number; created_at: string;
};
type Overview = {
  metrics: { waiting: number; contacted: number; open_vacancies: number; matchable_vacancies: number };
  waitlist: WaitlistEntry[]; vacancies: Vacancy[];
};

const emptyOverview: Overview = { metrics: { waiting: 0, contacted: 0, open_vacancies: 0, matchable_vacancies: 0 }, waitlist: [], vacancies: [] };
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
  const [data, setData] = useState<Overview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

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

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const toast = (m: string) => { setNotice(m); window.setTimeout(() => setNotice(""), 3200); };
  const action = async (key: string, url: string, body: any = {}) => {
    setBusy(key); setError("");
    try {
      const r = await fetch(url, { method: "POST", credentials: "include", headers: authHeaders(true), body: JSON.stringify(body) });
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
      const result = await action(`offer:${v.id}`, `${SMART_API}/vacancies/${v.id}/offer`, { waitlist_id: c.id, expires_minutes: 15, send_notification: true });
      toast(result.notification_status === "sent" ? "Ajánlat elküldve a vendégnek." : "Ajánlat létrejött; a kommunikáció státusza ellenőrzendő.");
    } catch { /* hiba fent */ }
  };

  const book = async (offer: Offer) => {
    if (!window.confirm("A vendég visszaigazolta az időpontot? A rendszer létrehozza a foglalást és a munkalapot.")) return;
    try {
      const result = await action(`book:${offer.id}`, `${SMART_API}/offers/${offer.id}/book`);
      toast(`Foglalás létrejött${result.work_order_number ? ` – ${result.work_order_number}` : ""}.`);
    } catch { /* hiba fent */ }
  };

  const decline = async (offer: Offer) => {
    try { await action(`decline:${offer.id}`, `${SMART_API}/offers/${offer.id}/decline`); toast("Ajánlat elutasítva; a következő jelölt felajánlható."); }
    catch { /* hiba fent */ }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data.waitlist;
    return data.waitlist.filter(x => `${x.client_name} ${x.phone || ""} ${x.email || ""} ${x.service_names || ""} ${x.location_name || ""}`.toLowerCase().includes(q));
  }, [data.waitlist, filter]);

  return <div className="sw-wrap">
    <section className="ap-kpis sw-kpis">
      <article><Users/><div><strong>{data.metrics.waiting}</strong><span>Várakozó vendég</span></div></article>
      <article><BellRing/><div><strong>{data.metrics.contacted}</strong><span>Aktív megkeresés</span></div></article>
      <article><CalendarClock/><div><strong>{data.metrics.open_vacancies}</strong><span>Felszabadult időpont</span></div></article>
      <article><Sparkles/><div><strong>{data.metrics.matchable_vacancies}</strong><span>Azonnal párosítható</span></div></article>
    </section>

    <section className="ap-card sw-intro">
      <div><h2><Sparkles size={19}/> Smart Waitlist</h2><p>Lemondáskor a VIR automatikusan felszabadult kapacitást hoz létre, majd szolgáltatás, időablak, munkatárs, rövid határidő, prioritás és várakozási idő alapján rangsorolja a vendégeket.</p></div>
      <button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "is-spinning" : ""}/> Frissítés</button>
    </section>

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
      <div className="sw-section-title"><div><h2>Aktív várólista</h2><p>A publikus és Voice Booking várólistás kérések ugyanebbe a motorba kerülnek.</p></div><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Keresés vendégre, szolgáltatásra…" /></div>
      <div className="sw-table-head"><span>Vendég</span><span>Szolgáltatás</span><span>Preferencia</span><span>Prioritás</span><span>Állapot</span></div>
      {filtered.length ? filtered.map(w => <div className="sw-table-row" key={w.id}>
        <span><b>{w.client_name}</b><small>{w.phone || w.email || "–"}</small></span>
        <span>{w.service_names || "–"}</span>
        <span><b>{w.employee_name || "Bármely munkatárs"}</b><small>{w.preferred_from ? `${fmt(w.preferred_from)}${w.preferred_to ? ` – ${fmt(w.preferred_to)}` : ""}` : "Rugalmas időpont"}</small></span>
        <span><b>P{Number(w.priority_level || 0)}</b><small>{w.accept_short_notice ? "Rövid határidő: igen" : "Rövid határidő: nem"}</small></span>
        <span><em className={`sw-pill ${w.status}`}>{w.status === "contacted" ? "Megkeresve" : "Várakozik"}</em><small>{Number(w.offer_count || 0)} ajánlat</small></span>
      </div>) : <div className="sw-empty large"><Users size={28}/><h3>Nincs aktív várólistás vendég</h3></div>}
    </section>
  </div>;
}
