import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Download, RefreshCw, RotateCcw, ShieldCheck, Trash2, WalletCards, Boxes, Users, Settings2 } from "lucide-react";
import api from "../api/api";
import { useCapabilities } from "../hooks/useCapabilities";
import LanguageSwitcher from "../components/LanguageSwitcher";
import UnifiedFilterToolbar from "../components/UnifiedFilterToolbar";
import { useLanguage } from "../i18n/LanguageProvider";
import { applyColumnFilters, ColumnFilter } from "../utils/tableFilters";
import ArchiveCenterPage from "./ArchiveCenterPage";
import "./AuditLogPage.css";

type Row = {
  id: number;
  occurred_at: string;
  actor_key?: string;
  actor_name?: string;
  location_id?: string;
  module_key: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  severity?: string;
  summary?: string;
  before_data?: any;
  after_data?: any;
  metadata?: any;
};
type Summary = { today: number; last_7_days: number; deletes: number; restores?: number; errors?: number; finance_events: number; inventory_events: number; hr_events: number; admin_events: number; crm_events?: number };
const labelsHu: Record<string, string> = { finance: "Pénzügy", inventory: "Raktár", hr: "HR", administration: "Adminisztráció", system: "Rendszer", crm: "CRM", insert: "Létrehozás", update: "Módosítás", delete: "Törlés", soft_delete: "Lomtárba helyezés", restore: "Visszaállítás", deactivate: "Inaktiválás", info: "Információ", warning: "Figyelmeztetés", error: "Hiba", critical: "Kritikus" };
const labelsEn: Record<string, string> = { finance: "Finance", inventory: "Inventory", hr: "HR", administration: "Administration", system: "System", crm: "CRM", insert: "Create", update: "Update", delete: "Delete", soft_delete: "Move to recycle bin", restore: "Restore", deactivate: "Deactivate", info: "Information", warning: "Warning", error: "Error", critical: "Critical" };
const PAGE_SIZE = 100;
const controlStyle: React.CSSProperties = { width: "100%", minWidth: 90, height: 30, fontSize: 12, padding: "3px 6px", boxSizing: "border-box" };

