import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Merge, RefreshCw, Search, ShieldBan, UserRound, X } from "lucide-react";
import withBase from "../../utils/apiBase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import "./ClientGovernanceLauncher.css";

type ClientLite = {
  id: string;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  location_id?: string;
  location_name?: string;
};

type DuplicateGroup = {
  email_key?: string;
  phone_key?: string;
  clients: ClientLite[];
};

type Governance = {
  client: ClientLite & {
    is_active?: boolean;
    merged_into_client_id?: string | null;
    merged_at?: string | null;
    merged_by?: string | null;
  };
  booking_control?: {
    online_booking_blocked?: boolean;
    block_reason?: string | null;
    updated_by?: string | null;
    updated_at?: string | null;
  };
  merge_history?: Array<{
    id: string;
    source_client_id: string;
    target_client_id: string;
    moved_counts?: Record<string, number>;
    note?: string | null;
    merged_by?: string | null;
    merged_at?: string | null;
  }>;
};

type MergePreview = {
  source: ClientLite;
  target: ClientLite;
  foreign_keys: Array<{ table_name: string; column_name: string; source_count: number; target_count: number }>;
  text_references: Array<{ table_name: string; column_name: string; source_count: number }>;
};

const token = () => localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";
const clientName = (client?: ClientLite | null) => client?.full_name || client?.name || client?.email || client?.phone || "Ügyfél";
const roleList = (raw: any) => {
  if (Array.isArray(raw)) return raw.map(String).map((x) => x.toLowerCase());
  try {
    const parsed = JSON.parse(String(raw || ""));
    if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.toLowerCase());
  } catch {}
  return String(raw || "").split(",").map((x) => x.replace(/[[\]"]/g, "").trim().toLowerCase()).filter(Boolean);
};
const MANAGERS = new Set(["admin", "administrator", "rendszergazda", "superadmin", "super_admin", "manager", "location_manager", "salon_manager", "szalonvezető", "szalonvezeto", "üzletvezető", "uzletvezeto", "store_manager", "branch_manager"]);

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(withBase(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || payload.detail || `HTTP ${response.status}`);
  return payload;
}

export default function ClientGovernanceLauncher() {
  const { user } = (useCurrentUser() as any) || {};
  const canMerge = useMemo(() => roleList(user?.role).some((role) => MANAGERS.has(role)), [user?.role]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"block" | "merge">("block");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ClientLite[]>([]);
  const [selected, setSelected] = useState<ClientLite | null>(null);
  const [governance, setGovernance] = useState<Governance | null>(null);
  const [reason, setReason] = useState("");

  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [mergeNote, setMergeNote] = useState("");
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const refreshDuplicates = async () => {
    if (!canMerge) return;
    try {
      const rows = await api<DuplicateGroup[]>("clients/duplicates");
      setDuplicates(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e.message || "A duplikációk nem tölthetők be.");
    }
  };

  useEffect(() => {
    if (!open || !canMerge) return;
    void refreshDuplicates();
  }, [open, canMerge]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setMatches([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), status: "all" });
        const rows = await api<ClientLite[]>(`clients?${params}`);
        setMatches(Array.isArray(rows) ? rows.slice(0, 12) : []);
      } catch (e: any) {
        setError(e.message || "Az ügyfélkeresés nem sikerült.");
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  const selectClient = async (client: ClientLite) => {
    setSelected(client);
    setQuery(clientName(client));
    setMatches([]);
    setBusy(true);
    setError("");
    try {
      const data = await api<Governance>(`clients/${client.id}/governance`);
      setGovernance(data);
      setReason(data.booking_control?.block_reason || "");
    } catch (e: any) {
      setError(e.message || "Az ügyfél governance adatai nem tölthetők be.");
    } finally {
      setBusy(false);
    }
  };

  const saveBlock = async (blocked: boolean) => {
    if (!selected) return;
    if (blocked && reason.trim().length < 3) {
      setError("A tiltás indoka kötelező.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`clients/${selected.id}/online-booking-block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked, reason: blocked ? reason.trim() : "" }),
      });
      const data = await api<Governance>(`clients/${selected.id}/governance`);
      setGovernance(data);
      setReason(data.booking_control?.block_reason || "");
      setNotice(blocked ? "Az online foglalás tiltása aktív." : "Az online foglalás tiltását feloldottuk.");
    } catch (e: any) {
      setError(e.message || "A foglalási tiltás nem menthető.");
    } finally {
      setBusy(false);
    }
  };

  const selectDuplicateGroup = (group: DuplicateGroup) => {
    const ids = group.clients || [];
    setSourceId(ids[0]?.id || "");
    setTargetId(ids[1]?.id || "");
    setPreview(null);
    setConfirmed(false);
    setMergeNote("");
  };

  const duplicateCandidates = useMemo(() => {
    const map = new Map<string, ClientLite>();
    duplicates.flatMap((group) => group.clients || []).forEach((client) => map.set(client.id, client));
    return Array.from(map.values());
  }, [duplicates]);

  const loadPreview = async () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      setError("Válasszon külön forrás- és cél ügyfelet.");
      return;
    }
    setBusy(true);
    setError("");
    setConfirmed(false);
    try {
      const data = await api<MergePreview>("clients/duplicates/merge-preview", {
        method: "POST",
        body: JSON.stringify({ source_client_id: sourceId, target_client_id: targetId }),
      });
      setPreview(data);
    } catch (e: any) {
      setPreview(null);
      setError(e.message || "Az összevonási előnézet nem készíthető el.");
    } finally {
      setBusy(false);
    }
  };

  const mergeClients = async () => {
    if (!preview || !confirmed) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ moved_counts?: Record<string, number> }>("clients/duplicates/merge", {
        method: "POST",
        body: JSON.stringify({ source_client_id: sourceId, target_client_id: targetId, note: mergeNote.trim() }),
      });
      const moved = Object.values(result.moved_counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      setNotice(`Ügyfél-összevonás kész. ${moved} kapcsolódó rekord került át a cél ügyfélhez.`);
      setPreview(null);
      setSourceId("");
      setTargetId("");
      setMergeNote("");
      setConfirmed(false);
      await refreshDuplicates();
    } catch (e: any) {
      setError(e.message || "Az ügyfél-összevonás nem sikerült.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button className="client-governance-launcher" onClick={() => setOpen(true)} title="Ügyfél adatminőség és online foglalási tiltás">
      <ShieldBan size={18}/><span>Adatminőség</span>
    </button>

    {open && <div className="client-governance-overlay" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="client-governance-modal" role="dialog" aria-modal="true">
        <header>
          <div><span>CRM GOVERNANCE · STAGE 16</span><h2>Adatminőség és tiltólista</h2><p>Online foglalási kontroll és auditált duplikáció-összevonás.</p></div>
          <button onClick={() => setOpen(false)} aria-label="Bezárás"><X/></button>
        </header>
        <nav>
          <button className={tab === "block" ? "active" : ""} onClick={() => setTab("block")}><ShieldBan size={16}/> Online tiltólista</button>
          {canMerge && <button className={tab === "merge" ? "active" : ""} onClick={() => setTab("merge")}><Merge size={16}/> Duplikációk összevonása</button>}
        </nav>
        {error && <div className="client-governance-message error"><AlertTriangle size={17}/>{error}<button onClick={() => setError("")}><X size={14}/></button></div>}
        {notice && <div className="client-governance-message success"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}><X size={14}/></button></div>}

        {tab === "block" && <div className="client-governance-body">
          <section className="governance-search-card">
            <h3>Ügyfél kiválasztása</h3>
            <p>A tiltás az online foglalást és az online várólistára jelentkezést is blokkolja.</p>
            <label className="governance-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Név, telefon vagy e-mail…"/></label>
            {matches.length > 0 && <div className="governance-search-results">{matches.map((client) => <button key={client.id} onClick={() => void selectClient(client)}><UserRound size={16}/><span><b>{clientName(client)}</b><small>{client.phone || "—"} · {client.email || "—"}</small></span></button>)}</div>}
          </section>

          {selected && <section className="governance-client-card">
            <div className="governance-client-head"><UserRound size={22}/><div><h3>{clientName(selected)}</h3><p>{selected.phone || "Nincs telefon"} · {selected.email || "Nincs e-mail"}</p></div><span className={governance?.booking_control?.online_booking_blocked ? "blocked" : "allowed"}>{governance?.booking_control?.online_booking_blocked ? "Online tiltott" : "Online engedélyezett"}</span></div>
            {governance?.client?.merged_into_client_id && <div className="governance-merged-warning">Ez a rekord már össze lett vonva. Cél ügyfél: <b>{governance.client.merged_into_client_id}</b></div>}
            <label>Tiltás belső indoka<textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="pl. ismételt meg nem jelenés, fizetési probléma…"/></label>
            <div className="governance-actions">
              {governance?.booking_control?.online_booking_blocked
                ? <button className="secondary" disabled={busy || Boolean(governance?.client?.merged_into_client_id)} onClick={() => void saveBlock(false)}>Tiltás feloldása</button>
                : <button className="danger" disabled={busy || Boolean(governance?.client?.merged_into_client_id)} onClick={() => void saveBlock(true)}><ShieldBan size={16}/> Online foglalás tiltása</button>}
            </div>
            {governance?.booking_control?.updated_at && <small className="governance-audit">Utolsó módosítás: {new Date(governance.booking_control.updated_at).toLocaleString("hu-HU")} · {governance.booking_control.updated_by || "—"}</small>}
          </section>}
        </div>}

        {tab === "merge" && canMerge && <div className="client-governance-body merge-body">
          <section className="duplicate-groups">
            <div className="section-title"><div><h3>Felismerhető duplikációk</h3><p>A meglévő CRM email/telefon egyezései alapján.</p></div><button onClick={() => void refreshDuplicates()}><RefreshCw size={15}/></button></div>
            {duplicates.length === 0 ? <div className="governance-empty">Nincs jelenleg felismerhető duplikáció.</div> : duplicates.map((group, index) => <button key={`${group.email_key || group.phone_key || "dup"}-${index}`} onClick={() => selectDuplicateGroup(group)}><Merge size={17}/><span><b>{group.clients.map(clientName).join(" ↔ ")}</b><small>{group.email_key || group.phone_key || "azonos kapcsolati adat"}</small></span></button>)}
          </section>

          <section className="merge-editor">
            <h3>Biztonságos összevonás</h3><p>A forrás rekord inaktív marad audit célból; a kapcsolódó üzleti rekordok a cél ügyfélhez kerülnek.</p>
            <div className="merge-selects">
              <label>Forrás ügyfél<select value={sourceId} onChange={(e) => { setSourceId(e.target.value); setPreview(null); setConfirmed(false); }}><option value="">Válasszon</option>{duplicateCandidates.map((client) => <option key={client.id} value={client.id}>{clientName(client)} · {client.email || client.phone || client.id}</option>)}</select></label>
              <label>Cél / megtartandó ügyfél<select value={targetId} onChange={(e) => { setTargetId(e.target.value); setPreview(null); setConfirmed(false); }}><option value="">Válasszon</option>{duplicateCandidates.map((client) => <option key={client.id} value={client.id}>{clientName(client)} · {client.email || client.phone || client.id}</option>)}</select></label>
            </div>
            <button className="preview-button" disabled={busy || !sourceId || !targetId || sourceId === targetId} onClick={() => void loadPreview()}>Összevonási előnézet</button>

            {preview && <div className="merge-preview">
              <h4><AlertTriangle size={17}/> Ellenőrizze az áthelyezendő adatokat</h4>
              <p><b>{clientName(preview.source)}</b> → <b>{clientName(preview.target)}</b></p>
              <div className="impact-list">
                {preview.foreign_keys.map((row) => <span key={`${row.table_name}-${row.column_name}`}><b>{row.source_count}</b> {row.table_name}.{row.column_name}</span>)}
                {preview.text_references.map((row) => <span key={`${row.table_name}-${row.column_name}`}><b>{row.source_count}</b> {row.table_name}.{row.column_name}</span>)}
                {preview.foreign_keys.length === 0 && preview.text_references.length === 0 && <span>Nincs áthelyezendő kapcsolódó rekord.</span>}
              </div>
              <label>Audit megjegyzés<textarea rows={2} value={mergeNote} onChange={(e) => setMergeNote(e.target.value)} placeholder="Miért vonjuk össze a rekordokat?"/></label>
              <label className="merge-confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/><span>Átnéztem az előnézetet. A cél ügyfél marad meg, a forrás inaktív, auditált rekord lesz.</span></label>
              <button className="merge-button" disabled={busy || !confirmed} onClick={() => void mergeClients()}><Merge size={16}/> Végleges összevonás</button>
            </div>}
          </section>
        </div>}
      </section>
    </div>}
  </>;
}
