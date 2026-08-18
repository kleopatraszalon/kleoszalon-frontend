import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileCheck2,
  History,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import api from "../api/api";
import "./ManagementImprovementPage.css";

const BASE = "/transactions/operations-quality/improvement";

type Dashboard = {
  total: number;
  active: number;
  awaiting_approval: number;
  overdue: number;
  closed: number;
  open_capa: number;
  overdue_actions: number;
};

type Employee = { id: string; full_name: string; position_id?: string; location_id?: string };

type Project = {
  id: string;
  code: string;
  title: string;
  problem_statement?: string | null;
  objective?: string | null;
  methodology?: string[] | null;
  analysis_data?: Record<string, unknown> | null;
  owner_employee_id?: string | null;
  owner_name?: string | null;
  location_id?: string | null;
  priority: "low" | "normal" | "high" | "critical";
  status: "draft" | "active" | "review" | "approved" | "closed" | "cancelled";
  start_date?: string | null;
  due_date?: string | null;
  approval_state: "not_requested" | "pending" | "approved" | "rejected";
  approval_requested_by?: string | null;
  approval_requested_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  approval_comment?: string | null;
  open_actions?: number;
  capa_actions?: number;
  kpi_count?: number;
  overdue_actions?: number;
  created_at?: string;
  updated_at?: string;
};

type CapaAction = {
  id: string;
  action_type: "correction" | "corrective" | "preventive" | "improvement";
  title: string;
  description?: string | null;
  root_cause?: string | null;
  owner_employee_id?: string | null;
  owner_name?: string | null;
  due_date?: string | null;
  status: "open" | "in_progress" | "completed" | "verified" | "cancelled";
  effectiveness_criteria?: string | null;
  effectiveness_result?: string | null;
  completed_at?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
};

type Kpi = {
  id: string;
  metric_key?: string | null;
  name: string;
  unit?: string | null;
  direction: "higher_better" | "lower_better" | "target";
  before_value?: number | string | null;
  target_value?: number | string | null;
  after_value?: number | string | null;
  before_at?: string | null;
  after_at?: string | null;
  source?: string | null;
  notes?: string | null;
  improvement_value?: number | string | null;
};

type Approval = {
  id: string;
  stage: string;
  decision: "pending" | "approved" | "rejected" | "withdrawn";
  requested_by: string;
  requested_at: string;
  decided_by?: string | null;
  decided_at?: string | null;
  comment?: string | null;
};

type AuditRow = {
  id: number | string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  changes?: Record<string, unknown>;
  request_ip?: string | null;
  created_at: string;
};

type EvidenceKind = "document" | "photo" | "link" | "record" | "measurement" | "other";
type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  title: string;
  reference?: string;
  url?: string;
  captured_at?: string;
  notes?: string;
};

type Detail = { project: Project; actions: CapaAction[]; kpis: Kpi[]; approvals: Approval[]; audit: AuditRow[] };

type ProjectDraft = {
  title: string;
  problem_statement: string;
  objective: string;
  analysis: string;
  lessons_learned: string;
  methodology: string;
  owner_employee_id: string;
  priority: Project["priority"];
  start_date: string;
  due_date: string;
};

type ActionDraft = {
  action_type: CapaAction["action_type"];
  title: string;
  description: string;
  root_cause: string;
  owner_employee_id: string;
  due_date: string;
  effectiveness_criteria: string;
};

type KpiDraft = {
  name: string;
  unit: string;
  direction: Kpi["direction"];
  before_value: string;
  target_value: string;
  after_value: string;
  source: string;
  notes: string;
};

type EvidenceDraft = {
  kind: EvidenceKind;
  title: string;
  reference: string;
  url: string;
  captured_at: string;
  notes: string;
};

const emptyProject: ProjectDraft = {
  title: "",
  problem_statement: "",
  objective: "",
  analysis: "",
  lessons_learned: "",
  methodology: "PDCA",
  owner_employee_id: "",
  priority: "normal",
  start_date: new Date().toISOString().slice(0, 10),
  due_date: "",
};

const emptyAction: ActionDraft = {
  action_type: "corrective",
  title: "",
  description: "",
  root_cause: "",
  owner_employee_id: "",
  due_date: "",
  effectiveness_criteria: "",
};

const emptyKpi: KpiDraft = {
  name: "",
  unit: "",
  direction: "higher_better",
  before_value: "",
  target_value: "",
  after_value: "",
  source: "",
  notes: "",
};

const emptyEvidence: EvidenceDraft = {
  kind: "document",
  title: "",
  reference: "",
  url: "",
  captured_at: new Date().toISOString().slice(0, 10),
  notes: "",
};