export default function AuditLogPage() {
  const { language, locale, t } = useLanguage();
  const [view, setView] = useState<"audit" | "archive">("audit");
  const [rows, setRows] = useState<Row[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [severity, setSeverity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({ time: "", module: "", action: "", severity: "", entity: "", entityId: "", actor: "", location: "" });
  const { menu } = useCapabilities();
  const canExport = menu("settings.audit", "can_export");
  const label = language === "en" ? labelsEn : labelsHu;

  const params = () => ({ q: q || undefined, module: module || undefined, action: action || undefined, severity: severity || undefined, from: from || undefined, to: to || undefined, location_id: locationId || undefined, limit: 500 });
  const load = async () => {
    setLoading(true); setError("");
    try {
      const [a, b] = await Promise.all([api.get("/transactions/audit", { params: params() }), api.get("/transactions/audit/summary")]);
      setRows(Array.isArray(a.data) ? a.data : []); setSum(b.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Audit load failed.");
    } finally { setLoading(false); }
  };
  const exportCsv = async () => {
    setError("");
    try {
      const r = await api.get("/transactions/audit/export.csv", { params: params(), responseType: "blob" });
      const url = URL.createObjectURL(r.data); const a = document.createElement("a"); a.href = url; a.download = `kleoszalon-audit-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e: any) { setError(e?.response?.data?.error || "Audit export failed."); }
  };
  useEffect(() => { if (view === "audit") void load(); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = useMemo(() => [
    { t: t("audit.today"), v: sum?.today || 0, i: <ShieldCheck /> }, { t: t("audit.last7"), v: sum?.last_7_days || 0, i: <RefreshCw /> },
    { t: t("audit.finance"), v: sum?.finance_events || 0, i: <WalletCards /> }, { t: t("audit.inventory"), v: sum?.inventory_events || 0, i: <Boxes /> },
    { t: t("audit.hr"), v: sum?.hr_events || 0, i: <Users /> }, { t: t("audit.admin"), v: sum?.admin_events || 0, i: <Settings2 /> },
    { t: t("audit.deletes"), v: sum?.deletes || 0, i: <Trash2 /> }, { t: language === "en" ? "Restores" : "Visszaállítások", v: sum?.restores || 0, i: <RotateCcw /> },
    { t: language === "en" ? "Errors" : "Hibák", v: sum?.errors || 0, i: <AlertTriangle /> }
  ], [sum, t, language]);

  const localFilters = useMemo<ColumnFilter<Row>[]>(() => [
    { id: "time", kind: "text", value: columnFilters.time, getValue: r => new Date(r.occurred_at).toLocaleString(locale) },
    { id: "module", kind: "select", value: columnFilters.module, getValue: r => r.module_key },
    { id: "action", kind: "select", value: columnFilters.action, getValue: r => r.action },
    { id: "severity", kind: "select", value: columnFilters.severity, getValue: r => r.severity || "info" },
    { id: "entity", kind: "text", value: columnFilters.entity, getValue: r => r.entity_type },
    { id: "entityId", kind: "text", value: columnFilters.entityId, getValue: r => r.entity_id || "" },
    { id: "actor", kind: "text", value: columnFilters.actor, getValue: r => r.actor_name || r.actor_key || "System / DB" },
    { id: "location", kind: "text", value: columnFilters.location, getValue: r => r.location_id || "" }
  ], [columnFilters, locale]);
  const filteredRows = useMemo(() => applyColumnFilters(rows, localFilters, locale), [rows, localFilters, locale]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredRows, page]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [columnFilters]);

  const setColumn = (key: keyof typeof columnFilters, value: string) => setColumnFilters(prev => ({ ...prev, [key]: value }));
  const apply = () => { setPage(1); void load(); };
  const reset = () => { setQ(""); setModule(""); setAction(""); setSeverity(""); setFrom(""); setTo(""); setLocationId(""); setColumnFilters({ time: "", module: "", action: "", severity: "", entity: "", entityId: "", actor: "", location: "" }); setPage(1); };

  if (view === "archive") return <div><div style={{ display: "flex", gap: 8, padding: "16px 24px 0" }}><button onClick={() => setView("audit")}><ShieldCheck size={16} /> {t("audit.title")}</button><button disabled><Archive size={16} /> {t("recycle.title")}</button></div><ArchiveCenterPage /></div>;

  return <main className="audit-page">
    <header className="audit-hero"><div><span>{t("audit.eyebrow")}</span><h1>{t("audit.title")}</h1><p>{t("audit.description")}</p></div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><LanguageSwitcher compact /><button onClick={() => setView("archive")}><Archive size={16} /> {t("recycle.title")}</button>{canExport && <button onClick={exportCsv}><Download size={16} /> {t("audit.export")}</button>}<button onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> {t("common.refresh")}</button></div></header>
    <div className="audit-cards">{cards.map(c => <article key={c.t}><i>{c.i}</i><div><small>{c.t}</small><strong>{c.v.toLocaleString(locale)}</strong></div></article>)}</div>
    <section className="audit-panel">
      <UnifiedFilterToolbar query={q} onQueryChange={setQ} placeholder={t("audit.search")} count={filteredRows.length} onApply={apply} onReset={reset} selects={[{ key: "module", value: module, onChange: setModule, options: [{ value: "", label: t("audit.module") }, { value: "finance", label: label.finance }, { value: "inventory", label: label.inventory }, { value: "hr", label: "HR" }, { value: "administration", label: label.administration }, { value: "crm", label: "CRM" }] }, { key: "action", value: action, onChange: setAction, options: [{ value: "", label: t("audit.action") }, { value: "insert", label: label.insert }, { value: "update", label: label.update }, { value: "delete", label: label.delete }, { value: "soft_delete", label: label.soft_delete }, { value: "restore", label: label.restore }] }, { key: "severity", value: severity, onChange: setSeverity, options: [{ value: "", label: language === "en" ? "All severities" : "Minden súlyosság" }, { value: "info", label: label.info }, { value: "warning", label: label.warning }, { value: "error", label: label.error }, { value: "critical", label: label.critical }] }]} actions={<><input type="date" value={from} onChange={e => setFrom(e.target.value)} title={language === "en" ? "From" : "Dátumtól"} /><input type="date" value={to} onChange={e => setTo(e.target.value)} title={language === "en" ? "To" : "Dátumig"} /><input value={locationId} onChange={e => setLocationId(e.target.value)} placeholder={language === "en" ? "Location ID" : "Telephely azonosító"} style={{ height: 38, minWidth: 150 }} /></>} />
      {error && <div className="audit-error">{error}</div>}
      <div className="audit-table-wrap"><table><thead>
        <tr><th>{language === "en" ? "Time" : "Időpont"}</th><th>{language === "en" ? "Module" : "Modul"}</th><th>{language === "en" ? "Action" : "Művelet"}</th><th>{language === "en" ? "Severity" : "Súlyosság"}</th><th>{language === "en" ? "Object" : "Objektum"}</th><th>{language === "en" ? "Identifier" : "Azonosító"}</th><th>{language === "en" ? "User" : "Felhasználó"}</th><th>{language === "en" ? "Location" : "Telephely"}</th><th>{language === "en" ? "Change" : "Változás"}</th></tr>
        <tr className="audit-column-filters">
          <th><input aria-label="audit-time-filter" style={controlStyle} value={columnFilters.time} onChange={e => setColumn("time", e.target.value)} placeholder={language === "en" ? "Filter" : "Szűrés"} /></th>
          <th><select aria-label="audit-module-filter" style={controlStyle} value={columnFilters.module} onChange={e => setColumn("module", e.target.value)}><option value="">{t("common.all")}</option><option value="finance">{label.finance}</option><option value="inventory">{label.inventory}</option><option value="hr">HR</option><option value="administration">{label.administration}</option><option value="crm">CRM</option><option value="system">{label.system}</option></select></th>
          <th><select aria-label="audit-action-filter" style={controlStyle} value={columnFilters.action} onChange={e => setColumn("action", e.target.value)}><option value="">{t("common.all")}</option><option value="insert">{label.insert}</option><option value="update">{label.update}</option><option value="delete">{label.delete}</option><option value="soft_delete">{label.soft_delete}</option><option value="restore">{label.restore}</option></select></th>
          <th><select aria-label="audit-severity-filter" style={controlStyle} value={columnFilters.severity} onChange={e => setColumn("severity", e.target.value)}><option value="">{t("common.all")}</option><option value="info">{label.info}</option><option value="warning">{label.warning}</option><option value="error">{label.error}</option><option value="critical">{label.critical}</option></select></th>
          <th><input aria-label="audit-object-filter" style={controlStyle} value={columnFilters.entity} onChange={e => setColumn("entity", e.target.value)} /></th>
          <th><input aria-label="audit-identifier-filter" style={controlStyle} value={columnFilters.entityId} onChange={e => setColumn("entityId", e.target.value)} /></th>
          <th><input aria-label="audit-user-filter" style={controlStyle} value={columnFilters.actor} onChange={e => setColumn("actor", e.target.value)} /></th>
          <th><input aria-label="audit-location-filter" style={controlStyle} value={columnFilters.location} onChange={e => setColumn("location", e.target.value)} /></th><th />
        </tr>
      </thead><tbody>{visibleRows.map(r => <tr key={r.id}><td>{new Date(r.occurred_at).toLocaleString(locale)}</td><td><span className={`audit-pill m-${r.module_key}`}>{label[r.module_key] || r.module_key}</span></td><td><span className={`audit-pill a-${r.action}`}>{label[r.action] || r.action}</span></td><td><span className={`audit-pill severity-${r.severity || "info"}`}>{label[r.severity || "info"] || r.severity || "info"}</span></td><td>{r.entity_type}</td><td>{r.entity_id || "—"}</td><td>{r.actor_name || r.actor_key || "System / DB"}</td><td>{r.location_id || "—"}</td><td><details><summary>{r.summary || t("common.details")}</summary><pre>{JSON.stringify({ before: r.before_data, after: r.after_data, metadata: r.metadata }, null, 2)}</pre></details></td></tr>)}{!filteredRows.length && !loading && <tr><td colSpan={9} className="audit-empty">{t("audit.empty")}</td></tr>}</tbody></table></div>
      {filteredRows.length > PAGE_SIZE && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 14, fontSize: 13 }}><span>{language === "en" ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredRows.length)} of ${filteredRows.length}` : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredRows.length)} / ${filteredRows.length} találat`}</span><div style={{ display: "flex", gap: 8 }}><button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{language === "en" ? "Previous" : "Előző"}</button><button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{language === "en" ? "Next" : "Következő"}</button></div></div>}
    </section>
  </main>;
}
