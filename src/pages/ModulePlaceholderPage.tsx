import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "../utils/fetch";
import "./ModulePlaceholderPage.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type ModuleField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
};

type ModuleDefinition = {
  module_key: string;
  title: string;
  category: string;
  route: string;
  description?: string;
  entity_label?: string;
  fields: ModuleField[];
  statuses: string[];
  spec_reference?: string;
  permissions?: {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
  };
};

type ModuleRecord = {
  id: string;
  module_key: string;
  location_id?: string | null;
  title: string;
  reference_no?: string | null;
  status: string;
  priority: string;
  due_at?: string | null;
  amount?: number | string | null;
  currency?: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type Summary = {
  total: number;
  active: number;
  overdue: number;
  changed_today: number;
};

type EditState = {
  id?: string;
  title: string;
  reference_no: string;
  status: string;
  priority: string;
  due_at: string;
  amount: string;
  currency: string;
  payload: Record<string, unknown>;
};

const statusLabels: Record<string, string> = {
  draft: "Vázlat",
  active: "Aktív",
  inactive: "Inaktív",
  archived: "Archivált",
  closed: "Lezárt",
  assigned: "Kiosztva",
  in_progress: "Folyamatban",
  completed: "Elkészült",
  approved: "Jóváhagyva",
  cancelled: "Visszavonva",
  reported: "Bejelentve",
  scheduled: "Ütemezve",
  resolved: "Megoldva",
  sent: "Elküldve",
  delivered: "Kézbesítve",
  read: "Elolvasva",
  queued: "Küldésre vár",
  failed: "Sikertelen",
  new: "Új",
  investigating: "Kivizsgálás alatt",
  accepted: "Elfogadva",
  rejected: "Elutasítva",
  review: "Felülvizsgálat",
  published: "Közzétéve",
  valid: "Érvényes",
  expiring: "Lejáró",
  expired: "Lejárt",
  obsolete: "Hatálytalan",
  planned: "Tervezett",
  notified: "Értesítve",
  submitted: "Beküldve",
  interview: "Interjú",
  trial_day: "Próbanap",
  hired: "Felvéve",
  registered: "Rögzítve",
  paid: "Kifizetve",
  overdue: "Lejárt határidejű",
  counted: "Megszámolva",
  difference: "Eltérés",
  central_review: "Központi ellenőrzés",
  ordered: "Megrendelve",
  partially_received: "Részben beérkezett",
  sent_to_salon: "Szalonba küldve",
  received: "Beérkezett",
  suggested: "Javasolt",
  paused: "Szüneteltetve",
};

const priorityLabels: Record<string, string> = {
  low: "Alacsony",
  normal: "Normál",
  high: "Magas",
  critical: "Kritikus",
};

function fallbackTitle(pathname: string) {
  const slug = pathname.split("/").filter(Boolean).pop() || "modul";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusLabel(value: string) {
  return statusLabels[value] || value.replace(/_/g, " ");
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function localDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_BASE}${path}`, init);
  return response.json() as Promise<T>;
}

export default function ModulePlaceholderPage() {
  const location = useLocation();
  const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
  const [items, setItems] = useState<ModuleRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, overdue: 0, changed_today: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<EditState | null>(null);

  const title = definition?.title || fallbackTitle(location.pathname);
  const canCreate = definition?.permissions?.can_create !== false;
  const canEdit = definition?.permissions?.can_edit !== false;
  const canDelete = definition?.permissions?.can_delete !== false;
  const canExport = definition?.permissions?.can_export !== false;

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }, []);

  const loadRecords = useCallback(async (current: ModuleDefinition, q = query, currentStatus = status) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (currentStatus) params.set("status", currentStatus);
    const result = await json<{ definition: ModuleDefinition; items: ModuleRecord[]; summary: Summary }>(
      `/spec-modules/${encodeURIComponent(current.module_key)}/records?${params.toString()}`
    );
    setDefinition(result.definition);
    setItems(result.items || []);
    setSummary(result.summary || { total: 0, active: 0, overdue: 0, changed_today: 0 });
  }, [query, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await json<ModuleDefinition>(
        `/spec-modules/resolve?route=${encodeURIComponent(location.pathname)}`
      );
      setDefinition(current);
      await loadRecords(current);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "A modul betöltése nem sikerült.");
      setDefinition(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [loadRecords, location.pathname]);

  useEffect(() => {
    setQuery("");
    setStatus("");
    setEditor(null);
    void load();
    // Az útvonalváltás indítson új feloldást; a keresők külön hatásban frissülnek.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!definition) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      loadRecords(definition)
        .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "A lista betöltése nem sikerült."))
        .finally(() => setLoading(false));
    }, 240);
    return () => window.clearTimeout(timer);
  }, [definition?.module_key, query, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    if (!definition) return;
    setEditor({
      title: "",
      reference_no: "",
      status: definition.statuses?.[0] || "draft",
      priority: "normal",
      due_at: "",
      amount: "",
      currency: "HUF",
      payload: {},
    });
  };

  const openEdit = (item: ModuleRecord) => {
    setEditor({
      id: item.id,
      title: item.title,
      reference_no: item.reference_no || "",
      status: item.status,
      priority: item.priority || "normal",
      due_at: localDateTime(item.due_at),
      amount: item.amount == null ? "" : String(item.amount),
      currency: item.currency || "HUF",
      payload: { ...(item.payload || {}) },
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!definition || !editor) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        title: editor.title.trim(),
        reference_no: editor.reference_no.trim(),
        status: editor.status,
        priority: editor.priority,
        due_at: editor.due_at || null,
        amount: editor.amount,
        currency: editor.currency,
        payload: editor.payload,
      };
      await json<ModuleRecord>(
        `/spec-modules/${encodeURIComponent(definition.module_key)}/records${editor.id ? `/${editor.id}` : ""}`,
        {
          method: editor.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      setEditor(null);
      await loadRecords(definition);
      showNotice(editor.id ? "A módosításokat elmentettük." : `Az új ${definition.entity_label || "bejegyzés"} elkészült.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "A mentés nem sikerült.");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (item: ModuleRecord) => {
    if (!definition || !window.confirm(`Biztosan inaktiválja ezt: ${item.title}?`)) return;
    const reason = window.prompt("Az inaktiválás oka (naplózásra kerül):", "Már nem aktuális") ?? "";
    try {
      await json(`/spec-modules/${encodeURIComponent(definition.module_key)}/records/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await loadRecords(definition);
      showNotice("A rekord inaktiválva és naplózva lett.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Az inaktiválás nem sikerült.");
    }
  };

  const exportCsv = async () => {
    if (!definition) return;
    try {
      const response = await apiFetch(`${API_BASE}/spec-modules/${encodeURIComponent(definition.module_key)}/export`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${definition.module_key}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showNotice("A CSV-export elkészült.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Az export nem sikerült.");
    }
  };

  const visibleFields = useMemo(() => (definition?.fields || []).slice(0, 3), [definition]);

  return (
    <main className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">{definition?.category || "Kleoszalon VIR"}</p>
          <h1>{title}</h1>
          <p className="module-page__lead">
            {definition?.description || "A specifikáció szerinti adatbázis-alapú modul."}
          </p>
          {definition?.spec_reference && <span className="module-page__reference">{definition.spec_reference}</span>}
        </div>
        {canCreate && <button className="module-page__primary" onClick={openCreate} disabled={!definition}>
          <Plus size={17} /> Új {definition?.entity_label || "bejegyzés"}
        </button>}
      </header>

      {error && (
        <div className="module-page__alert" role="alert">
          <AlertTriangle size={18} /><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button>
        </div>
      )}

      <section className="module-page__metrics" aria-label="Összesítés">
        <article><span>Összes rekord</span><strong>{summary.total || 0}</strong><small>Aktív adatállomány</small></article>
        <article><span>Folyamatban</span><strong>{summary.active || 0}</strong><small>Operatív tételek</small></article>
        <article><span>Ma módosítva</span><strong>{summary.changed_today || 0}</strong><small>Napi aktivitás</small></article>
        <article className={summary.overdue ? "metric-warning" : ""}><span>Lejárt határidő</span><strong>{summary.overdue || 0}</strong><small>{summary.overdue ? "Beavatkozást igényel" : "Nincs elmaradás"}</small></article>
      </section>

      <section className="module-page__panel">
        <div className="module-page__toolbar">
          <label className="module-page__search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés név, azonosító vagy részletes adat alapján…" />
          </label>
          <div className="module-page__actions">
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Állapotszűrő">
              <option value="">Minden állapot</option>
              {(definition?.statuses || []).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
            </select>
            <button onClick={load} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={16}/> Frissítés</button>
            {canExport && <button onClick={exportCsv} disabled={!definition}><Download size={16}/> CSV export</button>}
          </div>
        </div>

        <div className="module-page__table-wrap">
          <table className="module-page__table">
            <thead><tr><th>Megnevezés</th><th>Részletek</th><th>Állapot</th><th>Határidő</th><th>Módosítva</th><th aria-label="Műveletek"/></tr></thead>
            <tbody>
              {loading && !items.length ? (
                <tr><td colSpan={6} className="module-page__empty-row">Adatok betöltése…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="module-page__empty-row">
                  <div className="module-page__empty-icon">K</div>
                  <strong>{query ? `Nincs találat erre: „${query}”` : "Még nincs rögzített adat."}</strong>
                  <span>Az első rekord az „Új” gombbal hozható létre.</span>
                </td></tr>
              ) : items.map((item) => (
                <tr key={item.id}>
                  <td><div className="module-record-title"><b>{item.title}</b><small>{item.reference_no || "Automatikus azonosító"}</small></div></td>
                  <td><div className="module-record-details">{visibleFields.map((field) => {
                    const raw = item.payload?.[field.key];
                    if (raw === undefined || raw === null || raw === "") return null;
                    return <span key={field.key}><small>{field.label}</small><b>{typeof raw === "boolean" ? (raw ? "Igen" : "Nem") : String(raw)}</b></span>;
                  })}</div></td>
                  <td><span className={`module-status status-${item.status.replace(/[^a-z0-9_-]/gi, "")}`}>{statusLabel(item.status)}</span><small className={`module-priority priority-${item.priority}`}>{priorityLabels[item.priority] || item.priority}</small></td>
                  <td><span className="module-date"><CalendarClock size={15}/>{formatDate(item.due_at, true)}</span></td>
                  <td>{formatDate(item.updated_at, true)}</td>
                  <td><div className="module-row-actions">{canEdit && <button onClick={() => openEdit(item)} title="Szerkesztés"><Edit3 size={16}/></button>}{canDelete && <button onClick={() => deactivate(item)} title="Inaktiválás"><Trash2 size={16}/></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editor && definition && (
        <div className="module-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditor(null)}>
          <form className="module-modal" onSubmit={save}>
            <header><div><p>{definition.category}</p><h2>{editor.id ? `${definition.entity_label || "Bejegyzés"} szerkesztése` : `Új ${definition.entity_label || "bejegyzés"}`}</h2></div><button type="button" onClick={() => setEditor(null)}><X/></button></header>
            <div className="module-modal__body">
              <section>
                <h3>Alapadatok</h3>
                <div className="module-form-grid">
                  <label className="wide"><span>Megnevezés *</span><input required autoFocus value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })}/></label>
                  <label><span>Azonosító</span><input value={editor.reference_no} onChange={(event) => setEditor({ ...editor, reference_no: event.target.value })} placeholder="automatikus"/></label>
                  <label><span>Állapot</span><select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })}>{definition.statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
                  <label><span>Prioritás</span><select value={editor.priority} onChange={(event) => setEditor({ ...editor, priority: event.target.value })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label><span>Határidő</span><input type="datetime-local" value={editor.due_at} onChange={(event) => setEditor({ ...editor, due_at: event.target.value })}/></label>
                  <label><span>Összeg</span><input type="number" step="0.01" value={editor.amount} onChange={(event) => setEditor({ ...editor, amount: event.target.value })}/></label>
                  <label><span>Deviza</span><select value={editor.currency} onChange={(event) => setEditor({ ...editor, currency: event.target.value })}><option>HUF</option><option>EUR</option><option>USD</option></select></label>
                </div>
              </section>
              <section>
                <h3>Modulspecifikus adatok</h3>
                <div className="module-form-grid">
                  {definition.fields.map((field) => {
                    const value = editor.payload[field.key];
                    const update = (next: unknown) => setEditor({ ...editor, payload: { ...editor.payload, [field.key]: next } });
                    if (field.type === "checkbox") {
                      return <label key={field.key} className="module-checkbox wide"><input type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)}/><span>{field.label}</span></label>;
                    }
                    if (field.type === "textarea") {
                      return <label key={field.key} className="wide"><span>{field.label}{field.required ? " *" : ""}</span><textarea required={field.required} rows={4} value={String(value ?? "")} onChange={(event) => update(event.target.value)}/></label>;
                    }
                    if (field.type === "select") {
                      return <label key={field.key}><span>{field.label}{field.required ? " *" : ""}</span><select required={field.required} value={String(value ?? "")} onChange={(event) => update(event.target.value)}><option value="">Válasszon…</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
                    }
                    return <label key={field.key}><span>{field.label}{field.required ? " *" : ""}</span><input type={field.type || "text"} required={field.required} value={String(value ?? "")} onChange={(event) => update(event.target.value)}/></label>;
                  })}
                </div>
              </section>
            </div>
            <footer><button type="button" onClick={() => setEditor(null)}>Mégse</button><button className="module-page__primary" disabled={saving}>{saving ? "Mentés…" : <><CheckCircle2 size={17}/> Mentés</>}</button></footer>
          </form>
        </div>
      )}

      {notice && <div className="module-page__toast" role="status"><CheckCircle2 size={17}/>{notice}</div>}
    </main>
  );
}