const projectStatusLabel: Record<Project["status"], string> = {
  draft: "Tervezet",
  active: "Aktív",
  review: "Jóváhagyás alatt",
  approved: "Jóváhagyva",
  closed: "Lezárva",
  cancelled: "Megszakítva",
};
const priorityLabel: Record<Project["priority"], string> = { low: "Alacsony", normal: "Normál", high: "Magas", critical: "Kritikus" };
const actionStatusLabel: Record<CapaAction["status"], string> = { open: "Nyitott", in_progress: "Folyamatban", completed: "Elvégezve", verified: "Igazolva", cancelled: "Megszakítva" };
const actionTypeLabel: Record<CapaAction["action_type"], string> = { correction: "Korrekció", corrective: "Helyesbítő", preventive: "Megelőző", improvement: "Fejlesztés" };
const approvalLabel: Record<Approval["decision"], string> = { pending: "Függő", approved: "Jóváhagyva", rejected: "Elutasítva", withdrawn: "Visszavonva" };
const evidenceKindLabel: Record<EvidenceKind, string> = {
  document: "Dokumentum",
  photo: "Fénykép",
  link: "Hivatkozás",
  record: "Jegyzőkönyv / rekord",
  measurement: "Mérési bizonyíték",
  other: "Egyéb",
};

