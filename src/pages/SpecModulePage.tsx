import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Download, Edit3, Filter, Plus, RefreshCw, Search, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import ModulePlaceholderPage from "./ModulePlaceholderPage";
import withBase from "../utils/apiBase";
import "./SpecModulePage.css";

type FieldType = "text" | "textarea" | "number" | "date" | "datetime-local" | "email" | "checkbox" | "select";
type Option = { value: string; label: string };
type Field = { key: string; label: string; type: FieldType; required?: boolean; placeholder?: string; options?: Option[] };
type ModuleDefinition = {
  module_key: string;
  route: string;
  group: string;
  title: string;
  description: string;
  kind: string;
  statuses: Option[];
  fields: Field[];
};
type CatalogResponse = { modules?: ModuleDefinition[] };
type ModuleRecord = {
  id: string;
  record_no: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  amount?: number | string | null;
  currency?: string | null;
  start_at?: string | null;
  due_at?: string | null;
  is_active: boolean;
  location_name?: string | null;
  updated_at: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const OPEN_STATUSES = new Set(["open", "new", "pending", "submitted", "in_progress", "investigating", "pending_moderation", "draft"]);
const CLOSED_STATUSES = new Set(["completed", "approved", "paid", "posted", "received", "resolved", "closed", "published"]);

const headers = () => {
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(withBase(path), {
    ...init,
    credentials: "include",
    headers: { ...headers(), ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) },
  });
  const text = await response.text();
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
  return payload as T;
}

function displayValue(record: ModuleRecord, key: string) {
  const direct = record[key];
  const value = direct !== undefined && direct !== null && direct !== "" ? direct : record.data?.[key];
  if (typeof value === "boolean") return value ? "Igen" : "Nem";
  if (Array.isArray(value)) return value.join(", ");
  return value == null || value === "" ? "–" : String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("hu-HU", { dateStyle: "medium", timeStyle: "short" });
}

function formatAmount(value?: number | string | null, currency = "HUF") {
  if (value === null || value === undefined || value === "") return "–";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: currency || "HUF", maximumFractionDigits: 0 }).format(number);
}

function toInputDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 16);
}

