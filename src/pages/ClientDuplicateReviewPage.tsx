import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, GitMerge, History, Mail, MapPin, Phone, RefreshCw, ShieldCheck, UserCheck, Users, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./ClientDuplicateReviewPage.css";

type CandidateClient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  visits?: number;
  spent?: number;
};

type DuplicatePair = {
  pair_key: string;
  match_reasons: string[];
  client_a: CandidateClient;
  client_b: CandidateClient;
};

type Resolution = {
  id: string;
  primary_client_id: string;
  duplicate_client_id: string;
  decision: "merged" | "dismissed";
  match_reasons: string[];
  note?: string | null;
  decided_by?: string | null;
  primary_name?: string | null;
  duplicate_name?: string | null;
  moved_records?: Record<string, number>;
  created_at: string;
};

type ReviewPayload = {
  pending: DuplicatePair[];
  history: Resolution[];
  can_approve: boolean;
};

const token = () => localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";
const money = (value?: number) => new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(withBase(path), {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail ? `${payload.error || "Hiba"}: ${payload.detail}` : payload.error || `HTTP ${response.status}`);
  return payload as T;
}

function CandidateCard({ client, primary, onPrimary }: { client: CandidateClient; primary: boolean; onPrimary: () => void }) {
  return <button type="button" className={`dup-candidate ${primary ? "primary" : ""}`} onClick={onPrimary}>
    <span className="dup-radio" aria-hidden="true">{primary ? <UserCheck size={18} /> : <Users size={18} />}</span>
    <span className="dup-candidate-main">
      <span className="dup-candidate-title"><strong>{client.name}</strong>{primary && <em>Megmaradó profil</em>}</span>
      <span className="dup-contact"><Mail size={14} /> {client.email || "Nincs e-mail"}</span>
      <span className="dup-contact"><Phone size={14} /> {client.phone || "Nincs telefonszám"}</span>
      <span className="dup-contact"><MapPin size={14} /> {client.location_id || "Nincs telephely"}</span>
      <span className="dup-candidate-meta"><span>{client.visits || 0} látogatás</span><span>{money(client.spent)}</span><span>Létrehozva: {dateTime(client.created_at)}</span></span>
    </span>
  </button>;
}

