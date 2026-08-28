import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import withBase from "../utils/apiBase";
import "./EmployeeSkillMatrixPage.css";

type QualificationStatus = "none" | "valid" | "expiring" | "expired";

type SkillRow = {
  employee_id: string;
  employee_name: string;
  position_id?: string | null;
  position_name?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  employee_active: boolean;
  service_id: string;
  service_name: string;
  base_price?: number | null;
  base_duration_minutes?: number | null;
  custom_price?: number | null;
  custom_duration_minutes?: number | null;
  skill_level: number;
  can_perform: boolean;
  qualification_name?: string | null;
  qualification_number?: string | null;
  qualification_valid_until?: string | null;
  qualification_verified: boolean;
  skill_notes?: string | null;
  skill_updated_at?: string | null;
  qualification_status: QualificationStatus;
};

type SkillDraft = {
  skill_level: number;
  can_perform: boolean;
  qualification_name: string;
  qualification_number: string;
  qualification_valid_until: string;
  qualification_verified: boolean;
  skill_notes: string;
};

const rowKey = (row: Pick<SkillRow, "employee_id" | "service_id">) => `${row.employee_id}:${row.service_id}`;

const toDraft = (row: SkillRow): SkillDraft => ({
  skill_level: Number(row.skill_level || 3),
  can_perform: row.can_perform !== false,
  qualification_name: row.qualification_name || "",
  qualification_number: row.qualification_number || "",
  qualification_valid_until: row.qualification_valid_until ? String(row.qualification_valid_until).slice(0, 10) : "",
  qualification_verified: row.qualification_verified === true,
  skill_notes: row.skill_notes || "",
});

const skillLabelsHu: Record<number, string> = {
  1: "Betanuló",
  2: "Junior",
  3: "Önálló",
  4: "Senior",
  5: "Oktató / Expert",
};

const skillLabelsEn: Record<number, string> = {
  1: "Trainee",
  2: "Junior",
  3: "Independent",
  4: "Senior",
  5: "Trainer / Expert",
};

export default function EmployeeSkillMatrixPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [rows, setRows] = useState<SkillRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SkillDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | QualificationStatus | "blocked">("");

  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(withBase(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(en ? `Invalid server response (HTTP ${response.status}).` : `A szerver hibás választ adott (HTTP ${response.status}).`);
    }
    if (!response.ok) throw new Error(data?.error || (en ? "The operation failed." : "A művelet nem sikerült."));
    return data;
  }, [en, token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("employees/skill-matrix");
      const nextRows = Array.isArray(data) ? data as SkillRow[] : [];
      setRows(nextRows);
      setDrafts(Object.fromEntries(nextRows.map(row => [rowKey(row), toDraft(row)])));
    } catch (loadError: any) {
      setRows([]);
      setDrafts({});
      setError(loadError?.message || (en ? "Could not load the skill matrix." : "A skill-mátrix nem tölthető be."));
    } finally {
      setLoading(false);
    }
  }, [en, request]);

  useEffect(() => { void load(); }, [load]);

  const employees = useMemo(() => Array.from(new Map(rows.map(row => [row.employee_id, row.employee_name])).entries())
    .sort((a, b) => a[1].localeCompare(b[1], en ? "en" : "hu")), [en, rows]);
  const services = useMemo(() => Array.from(new Map(rows.map(row => [row.service_id, row.service_name])).entries())
    .sort((a, b) => a[1].localeCompare(b[1], en ? "en" : "hu")), [en, rows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(en ? "en" : "hu");
    return rows.filter(row => {
      const draft = drafts[rowKey(row)] || toDraft(row);
      const haystack = `${row.employee_name} ${row.position_name || ""} ${row.location_name || ""} ${row.service_name} ${draft.qualification_name} ${draft.qualification_number}`.toLocaleLowerCase(en ? "en" : "hu");
      const status = row.qualification_status;
      return (!needle || haystack.includes(needle))
        && (!employeeFilter || row.employee_id === employeeFilter)
        && (!serviceFilter || row.service_id === serviceFilter)
        && (!statusFilter
          || (statusFilter === "blocked" ? draft.can_perform === false : status === statusFilter));
    });
  }, [drafts, employeeFilter, en, rows, search, serviceFilter, statusFilter]);

  const metrics = useMemo(() => ({
    assigned: rows.length,
    expert: rows.filter(row => Number(row.skill_level) >= 4).length,
    expiring: rows.filter(row => row.qualification_status === "expiring").length,
    expired: rows.filter(row => row.qualification_status === "expired").length,
    blocked: rows.filter(row => row.can_perform === false).length,
  }), [rows]);

  const patchDraft = (key: string, patch: Partial<SkillDraft>) =>
    setDrafts(current => ({ ...current, [key]: { ...current[key], ...patch } }));

  const save = async (row: SkillRow) => {
    const key = rowKey(row);
    const draft = drafts[key];
    if (!draft) return;
    setSavingKey(key);
    setError("");
    setNotice("");
    try {
      await request(`employees/${row.employee_id}/skills/${row.service_id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...draft,
          qualification_valid_until: draft.qualification_valid_until || null,
          qualification_name: draft.qualification_name || null,
          qualification_number: draft.qualification_number || null,
          skill_notes: draft.skill_notes || null,
        }),
      });
      setNotice(en ? `${row.employee_name} – ${row.service_name}: saved.` : `${row.employee_name} – ${row.service_name}: mentve.`);
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || (en ? "Saving failed." : "A mentés nem sikerült."));
    } finally {
      setSavingKey("");
    }
  };

  const labels = en ? skillLabelsEn : skillLabelsHu;
  const qualificationLabel = (status: QualificationStatus) => ({
    none: en ? "No expiry" : "Nincs lejárat",
    valid: en ? "Valid" : "Érvényes",
    expiring: en ? "Expires ≤30 days" : "≤30 napon belül lejár",
    expired: en ? "Expired" : "Lejárt",
  }[status]);

  return <main className="skill-matrix-page">
    <section className="skill-hero">
      <div>
        <span className="skill-eyebrow"><Award size={16}/> {en ? "HR / Competency management" : "HR / Kompetenciakezelés"}</span>
        <h1>{en ? "Employee skill matrix" : "Munkatársi skill-mátrix"}</h1>
        <p>{en
          ? "Service-level professional permissions, skill levels and qualification validity in one place."
          : "Szolgáltatásonként kezeli a szakmai jogosultságot, a tudásszintet és a képesítések érvényességét."}</p>
      </div>
      <button className="skill-refresh" onClick={() => void load()} disabled={loading}><RefreshCw size={17}/>{en ? "Refresh" : "Frissítés"}</button>
    </section>

    <section className="skill-metrics">
      <article><span><UserRoundCheck/></span><div><small>{en ? "Assigned skills" : "Hozzárendelt skillek"}</small><strong>{metrics.assigned}</strong></div></article>
      <article><span><Award/></span><div><small>{en ? "Senior / Expert" : "Senior / Expert"}</small><strong>{metrics.expert}</strong></div></article>
      <article className={metrics.expiring ? "warning" : ""}><span><AlertTriangle/></span><div><small>{en ? "Expiring in 30 days" : "30 napon belül lejár"}</small><strong>{metrics.expiring}</strong></div></article>
      <article className={metrics.expired ? "danger" : ""}><span><XCircle/></span><div><small>{en ? "Expired" : "Lejárt képesítés"}</small><strong>{metrics.expired}</strong></div></article>
      <article><span><ShieldCheck/></span><div><small>{en ? "Blocked services" : "Tiltott szolgáltatások"}</small><strong>{metrics.blocked}</strong></div></article>
    </section>

    {notice && <div className="skill-notice"><CheckCircle2 size={18}/>{notice}</div>}
    {error && <div className="skill-error"><AlertTriangle size={18}/>{error}</div>}

    <section className="skill-panel">
      <div className="skill-filterbar">
        <label className="skill-search"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={en ? "Search employee, service or qualification…" : "Munkatárs, szolgáltatás vagy képesítés keresése…"}/></label>
        <select value={employeeFilter} onChange={event => setEmployeeFilter(event.target.value)}><option value="">{en ? "All employees" : "Minden munkatárs"}</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select value={serviceFilter} onChange={event => setServiceFilter(event.target.value)}><option value="">{en ? "All services" : "Minden szolgáltatás"}</option>{services.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as any)}>
          <option value="">{en ? "All statuses" : "Minden státusz"}</option>
          <option value="valid">{en ? "Valid qualification" : "Érvényes képesítés"}</option>
          <option value="expiring">{en ? "Expires in 30 days" : "30 napon belül lejár"}</option>
          <option value="expired">{en ? "Expired qualification" : "Lejárt képesítés"}</option>
          <option value="none">{en ? "No expiry date" : "Nincs lejárati dátum"}</option>
          <option value="blocked">{en ? "Cannot perform" : "Nem végezheti"}</option>
        </select>
      </div>

      <div className="skill-result-line">{en ? "Visible competencies" : "Megjelenített kompetenciák"}: <strong>{filteredRows.length}</strong></div>

      <div className="skill-table-wrap">
        <table className="skill-table">
          <thead><tr>
            <th>{en ? "Employee" : "Munkatárs"}</th>
            <th>{en ? "Service" : "Szolgáltatás"}</th>
            <th>{en ? "Can perform" : "Végezheti"}</th>
            <th>{en ? "Skill level" : "Skill-szint"}</th>
            <th>{en ? "Qualification" : "Képesítés"}</th>
            <th>{en ? "Certificate / ID" : "Bizonyítvány / azonosító"}</th>
            <th>{en ? "Expiry" : "Lejárat"}</th>
            <th>{en ? "Verified" : "Ellenőrizve"}</th>
            <th>{en ? "Note" : "Megjegyzés"}</th>
            <th/>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="skill-empty">{en ? "Loading…" : "Betöltés…"}</td></tr>
              : filteredRows.length === 0 ? <tr><td colSpan={10} className="skill-empty">{en ? "No assigned services match the filters." : "A szűrésnek nincs megfelelő hozzárendelt szolgáltatás."}</td></tr>
              : filteredRows.map(row => {
                const key = rowKey(row);
                const draft = drafts[key] || toDraft(row);
                return <tr key={key} className={!draft.can_perform ? "skill-row-blocked" : row.qualification_status === "expired" ? "skill-row-expired" : ""}>
                  <td><div className="skill-person"><strong>{row.employee_name}</strong><small>{row.position_name || (en ? "No position" : "Munkakör nélkül")}{row.location_name ? ` · ${row.location_name}` : ""}</small></div></td>
                  <td><strong>{row.service_name}</strong><small className="skill-service-meta">{row.base_duration_minutes ? `${row.base_duration_minutes} min` : ""}</small></td>
                  <td><label className="skill-toggle"><input type="checkbox" checked={draft.can_perform} onChange={event => patchDraft(key, { can_perform: event.target.checked })}/><span/><b>{draft.can_perform ? (en ? "Yes" : "Igen") : (en ? "No" : "Nem")}</b></label></td>
                  <td><select className="skill-level-select" value={draft.skill_level} onChange={event => patchDraft(key, { skill_level: Number(event.target.value) })}>{[1,2,3,4,5].map(level => <option key={level} value={level}>{level} – {labels[level]}</option>)}</select></td>
                  <td><input value={draft.qualification_name} onChange={event => patchDraft(key, { qualification_name: event.target.value })} placeholder={en ? "e.g. Hairdresser certificate" : "pl. Fodrász képesítés"}/></td>
                  <td><input value={draft.qualification_number} onChange={event => patchDraft(key, { qualification_number: event.target.value })} placeholder={en ? "Certificate no." : "Bizonyítvány száma"}/></td>
                  <td><div className="skill-expiry"><input type="date" value={draft.qualification_valid_until} onChange={event => patchDraft(key, { qualification_valid_until: event.target.value })}/><span className={`skill-status ${row.qualification_status}`}>{qualificationLabel(row.qualification_status)}</span></div></td>
                  <td><label className="skill-verified"><input type="checkbox" checked={draft.qualification_verified} onChange={event => patchDraft(key, { qualification_verified: event.target.checked })}/><span>{draft.qualification_verified ? <CheckCircle2 size={17}/> : <ShieldCheck size={17}/>}</span></label></td>
                  <td><input value={draft.skill_notes} onChange={event => patchDraft(key, { skill_notes: event.target.value })} placeholder={en ? "Internal note" : "Belső megjegyzés"}/></td>
                  <td><button className="skill-save" onClick={() => void save(row)} disabled={savingKey === key}><Save size={16}/>{savingKey === key ? (en ? "Saving…" : "Mentés…") : (en ? "Save" : "Mentés")}</button></td>
                </tr>;
              })}
          </tbody>
        </table>
      </div>

      <p className="skill-footnote"><ShieldCheck size={16}/>{en
        ? "The matrix only contains services already assigned to employees. Service assignment remains managed on the employee profile."
        : "A mátrix csak a munkatárshoz már hozzárendelt szolgáltatásokat tartalmazza. Új szolgáltatás hozzárendelése továbbra is a munkatárs adatlapján történik."}</p>
    </section>
  </main>;
}