function dateInput(value?: string | null) { return value ? String(value).slice(0, 10) : ""; }
function dateLabel(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("hu-HU");
}
function dateTimeLabel(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("hu-HU");
}
function messageOf(error: any) { return String(error?.response?.data?.message || error?.message || "A művelet sikertelen."); }
function numberOrNull(value: string) { return value.trim() === "" ? null : Number(value.replace(",", ".")); }
function analysisText(project: Project | null | undefined, key: string) {
  const data = project?.analysis_data;
  if (!data || typeof data !== "object") return "";
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}
function projectEvidence(project?: Project | null): EvidenceItem[] {
  const data = project?.analysis_data;
  if (!data || typeof data !== "object") return [];
  const raw = (data as Record<string, unknown>).evidence;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    const title = String(row.title || "").trim();
    const id = String(row.id || "").trim();
    if (!id || !title) return [];
    const kindRaw = String(row.kind || "other") as EvidenceKind;
    const kind: EvidenceKind = Object.prototype.hasOwnProperty.call(evidenceKindLabel, kindRaw) ? kindRaw : "other";
    return [{
      id,
      kind,
      title,
      reference: String(row.reference || "").trim() || undefined,
      url: String(row.url || "").trim() || undefined,
      captured_at: String(row.captured_at || "").trim() || undefined,
      notes: String(row.notes || "").trim() || undefined,
    }];
  });
}
function safeEvidenceUrl(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.startsWith("/uploads/")) return raw;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol) ? raw : "";
  } catch { return ""; }
}
function evidenceId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch { /* fallback below */ }
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ManagementImprovementPage() {
  const [dashboard, setDashboard] = useState<Dashboard>({ total: 0, active: 0, awaiting_approval: 0, overdue: 0, closed: 0, open_capa: 0, overdue_actions: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProject);
  const [newProject, setNewProject] = useState<ProjectDraft>(emptyProject);
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyAction);
  const [kpiDraft, setKpiDraft] = useState<KpiDraft>(emptyKpi);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft>(emptyEvidence);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const evidenceLocked = detail?.project.approval_state === "pending" || detail?.project.approval_state === "approved";

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const refreshOverview = useCallback(async () => {
    const [dashRes, projectsRes, employeesRes] = await Promise.all([
      api.get<Dashboard>(`${BASE}/dashboard`),
      api.get<Project[]>(`${BASE}/projects`),
      api.get<Employee[]>(`${BASE}/employees`),
    ]);
    setDashboard(dashRes.data);
    setProjects(projectsRes.data);
    setEmployees(employeesRes.data);
    return projectsRes.data;
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    if (!id) return;
    const response = await api.get<Detail>(`${BASE}/projects/${id}`);
    setDetail(response.data);
    const p = response.data.project;
    setProjectDraft({
      title: p.title || "",
      problem_statement: p.problem_statement || "",
      objective: p.objective || "",
      analysis: analysisText(p, "summary"),
      lessons_learned: analysisText(p, "lessons_learned"),
      methodology: (p.methodology || []).join(", "),
      owner_employee_id: p.owner_employee_id || "",
      priority: p.priority || "normal",
      start_date: dateInput(p.start_date),
      due_date: dateInput(p.due_date),
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await refreshOverview();
      const id = selectedId || rows[0]?.id || "";
      if (id) {
        setSelectedId(id);
        await refreshDetail(id);
      } else {
        setDetail(null);
      }
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [refreshDetail, refreshOverview, selectedId]);

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProject = async (id: string) => {
    setSelectedId(id);
    setError("");
    try { await refreshDetail(id); } catch (e) { setError(messageOf(e)); }
  };

  const afterMutation = async (id = selectedId) => {
    await refreshOverview();
    if (id) await refreshDetail(id);
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await api.post<Project>(`${BASE}/projects`, {
        title: newProject.title,
        problem_statement: newProject.problem_statement,
        objective: newProject.objective,
        analysis_data: { summary: newProject.analysis, lessons_learned: newProject.lessons_learned, evidence: [] },
        methodology: newProject.methodology.split(/[,\n]/).map((x) => x.trim()).filter(Boolean),
        owner_employee_id: newProject.owner_employee_id || null,
        priority: newProject.priority,
        start_date: newProject.start_date || null,
        due_date: newProject.due_date || null,
      });
      setShowCreate(false);
      setNewProject({ ...emptyProject, start_date: new Date().toISOString().slice(0, 10) });
      setSelectedId(response.data.id);
      await afterMutation(response.data.id);
      flash("A fejlesztési projekt létrejött.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const saveProject = async () => {
    if (!detail) return;
    setSaving(true); setError("");
    try {
      await api.patch(`${BASE}/projects/${detail.project.id}`, {
        title: projectDraft.title,
        problem_statement: projectDraft.problem_statement,
        objective: projectDraft.objective,
        analysis_data: {
          ...(detail.project.analysis_data || {}),
          summary: projectDraft.analysis,
          lessons_learned: projectDraft.lessons_learned,
        },
        methodology: projectDraft.methodology.split(/[,\n]/).map((x) => x.trim()).filter(Boolean),
        owner_employee_id: projectDraft.owner_employee_id || null,
        priority: projectDraft.priority,
        start_date: projectDraft.start_date || null,
        due_date: projectDraft.due_date || null,
      });
      await afterMutation(detail.project.id);
      flash("Projektadatok, elemzés és tanulságok mentve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const addEvidence = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    const title = evidenceDraft.title.trim();
    const reference = evidenceDraft.reference.trim();
    const rawUrl = evidenceDraft.url.trim();
    const url = safeEvidenceUrl(rawUrl);
    if (!title) { setError("A bizonyíték megnevezése kötelező."); return; }
    if (rawUrl && !url) { setError("A bizonyíték URL-je csak http/https vagy belső /uploads/ hivatkozás lehet."); return; }
    if (!reference && !url) { setError("Adj meg dokumentumazonosítót / hivatkozási számot vagy URL-t."); return; }
    const next: EvidenceItem[] = [...projectEvidence(detail.project), {
      id: evidenceId(),
      kind: evidenceDraft.kind,
      title,
      reference: reference || undefined,
      url: url || undefined,
      captured_at: evidenceDraft.captured_at || new Date().toISOString().slice(0, 10),
      notes: evidenceDraft.notes.trim() || undefined,
    }];
    setSaving(true); setError("");
    try {
      await api.patch(`${BASE}/projects/${detail.project.id}`, {
        analysis_data: { ...(detail.project.analysis_data || {}), evidence: next },
      });
      setEvidenceDraft({ ...emptyEvidence, captured_at: new Date().toISOString().slice(0, 10) });
      await afterMutation(detail.project.id);
      flash("Bizonyíték hozzáadva és auditálva.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const deleteEvidence = async (id: string) => {
    if (!detail || !window.confirm("Biztosan törlöd ezt a bizonyíték-hivatkozást?")) return;
    const next = projectEvidence(detail.project).filter((row) => row.id !== id);
    setSaving(true); setError("");
    try {
      await api.patch(`${BASE}/projects/${detail.project.id}`, {
        analysis_data: { ...(detail.project.analysis_data || {}), evidence: next },
      });
      await afterMutation(detail.project.id);
      flash("Bizonyíték eltávolítva; a változás az audit trailben megmarad.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const addAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setSaving(true); setError("");
    try {
      await api.post(`${BASE}/projects/${detail.project.id}/actions`, {
        ...actionDraft,
        owner_employee_id: actionDraft.owner_employee_id || null,
        due_date: actionDraft.due_date || null,
      });
      setActionDraft(emptyAction);
      await afterMutation(detail.project.id);
      flash("CAPA/intézkedés rögzítve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const changeActionStatus = async (row: CapaAction, status: CapaAction["status"]) => {
    if (!detail) return;
    let effectiveness_result = row.effectiveness_result || "";
    if (status === "verified" && !effectiveness_result) {
      effectiveness_result = window.prompt("Írd le az eredményesség ellenőrzésének eredményét:")?.trim() || "";
      if (!effectiveness_result) return;
    }
    setSaving(true); setError("");
    try {
      await api.patch(`${BASE}/projects/${detail.project.id}/actions/${row.id}`, { status, effectiveness_result });
      await afterMutation(detail.project.id);
      flash("Intézkedés állapota frissítve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const deleteAction = async (id: string) => {
    if (!detail || !window.confirm("Biztosan törlöd ezt az intézkedést?")) return;
    setSaving(true); setError("");
    try {
      await api.delete(`${BASE}/projects/${detail.project.id}/actions/${id}`);
      await afterMutation(detail.project.id);
      flash("Intézkedés törölve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const addKpi = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setSaving(true); setError("");
    try {
      await api.post(`${BASE}/projects/${detail.project.id}/kpis`, {
        name: kpiDraft.name,
        unit: kpiDraft.unit || null,
        direction: kpiDraft.direction,
        before_value: numberOrNull(kpiDraft.before_value),
        target_value: numberOrNull(kpiDraft.target_value),
        after_value: numberOrNull(kpiDraft.after_value),
        before_at: kpiDraft.before_value ? new Date().toISOString() : null,
        after_at: kpiDraft.after_value ? new Date().toISOString() : null,
        source: kpiDraft.source || null,
        notes: kpiDraft.notes || null,
      });
      setKpiDraft(emptyKpi);
      await afterMutation(detail.project.id);
      flash("KPI rögzítve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const recordAfterKpi = async (row: Kpi) => {
    if (!detail) return;
    const raw = window.prompt(`Utána érték – ${row.name} (${row.unit || "érték"}):`, row.after_value == null ? "" : String(row.after_value));
    if (raw == null || raw.trim() === "") return;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value)) { setError("A KPI utána értéke szám legyen."); return; }
    setSaving(true); setError("");
    try {
      await api.patch(`${BASE}/projects/${detail.project.id}/kpis/${row.id}`, { after_value: value, after_at: new Date().toISOString() });
      await afterMutation(detail.project.id);
      flash("Utána KPI érték rögzítve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const deleteKpi = async (id: string) => {
    if (!detail || !window.confirm("Biztosan törlöd ezt a KPI-t?")) return;
    setSaving(true); setError("");
    try {
      await api.delete(`${BASE}/projects/${detail.project.id}/kpis/${id}`);
      await afterMutation(detail.project.id);
      flash("KPI törölve.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const workflow = async (action: "request-approval" | "approve" | "reject" | "close") => {
    if (!detail) return;
    let payload: Record<string, string> = {};
    if (action === "request-approval") {
      const comment = window.prompt("Jóváhagyási megjegyzés (opcionális):") ?? "";
      payload = { comment };
    }
    if (action === "approve") {
      const comment = window.prompt("Jóváhagyási megjegyzés (saját projekt admin jóváhagyásánál kötelező indok):") ?? "";
      payload = { comment, override_reason: comment };
    }
    if (action === "reject") {
      const comment = window.prompt("Elutasítás indoka:")?.trim() || "";
      if (!comment) return;
      payload = { comment };
    }
    if (action === "close" && !window.confirm("Lezárod a jóváhagyott fejlesztési projektet?")) return;
    setSaving(true); setError("");
    try {
      await api.post(`${BASE}/projects/${detail.project.id}/${action}`, payload);
      await afterMutation(detail.project.id);
      flash(action === "request-approval" ? "Jóváhagyási kérelem elküldve." : action === "approve" ? "Projekt jóváhagyva." : action === "reject" ? "Projekt elutasítva." : "Projekt lezárva.");
    } catch (e) { setError(messageOf(e)); }
    finally { setSaving(false); }
  };

  const selectedProject = detail?.project;
  const evidenceItems = useMemo(() => projectEvidence(detail?.project), [detail]);
  const openActionCount = useMemo(() => detail?.actions.filter((x) => !["verified", "cancelled"].includes(x.status)).length || 0, [detail]);
  const completeKpiCount = useMemo(() => detail?.kpis.filter((x) => x.before_value != null && x.after_value != null).length || 0, [detail]);

  return (
    <div className="mi-page">
      <header className="mi-hero">
        <div>
          <div className="mi-eyebrow"><ClipboardCheck size={16} /> Vállalatirányítási eszközök</div>
          <h1>Fejlesztési projektek és CAPA</h1>
          <p>Elemzés, felelős, határidő, intézkedések, előtte/utána KPI, bizonyítékok, formális jóváhagyás és teljes audit trail egy helyen.</p>
        </div>
        <div className="mi-hero-actions">
          <button className="mi-btn mi-btn-secondary" onClick={() => void load()} disabled={loading || saving}><RefreshCw size={17} /> Frissítés</button>
          <button className="mi-btn mi-btn-primary" onClick={() => setShowCreate(true)}><Plus size={17} /> Új fejlesztési projekt</button>
        </div>
      </header>

      {error && <div className="mi-alert mi-alert-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={() => setError("")}><XCircle size={17} /></button></div>}
      {notice && <div className="mi-alert mi-alert-ok"><CheckCircle2 size={18} /><span>{notice}</span></div>}

      <section className="mi-kpis">
        <div className="mi-stat"><Activity /><span>Aktív projektek</span><strong>{dashboard.active || 0}</strong></div>
        <div className="mi-stat"><ShieldCheck /><span>Jóváhagyásra vár</span><strong>{dashboard.awaiting_approval || 0}</strong></div>
        <div className="mi-stat"><Clock3 /><span>Lejárt projekt</span><strong>{dashboard.overdue || 0}</strong></div>
        <div className="mi-stat"><Target /><span>Nyitott CAPA</span><strong>{dashboard.open_capa || 0}</strong></div>
        <div className="mi-stat"><CheckCircle2 /><span>Lezárt</span><strong>{dashboard.closed || 0}</strong></div>
      </section>

      <main className="mi-workspace">
        <aside className="mi-project-list">
          <div className="mi-section-head"><div><h2>Fejlesztési projektek</h2><small>{projects.length} projekt</small></div></div>
          {loading && <div className="mi-empty">Betöltés…</div>}
          {!loading && projects.length === 0 && <div className="mi-empty">Még nincs fejlesztési projekt.</div>}
          {projects.map((p) => (
            <button key={p.id} className={`mi-project-card ${selectedId === p.id ? "is-active" : ""}`} onClick={() => void selectProject(p.id)}>
              <div className="mi-project-card-top"><span className={`mi-priority is-${p.priority}`}>{priorityLabel[p.priority]}</span><span className={`mi-status is-${p.status}`}>{projectStatusLabel[p.status]}</span></div>
              <strong>{p.title}</strong>
              <small>{p.code}</small>
              <div className="mi-project-meta"><span><UserRound size={14} /> {p.owner_name || "Nincs felelős"}</span><span><Clock3 size={14} /> {dateLabel(p.due_date)}</span></div>
              <div className="mi-project-bottom"><span>CAPA: {p.open_actions || 0}</span><span>KPI: {p.kpi_count || 0}</span><ChevronRight size={16} /></div>
            </button>
          ))}
        </aside>

        <section className="mi-detail">
          {!selectedProject && <div className="mi-empty mi-empty-large"><CircleGauge size={38} /><h2>Válassz projektet</h2><p>A projekt részletes elemzése, CAPA, KPI, bizonyítékai és jóváhagyási nyoma itt jelenik meg.</p></div>}
          {selectedProject && detail && (
            <>
              <div className="mi-detail-head">
                <div>
                  <div className="mi-code">{selectedProject.code}</div>
                  <h2>{selectedProject.title}</h2>
                  <div className="mi-badges"><span className={`mi-status is-${selectedProject.status}`}>{projectStatusLabel[selectedProject.status]}</span><span className={`mi-priority is-${selectedProject.priority}`}>{priorityLabel[selectedProject.priority]}</span><span className={`mi-approval is-${selectedProject.approval_state}`}>Jóváhagyás: {selectedProject.approval_state}</span></div>
                </div>
                <div className="mi-workflow-actions">
                  {!evidenceLocked && selectedProject.status !== "closed" && <button className="mi-btn mi-btn-secondary" onClick={() => void workflow("request-approval")} disabled={saving || openActionCount > 0 || completeKpiCount < 1}><ShieldCheck size={16} /> Jóváhagyásra küldés</button>}
                  {selectedProject.approval_state === "pending" && <button className="mi-btn mi-btn-success" onClick={() => void workflow("approve")} disabled={saving}><CheckCircle2 size={16} /> Jóváhagyás</button>}
                  {selectedProject.approval_state === "pending" && <button className="mi-btn mi-btn-danger" onClick={() => void workflow("reject")} disabled={saving}><XCircle size={16} /> Elutasítás</button>}
                  {selectedProject.approval_state === "approved" && selectedProject.status !== "closed" && <button className="mi-btn mi-btn-primary" onClick={() => void workflow("close")} disabled={saving}><ClipboardCheck size={16} /> Projekt lezárása</button>}
                </div>
              </div>

              <div className="mi-readiness">
                <span className={openActionCount === 0 ? "ok" : "warn"}>{openActionCount === 0 ? <CheckCircle2 /> : <AlertTriangle />} Nyitott intézkedés: {openActionCount}</span>
                <span className={completeKpiCount > 0 ? "ok" : "warn"}>{completeKpiCount > 0 ? <CheckCircle2 /> : <AlertTriangle />} Előtte/utána KPI: {completeKpiCount}</span>
                <span className={evidenceItems.length > 0 ? "ok" : "warn"}>{evidenceItems.length > 0 ? <FileCheck2 /> : <AlertTriangle />} Bizonyíték: {evidenceItems.length}</span>
                {evidenceLocked && <span className="locked"><ShieldCheck /> Bizonyíték zárolva</span>}
              </div>

              <section className="mi-panel">
                <div className="mi-section-head"><div><h3>Projekt és elemzés</h3><small>A jóváhagyásra küldés után az evidencia zárolódik.</small></div><button className="mi-btn mi-btn-primary" onClick={() => void saveProject()} disabled={saving || evidenceLocked || selectedProject.status === "closed"}><Save size={16} /> Mentés</button></div>
                <div className="mi-form-grid">
                  <label className="mi-field mi-span-2">Megnevezés<input value={projectDraft.title} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })} /></label>
                  <label className="mi-field">Felelős<select value={projectDraft.owner_employee_id} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, owner_employee_id: e.target.value })}><option value="">Nincs kijelölve</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>
                  <label className="mi-field">Prioritás<select value={projectDraft.priority} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, priority: e.target.value as Project["priority"] })}>{Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                  <label className="mi-field">Kezdés<input type="date" value={projectDraft.start_date} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, start_date: e.target.value })} /></label>
                  <label className="mi-field">Határidő<input type="date" value={projectDraft.due_date} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, due_date: e.target.value })} /></label>
                  <label className="mi-field mi-span-2">Probléma / fejlesztési lehetőség<textarea rows={3} value={projectDraft.problem_statement} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, problem_statement: e.target.value })} /></label>
                  <label className="mi-field mi-span-2">Cél / elvárt eredmény<textarea rows={3} value={projectDraft.objective} disabled={evidenceLocked} onChange={(e) => setProjectDraft({ ...projectDraft, objective: e.target.value })} /></label>
                  <label className="mi-field mi-span-2">Elemzés<textarea rows={6} value={projectDraft.analysis} disabled={evidenceLocked} placeholder="Tények, ok-okozati elemzés, 5 Why, Ishikawa, kockázatok, megállapítások…" onChange={(e) => setProjectDraft({ ...projectDraft, analysis: e.target.value })} /></label>
                  <label className="mi-field mi-span-2">Tanulságok / standardizálás<textarea rows={3} value={projectDraft.lessons_learned} disabled={evidenceLocked} placeholder="Mit kell szabványosítani, oktatni vagy más telephelyre kiterjeszteni?" onChange={(e) => setProjectDraft({ ...projectDraft, lessons_learned: e.target.value })} /></label>
                  <label className="mi-field mi-span-2">Módszertan<input value={projectDraft.methodology} disabled={evidenceLocked} placeholder="PDCA, 5 Why, Ishikawa" onChange={(e) => setProjectDraft({ ...projectDraft, methodology: e.target.value })} /></label>
                </div>
              </section>

              <section className="mi-panel">
                <div className="mi-section-head"><div><h3>Intézkedések / CAPA</h3><small>Korrekció, helyesbítő és megelőző intézkedés felelőssel és eredményességi igazolással.</small></div></div>
                <div className="mi-records">
                  {detail.actions.map((row) => <article className="mi-record" key={row.id}>
                    <div className="mi-record-main"><div className="mi-record-title"><span className="mi-tag">{actionTypeLabel[row.action_type]}</span><strong>{row.title}</strong></div><p>{row.description || "Nincs külön leírás."}</p>{row.root_cause && <small><b>Gyökérok:</b> {row.root_cause}</small>}<div className="mi-record-meta"><span><UserRound /> {row.owner_name || "Nincs felelős"}</span><span><Clock3 /> {dateLabel(row.due_date)}</span><span><Target /> {row.effectiveness_criteria || "Nincs eredményességi kritérium"}</span></div>{row.effectiveness_result && <div className="mi-effect"><CheckCircle2 /> <span><b>Eredményesség:</b> {row.effectiveness_result}</span></div>}</div>
                    <div className="mi-record-actions"><select value={row.status} disabled={saving || evidenceLocked} onChange={(e) => void changeActionStatus(row, e.target.value as CapaAction["status"])}>{Object.entries(actionStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>{!evidenceLocked && <button className="mi-icon-btn" title="Törlés" onClick={() => void deleteAction(row.id)}><Trash2 size={16} /></button>}</div>
                  </article>)}
                  {detail.actions.length === 0 && <div className="mi-empty">Nincs még CAPA/intézkedés.</div>}
                </div>
                {!evidenceLocked && selectedProject.status !== "closed" && <form className="mi-inline-form" onSubmit={addAction}>
                  <h4>Új intézkedés</h4>
                  <div className="mi-form-grid">
                    <label className="mi-field">Típus<select value={actionDraft.action_type} onChange={(e) => setActionDraft({ ...actionDraft, action_type: e.target.value as CapaAction["action_type"] })}>{Object.entries(actionTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                    <label className="mi-field">Felelős<select value={actionDraft.owner_employee_id} onChange={(e) => setActionDraft({ ...actionDraft, owner_employee_id: e.target.value })}><option value="">Nincs kijelölve</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>
                    <label className="mi-field mi-span-2">Intézkedés megnevezése<input required value={actionDraft.title} onChange={(e) => setActionDraft({ ...actionDraft, title: e.target.value })} /></label>
                    <label className="mi-field mi-span-2">Leírás<textarea rows={2} value={actionDraft.description} onChange={(e) => setActionDraft({ ...actionDraft, description: e.target.value })} /></label>
                    <label className="mi-field">Gyökérok<input value={actionDraft.root_cause} onChange={(e) => setActionDraft({ ...actionDraft, root_cause: e.target.value })} /></label>
                    <label className="mi-field">Határidő<input type="date" value={actionDraft.due_date} onChange={(e) => setActionDraft({ ...actionDraft, due_date: e.target.value })} /></label>
                    <label className="mi-field mi-span-2">Eredményességi kritérium<input value={actionDraft.effectiveness_criteria} onChange={(e) => setActionDraft({ ...actionDraft, effectiveness_criteria: e.target.value })} /></label>
                  </div>
                  <button className="mi-btn mi-btn-secondary" disabled={saving}><Plus size={16} /> Intézkedés hozzáadása</button>
                </form>}
              </section>

              <section className="mi-panel">
                <div className="mi-section-head"><div><h3>Előtte / utána KPI</h3><small>A jóváhagyáshoz legalább egy teljes előtte–utána mérés kötelező.</small></div></div>
                <div className="mi-kpi-table-wrap"><table className="mi-table"><thead><tr><th>KPI</th><th>Előtte</th><th>Cél</th><th>Utána</th><th>Változás</th><th>Forrás</th><th></th></tr></thead><tbody>{detail.kpis.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.direction}</small></td><td>{row.before_value ?? "—"} {row.unit || ""}</td><td>{row.target_value ?? "—"} {row.unit || ""}</td><td>{row.after_value ?? "—"} {row.unit || ""}</td><td>{row.improvement_value ?? "—"}</td><td>{row.source || "—"}</td><td><div className="mi-row-buttons">{!evidenceLocked && <button className="mi-link" onClick={() => void recordAfterKpi(row)}>Utána érték</button>}{!evidenceLocked && <button className="mi-icon-btn" onClick={() => void deleteKpi(row.id)}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table>{detail.kpis.length === 0 && <div className="mi-empty">Nincs KPI rögzítve.</div>}</div>
                {!evidenceLocked && selectedProject.status !== "closed" && <form className="mi-inline-form" onSubmit={addKpi}>
                  <h4>Új KPI</h4>
                  <div className="mi-form-grid mi-form-grid-3">
                    <label className="mi-field">KPI neve<input required value={kpiDraft.name} onChange={(e) => setKpiDraft({ ...kpiDraft, name: e.target.value })} /></label>
                    <label className="mi-field">Mértékegység<input value={kpiDraft.unit} onChange={(e) => setKpiDraft({ ...kpiDraft, unit: e.target.value })} /></label>
                    <label className="mi-field">Értékelési irány<select value={kpiDraft.direction} onChange={(e) => setKpiDraft({ ...kpiDraft, direction: e.target.value as Kpi["direction"] })}><option value="higher_better">Nagyobb a jobb</option><option value="lower_better">Kisebb a jobb</option><option value="target">Célérték</option></select></label>
                    <label className="mi-field">Előtte<input inputMode="decimal" value={kpiDraft.before_value} onChange={(e) => setKpiDraft({ ...kpiDraft, before_value: e.target.value })} /></label>
                    <label className="mi-field">Cél<input inputMode="decimal" value={kpiDraft.target_value} onChange={(e) => setKpiDraft({ ...kpiDraft, target_value: e.target.value })} /></label>
                    <label className="mi-field">Utána<input inputMode="decimal" value={kpiDraft.after_value} onChange={(e) => setKpiDraft({ ...kpiDraft, after_value: e.target.value })} /></label>
                    <label className="mi-field">Adatforrás<input value={kpiDraft.source} onChange={(e) => setKpiDraft({ ...kpiDraft, source: e.target.value })} /></label>
                    <label className="mi-field mi-span-2">Megjegyzés<input value={kpiDraft.notes} onChange={(e) => setKpiDraft({ ...kpiDraft, notes: e.target.value })} /></label>
                  </div>
                  <button className="mi-btn mi-btn-secondary" disabled={saving}><Plus size={16} /> KPI hozzáadása</button>
                </form>}
              </section>

              <section className="mi-panel">
                <div className="mi-section-head"><div><h3><FileCheck2 size={18} /> Evidencia / bizonyítékok</h3><small>Dokumentum, fénykép, mérési jegyzőkönyv vagy más ellenőrizhető hivatkozás. A jóváhagyási körrel együtt zárolódik.</small></div></div>
                <div className="mi-records">
                  {evidenceItems.map((row) => {
                    const href = row.url ? safeEvidenceUrl(row.url) : "";
                    return <article className="mi-record" key={row.id}>
                      <div className="mi-record-main">
                        <div className="mi-record-title"><span className="mi-tag">{evidenceKindLabel[row.kind]}</span><strong>{row.title}</strong></div>
                        <p>{row.notes || "Nincs külön megjegyzés."}</p>
                        <div className="mi-record-meta">
                          <span><Clock3 /> {dateLabel(row.captured_at)}</span>
                          {row.reference && <span><FileCheck2 /> {row.reference}</span>}
                          {href && <a className="mi-link" href={href} target="_blank" rel="noreferrer noopener"><ExternalLink size={15} /> Megnyitás</a>}
                        </div>
                      </div>
                      {!evidenceLocked && <div className="mi-record-actions"><button className="mi-icon-btn" title="Bizonyíték törlése" onClick={() => void deleteEvidence(row.id)}><Trash2 size={16} /></button></div>}
                    </article>;
                  })}
                  {evidenceItems.length === 0 && <div className="mi-empty">Még nincs strukturált bizonyíték-hivatkozás rögzítve.</div>}
                </div>
                {!evidenceLocked && selectedProject.status !== "closed" && <form className="mi-inline-form" onSubmit={addEvidence}>
                  <h4>Új bizonyíték-hivatkozás</h4>
                  <div className="mi-form-grid">
                    <label className="mi-field">Típus<select value={evidenceDraft.kind} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, kind: e.target.value as EvidenceKind })}>{Object.entries(evidenceKindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                    <label className="mi-field">Dátum<input type="date" value={evidenceDraft.captured_at} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, captured_at: e.target.value })} /></label>
                    <label className="mi-field mi-span-2">Megnevezés<input required value={evidenceDraft.title} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, title: e.target.value })} /></label>
                    <label className="mi-field">Dokumentumazonosító / hivatkozási szám<input value={evidenceDraft.reference} placeholder="pl. AUD-2026-0042" onChange={(e) => setEvidenceDraft({ ...evidenceDraft, reference: e.target.value })} /></label>
                    <label className="mi-field">URL / belső fájlhivatkozás<input value={evidenceDraft.url} placeholder="https://… vagy /uploads/…" onChange={(e) => setEvidenceDraft({ ...evidenceDraft, url: e.target.value })} /></label>
                    <label className="mi-field mi-span-2">Megjegyzés<textarea rows={2} value={evidenceDraft.notes} onChange={(e) => setEvidenceDraft({ ...evidenceDraft, notes: e.target.value })} /></label>
                  </div>
                  <button className="mi-btn mi-btn-secondary" disabled={saving}><Plus size={16} /> Bizonyíték hozzáadása</button>
                </form>}
              </section>

              <div className="mi-two-col">
                <section className="mi-panel">
                  <div className="mi-section-head"><div><h3><ShieldCheck size={18} /> Jóváhagyási történet</h3><small>Maker-checker kontroll.</small></div></div>
                  <div className="mi-timeline">{detail.approvals.map((row) => <div className="mi-timeline-row" key={row.id}><span className={`mi-dot is-${row.decision}`} /><div><strong>{approvalLabel[row.decision]}</strong><p>Kérte: {row.requested_by} · {dateTimeLabel(row.requested_at)}</p>{row.decided_by && <p>Döntött: {row.decided_by} · {dateTimeLabel(row.decided_at)}</p>}{row.comment && <small>{row.comment}</small>}</div></div>)}{detail.approvals.length === 0 && <div className="mi-empty">Még nem volt jóváhagyási kör.</div>}</div>
                </section>
                <section className="mi-panel">
                  <div className="mi-section-head"><div><h3><History size={18} /> Audit trail</h3><small>Append-only eseménytörténet.</small></div></div>
                  <div className="mi-audit-list">{detail.audit.map((row) => <div className="mi-audit-row" key={String(row.id)}><span>{dateTimeLabel(row.created_at)}</span><div><strong>{row.action}</strong><small>{row.actor} · {row.entity_type}</small></div></div>)}{detail.audit.length === 0 && <div className="mi-empty">Nincs audit esemény.</div>}</div>
                </section>
              </div>
            </>
          )}
        </section>
      </main>

      {showCreate && <div className="mi-modal-backdrop" onMouseDown={() => !saving && setShowCreate(false)}><div className="mi-modal" onMouseDown={(e) => e.stopPropagation()}><div className="mi-modal-head"><div><span className="mi-eyebrow">Új fejlesztési projekt</span><h2>Projektindítás</h2></div><button className="mi-icon-btn" onClick={() => setShowCreate(false)}><XCircle /></button></div><form onSubmit={createProject}><div className="mi-form-grid"><label className="mi-field mi-span-2">Megnevezés<input autoFocus required value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} /></label><label className="mi-field mi-span-2">Probléma / lehetőség<textarea rows={3} value={newProject.problem_statement} onChange={(e) => setNewProject({ ...newProject, problem_statement: e.target.value })} /></label><label className="mi-field mi-span-2">Cél<textarea rows={3} value={newProject.objective} onChange={(e) => setNewProject({ ...newProject, objective: e.target.value })} /></label><label className="mi-field mi-span-2">Kezdeti elemzés<textarea rows={4} value={newProject.analysis} onChange={(e) => setNewProject({ ...newProject, analysis: e.target.value })} /></label><label className="mi-field mi-span-2">Tanulságok / standardizálás<textarea rows={2} value={newProject.lessons_learned} onChange={(e) => setNewProject({ ...newProject, lessons_learned: e.target.value })} /></label><label className="mi-field">Felelős<select value={newProject.owner_employee_id} onChange={(e) => setNewProject({ ...newProject, owner_employee_id: e.target.value })}><option value="">Nincs kijelölve</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label><label className="mi-field">Prioritás<select value={newProject.priority} onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as Project["priority"] })}>{Object.entries(priorityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="mi-field">Kezdés<input type="date" value={newProject.start_date} onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })} /></label><label className="mi-field">Határidő<input type="date" value={newProject.due_date} onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })} /></label><label className="mi-field mi-span-2">Módszertan<input value={newProject.methodology} onChange={(e) => setNewProject({ ...newProject, methodology: e.target.value })} /></label></div><div className="mi-modal-actions"><button type="button" className="mi-btn mi-btn-secondary" onClick={() => setShowCreate(false)}>Mégse</button><button className="mi-btn mi-btn-primary" disabled={saving}><Plus size={16} /> Projekt létrehozása</button></div></form></div></div>}
    </div>
  );
}