export default function ClientDuplicateReviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewPayload>({ pending: [], history: [], can_approve: false });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [primaryByPair, setPrimaryByPair] = useState<Record<string, string>>({});
  const [noteByPair, setNoteByPair] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const locationId = localStorage.getItem("kleo_location_id") || "";
      const suffix = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";
      const result = await api<ReviewPayload>(`clients/duplicate-review${suffix}`);
      setData(result);
      setPrimaryByPair(current => {
        const next = { ...current };
        for (const pair of result.pending) if (!next[pair.pair_key]) next[pair.pair_key] = pair.client_a.id;
        return next;
      });
    } catch (e: any) {
      setError(e.message || "A duplikációs lista betöltése nem sikerült.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => ({
    pending: data.pending.length,
    merged: data.history.filter(item => item.decision === "merged").length,
    dismissed: data.history.filter(item => item.decision === "dismissed").length,
  }), [data]);

  async function resolvePair(pair: DuplicatePair, decision: "merge" | "dismiss") {
    if (!data.can_approve) return;
    const primaryId = primaryByPair[pair.pair_key] || pair.client_a.id;
    const duplicateId = primaryId === pair.client_a.id ? pair.client_b.id : pair.client_a.id;
    if (decision === "merge" && !window.confirm("Jóváhagyod a két ügyfélprofil összevonását? A másodlagos profil inaktív marad audit célból, a kapcsolódó adatok a megmaradó profilhoz kerülnek.")) return;
    setWorking(pair.pair_key);
    setError("");
    try {
      await api("clients/duplicate-review/resolve", {
        method: "POST",
        body: JSON.stringify({
          primary_client_id: primaryId,
          duplicate_client_id: duplicateId,
          decision,
          note: noteByPair[pair.pair_key] || null,
          location_id: localStorage.getItem("kleo_location_id") || null,
        }),
      });
      setNotice(decision === "merge" ? "Az ügyfélprofilok összevonása megtörtént." : "A pár nem duplikációként lett rögzítve.");
      window.setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (e: any) {
      setError(e.message || "A döntés mentése nem sikerült.");
    } finally {
      setWorking("");
    }
  }

  return <main className="duplicate-review-page">
    <header className="dup-hero">
      <div>
        <button className="dup-back" type="button" onClick={() => navigate("/modules/customers/import")}><ArrowLeft size={16} /> Import és duplikációk</button>
        <p className="dup-eyebrow">ÜGYFELEK ÉS CRM · ADATMINŐSÉG</p>
        <h1>Duplikációk jóváhagyása</h1>
        <p>E-mail- vagy telefonszám-egyezés alapján felismert ügyfélprofilok ellenőrzése, auditált összevonással.</p>
      </div>
      <button className="dup-refresh" type="button" onClick={load} disabled={loading}><RefreshCw size={17} className={loading ? "spin" : ""} /> Frissítés</button>
    </header>

    {error && <div className="dup-alert error"><XCircle size={18} /><span>{error}</span></div>}
    {notice && <div className="dup-alert success"><CheckCircle2 size={18} /><span>{notice}</span></div>}
    {!data.can_approve && <div className="dup-alert info"><ShieldCheck size={18} /><span>A duplikációkat megtekintheted, de összevonási döntést csak adminisztrátor vagy vezető hagyhat jóvá.</span></div>}

    <section className="dup-metrics">
      <article><GitMerge /><div><span>Jóváhagyásra vár</span><strong>{summary.pending}</strong></div></article>
      <article><CheckCircle2 /><div><span>Összevonva</span><strong>{summary.merged}</strong></div></article>
      <article><XCircle /><div><span>Nem duplikáció</span><strong>{summary.dismissed}</strong></div></article>
      <article><History /><div><span>Auditbejegyzés</span><strong>{data.history.length}</strong></div></article>
    </section>

    <section className="dup-panel">
      <div className="dup-section-head"><div><h2>Jóváhagyási sor</h2><p>Válaszd ki, melyik profil maradjon meg. Összevonáskor a másik profil inaktiválódik, nem törlődik.</p></div></div>
      {loading ? <div className="dup-empty">Duplikációk keresése…</div> : data.pending.length === 0 ? <div className="dup-empty"><CheckCircle2 size={32} /><strong>Nincs feldolgozatlan duplikáció.</strong><span>Az ügyféltörzs jelenleg tiszta a vizsgált e-mail- és telefonszám-egyezések alapján.</span></div> : <div className="dup-list">
        {data.pending.map(pair => {
          const selected = primaryByPair[pair.pair_key] || pair.client_a.id;
          const busy = working === pair.pair_key;
          return <article className="dup-pair" key={pair.pair_key}>
            <div className="dup-pair-head"><div><strong>Lehetséges duplikáció</strong><span>{pair.match_reasons.map(reason => <em key={reason}>{reason === "email" ? "E-mail egyezés" : "Telefonszám egyezés"}</em>)}</span></div><small>{pair.pair_key.split(":")[0].slice(0, 8)} · {pair.pair_key.split(":")[1].slice(0, 8)}</small></div>
            <div className="dup-candidates">
              <CandidateCard client={pair.client_a} primary={selected === pair.client_a.id} onPrimary={() => setPrimaryByPair(v => ({ ...v, [pair.pair_key]: pair.client_a.id }))} />
              <div className="dup-merge-icon"><GitMerge size={20} /></div>
              <CandidateCard client={pair.client_b} primary={selected === pair.client_b.id} onPrimary={() => setPrimaryByPair(v => ({ ...v, [pair.pair_key]: pair.client_b.id }))} />
            </div>
            <label className="dup-note"><span>Jóváhagyási megjegyzés <small>(opcionális)</small></span><input value={noteByPair[pair.pair_key] || ""} onChange={e => setNoteByPair(v => ({ ...v, [pair.pair_key]: e.target.value }))} placeholder="Pl. ugyanaz a vendég, régi telefonszámmal importálva" /></label>
            <div className="dup-actions">
              <button type="button" className="dup-dismiss" disabled={!data.can_approve || busy} onClick={() => resolvePair(pair, "dismiss")}><XCircle size={17} /> Nem duplikáció</button>
              <button type="button" className="dup-approve" disabled={!data.can_approve || busy} onClick={() => resolvePair(pair, "merge")}><GitMerge size={17} /> {busy ? "Feldolgozás…" : "Összevonás jóváhagyása"}</button>
            </div>
          </article>;
        })}
      </div>}
    </section>

    <section className="dup-panel">
      <div className="dup-section-head"><div><h2>Döntési napló</h2><p>A legutóbbi jóváhagyások és elutasítások, döntéshozóval és időponttal.</p></div></div>
      {data.history.length === 0 ? <div className="dup-empty">Még nincs duplikációs döntés.</div> : <div className="dup-history">
        <div className="dup-history-head"><span>Döntés</span><span>Megmaradó profil</span><span>Másodlagos profil</span><span>Döntéshozó</span><span>Időpont</span></div>
        {data.history.map(item => <div className="dup-history-row" key={item.id}>
          <span><em className={item.decision}>{item.decision === "merged" ? "Összevonva" : "Nem duplikáció"}</em></span>
          <span><strong>{item.primary_name || item.primary_client_id}</strong><small>{item.primary_client_id.slice(0, 8)}</small></span>
          <span><strong>{item.duplicate_name || item.duplicate_client_id}</strong><small>{item.duplicate_client_id.slice(0, 8)}</small></span>
          <span>{item.decided_by || "—"}</span>
          <span>{dateTime(item.created_at)}</span>
        </div>)}
      </div>}
    </section>
  </main>;
}