export default function SpecModulePage() {
  const location = useLocation();
  const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [items, setItems] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRecord | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setCatalogLoaded(false);
    jsonRequest<CatalogResponse>("vir-modules/catalog")
      .then((catalog) => {
        if (!active) return;
        const normalized = location.pathname.replace(/\/$/, "") || "/";
        setDefinition((catalog.modules || []).find((item) => item.route === normalized) || null);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "A modulkatalógus nem tölthető be."))
      .finally(() => active && setCatalogLoaded(true));
    return () => { active = false; };
  }, [location.pathname]);

  const load = useCallback(async () => {
    if (!definition) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (status) params.set("status", status);
      if (includeInactive) params.set("include_inactive", "1");
      const rows = await jsonRequest<ModuleRecord[]>(`vir-modules/${encodeURIComponent(definition.module_key)}?${params.toString()}`);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Az adatok betöltése nem sikerült.");
    } finally {
      setLoading(false);
    }
  }, [definition, query, status, includeInactive]);

  useEffect(() => { void load(); }, [definition, includeInactive, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = useMemo(() => {
    const activeItems = items.filter((item) => item.is_active !== false);
    const now = Date.now();
    return {
      total: activeItems.length,
      open: activeItems.filter((item) => OPEN_STATUSES.has(item.status)).length,
      completed: activeItems.filter((item) => CLOSED_STATUSES.has(item.status)).length,
      overdue: activeItems.filter((item) => item.due_at && new Date(item.due_at).getTime() < now && !CLOSED_STATUSES.has(item.status)).length,
    };
  }, [items]);

  const openEditor = (record?: ModuleRecord) => {
    setEditing(record || null);
    const initial: Record<string, any> = record
      ? { ...record.data, ...record }
      : { status: definition?.statuses[0]?.value || "draft", priority: "normal", currency: "HUF" };
    for (const field of definition?.fields || []) {
      if (field.type === "datetime-local" && initial[field.key]) initial[field.key] = toInputDate(initial[field.key]);
      if (field.type === "checkbox") initial[field.key] = Boolean(initial[field.key]);
    }
    setForm(initial);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm({});
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!definition) return;
    if (!String(form.title || "").trim()) { setError("A megnevezés kötelező."); return; }
    setSaving(true);
    setError("");
    try {
      const path = editing
        ? `vir-modules/${encodeURIComponent(definition.module_key)}/${editing.id}`
        : `vir-modules/${encodeURIComponent(definition.module_key)}`;
      await jsonRequest(path, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      setEditorOpen(false);
      setEditing(null);
      setForm({});
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "A mentés nem sikerült.");
    } finally {
      setSaving(false);
    }
  };

  const quickComplete = async (record: ModuleRecord) => {
    if (!definition) return;
    const completedStatus = definition.statuses.find((item) => CLOSED_STATUSES.has(item.value))?.value || "completed";
    try {
      await jsonRequest(`vir-modules/${encodeURIComponent(definition.module_key)}/${record.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: completedStatus, completed_at: new Date().toISOString() }),
      });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "A státusz módosítása nem sikerült."); }
  };

  const archive = async (record: ModuleRecord) => {
    if (!definition || !window.confirm(`Archiválja ezt a rekordot: ${record.title}?`)) return;
    try {
      await jsonRequest(`vir-modules/${encodeURIComponent(definition.module_key)}/${record.id}`, { method: "DELETE" });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Az archiválás nem sikerült."); }
  };

  const exportCsv = () => {
    if (!definition || !items.length) return;
    const lines = [
      ["Azonosító", "Megnevezés", "Státusz", "Prioritás", "Összeg", "Határidő", "Telephely", "Módosítva"],
      ...items.map((item) => [item.record_no, item.title, item.status, item.priority, item.amount ?? "", item.due_at ?? "", item.location_name ?? "", item.updated_at]),
    ];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${definition.module_key}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!catalogLoaded) return <main className="spec-module"><div className="spec-module__loading">Modul betöltése…</div></main>;
  if (!definition) return <ModulePlaceholderPage />;

  const statusLabel = (value: string) => definition.statuses.find((item) => item.value === value)?.label || value;

  return (
    <main className="spec-module">
      <header className="spec-module__header">
        <div>
          <p className="spec-module__eyebrow">{definition.group}</p>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
        </div>
        <button className="spec-button spec-button--primary" type="button" onClick={() => openEditor()}><Plus size={17}/> Új rekord</button>
      </header>

      {error && <div className="spec-module__alert"><span>{error}</span><button type="button" onClick={() => setError("")}><X size={16}/></button></div>}

      <section className="spec-module__metrics" aria-label="Modul összesítés">
        <article><span>Aktív rekord</span><strong>{metrics.total}</strong><small>Aktuális jogosultsági kör</small></article>
        <article><span>Nyitott</span><strong>{metrics.open}</strong><small>Beavatkozást igényel</small></article>
        <article><span>Lezárt</span><strong>{metrics.completed}</strong><small>Teljesített vagy jóváhagyott</small></article>
        <article className={metrics.overdue ? "is-warning" : ""}><span>Lejárt határidő</span><strong>{metrics.overdue}</strong><small>{metrics.overdue ? "Ellenőrzés szükséges" : "Nincs elmaradás"}</small></article>
      </section>

      <section className="spec-module__panel">
        <div className="spec-module__toolbar">
          <form className="spec-module__search" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés az összes mezőben…"/><button type="submit">Keresés</button>
          </form>
          <div className="spec-module__filters">
            <label><Filter size={15}/><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Minden státusz</option>{definition.statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="spec-module__inactive"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)}/> Archiváltak</label>
            <button type="button" onClick={() => void load()} title="Frissítés"><RefreshCw size={16}/></button>
            <button type="button" onClick={exportCsv} disabled={!items.length}><Download size={16}/> CSV</button>
          </div>
        </div>

        <div className="spec-module__table-wrap">
          <table className="spec-module__table">
            <thead><tr><th>Azonosító / megnevezés</th><th>Státusz</th><th>Összeg</th><th>Határidő</th><th>Telephely</th><th>Műveletek</th></tr></thead>
            <tbody>
              {items.map((record) => (
                <tr key={record.id} className={record.is_active === false ? "is-inactive" : ""}>
                  <td><button className="spec-module__title-button" type="button" onClick={() => openEditor(record)}><small>{record.record_no}</small><strong>{record.title}</strong><span>{record.description || displayValue(record, definition.fields[0]?.key || "")}</span></button></td>
                  <td><span className={`spec-status spec-status--${record.status}`}>{statusLabel(record.status)}</span></td>
                  <td>{formatAmount(record.amount, record.currency || "HUF")}</td>
                  <td>{formatDate(record.due_at)}</td>
                  <td>{record.location_name || "Központi"}</td>
                  <td><div className="spec-module__row-actions"><button type="button" onClick={() => openEditor(record)} title="Szerkesztés"><Edit3 size={15}/></button>{record.is_active !== false && !CLOSED_STATUSES.has(record.status) && <button type="button" onClick={() => void quickComplete(record)} title="Lezárás"><CheckCircle2 size={15}/></button>}<button type="button" onClick={() => void archive(record)} title="Archiválás"><Archive size={15}/></button></div></td>
                </tr>
              ))}
              {!loading && !items.length && <tr><td colSpan={6}><div className="spec-module__empty"><span>K</span><strong>Még nincs rögzített adat</strong><p>Hozza létre az első bejegyzést az „Új rekord” gombbal.</p></div></td></tr>}
              {loading && <tr><td colSpan={6}><div className="spec-module__loading">Adatok betöltése…</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editorOpen && (
        <div className="spec-editor" role="dialog" aria-modal="true" aria-label={`${definition.title} szerkesztése`}>
          <button className="spec-editor__backdrop" type="button" onClick={closeEditor} aria-label="Bezárás"/>
          <form className="spec-editor__panel" onSubmit={save}>
            <header><div><p>{definition.group}</p><h2>{editing ? "Rekord szerkesztése" : "Új rekord létrehozása"}</h2></div><button type="button" onClick={closeEditor}><X size={19}/></button></header>
            <div className="spec-editor__body">
              <label className="spec-field spec-field--wide"><span>Megnevezés *</span><input required value={form.title || ""} onChange={(event) => setForm((old) => ({ ...old, title: event.target.value }))}/></label>
              <label className="spec-field"><span>Státusz</span><select value={form.status || ""} onChange={(event) => setForm((old) => ({ ...old, status: event.target.value }))}>{definition.statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              {definition.fields.map((field) => {
                const value = form[field.key] ?? (field.type === "checkbox" ? false : "");
                const update = (next: any) => setForm((old) => ({ ...old, [field.key]: next }));
                if (field.type === "textarea") return <label key={field.key} className="spec-field spec-field--wide"><span>{field.label}{field.required ? " *" : ""}</span><textarea required={field.required} value={value} onChange={(event) => update(event.target.value)} placeholder={field.placeholder}/></label>;
                if (field.type === "checkbox") return <label key={field.key} className="spec-field spec-field--check"><input type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)}/><span>{field.label}</span></label>;
                if (field.type === "select") return <label key={field.key} className="spec-field"><span>{field.label}{field.required ? " *" : ""}</span><select required={field.required} value={value} onChange={(event) => update(event.target.value)}><option value="">Válasszon…</option>{(field.options || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
                return <label key={field.key} className="spec-field"><span>{field.label}{field.required ? " *" : ""}</span><input type={field.type} required={field.required} value={value} onChange={(event) => update(field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} placeholder={field.placeholder}/></label>;
              })}
              <label className="spec-field spec-field--wide"><span>Leírás / megjegyzés</span><textarea value={form.description || ""} onChange={(event) => setForm((old) => ({ ...old, description: event.target.value }))}/></label>
            </div>
            <footer><button className="spec-button" type="button" onClick={closeEditor}>Mégse</button><button className="spec-button spec-button--primary" type="submit" disabled={saving}>{saving ? "Mentés…" : "Mentés"}</button></footer>
          </form>
        </div>
      )}
    </main>
  );
}
