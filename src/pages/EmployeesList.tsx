import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./EmployeesList.css";

type Employee = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  qualification?: string;
  employment_type?: string;
  location_id?: string;
  location_name?: string;
  position_id?: string;
  position_name?: string;
  monthly_wage?: number;
  hourly_wage?: number;
  commission_percent?: number;
  photo_url?: string;
  active?: boolean;
  role?: string | string[];
};

type Position = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  base_monthly_wage: number;
  base_hourly_wage: number;
  commission_percent: number;
  is_active: boolean;
  employee_count: number;
};

type LocationItem = { id: string; name: string };
type EmploymentType = { id: string; code: string; name: string; is_active: boolean };
type WageBand = "" | "none" | "lt300" | "300-500" | "500-700" | "gte700";

const emptyEmployee = {
  full_name: "",
  email: "",
  phone: "",
  qualification: "",
  employment_type: "",
  location_id: "",
  position_id: "",
  monthly_wage: "",
  hourly_wage: "",
  commission_percent: "",
  active: true,
};

const money = (value?: number | string | null) =>
  value === undefined || value === null || value === "" || Number(value) === 0
    ? "—"
    : `${Number(value).toLocaleString("hu-HU")} Ft`;

const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

const cleanRoleToken = (value?: string | null) => {
  if (!value) return "";
  return String(value)
    .replace(/[\[\]{}"']/g, " ")
    .replace(/\\/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const canonicalRole = (raw?: string | null) => {
  const cleaned = cleanRoleToken(raw);
  if (!cleaned) return "";
  const lower = cleaned.toLocaleLowerCase("hu-HU");

  if (lower.includes("top fodrász") || lower.includes("top fodrasz")) return "TOP fodrász";
  if (lower.includes("fodrász mester") || lower.includes("fodrasz mester")) return "Fodrász mester";
  if (lower.includes("fodrász") || lower.includes("fodrasz") || lower.includes("hairdresser")) return "Fodrász";
  if (lower.includes("vezető kozmetikus") || lower.includes("vezeto kozmetikus")) return "Vezető kozmetikus";
  if (lower.includes("kozmetikus") || lower.includes("cosmetician")) return "Kozmetikus";
  if (lower.includes("körmös") || lower.includes("kormos") || lower.includes("manicur")) return "Körmös";
  if (lower.includes("masszőr") || lower.includes("masszor") || lower.includes("masseur")) return "Masszőr";
  if (lower.includes("recepciós") || lower.includes("recepcios") || lower.includes("receptionist")) return "Recepciós";
  if (lower.includes("admin")) return "Adminisztrátor";
  if (lower.includes("szalonvezet")) return "Szalonvezető";
  if (lower.includes("üzletvezet") || lower.includes("uzletvezet")) return "Üzletvezető";
  if (lower.includes("tulajdonos") || lower.includes("owner")) return "Tulajdonos";
  if (lower === "employee" || lower === "worker" || lower === "staff" || lower === "munkatárs") return "Munkatárs";

  const parts = cleaned.split(/[,;|]/).map(x => x.trim()).filter(Boolean);
  if (parts.length > 1) {
    for (const part of parts) {
      const normalized = canonicalRole(part);
      if (normalized && normalized !== "Munkatárs") return normalized;
    }
    return canonicalRole(parts[0]);
  }

  if (cleaned.length > 46) return "Egyéb / besorolatlan";
  return cleaned.charAt(0).toLocaleUpperCase("hu-HU") + cleaned.slice(1);
};

const roleLabel = (employee: Employee) => {
  const fromPosition = canonicalRole(employee.position_name);
  if (fromPosition && fromPosition !== "Egyéb / besorolatlan") return fromPosition;
  const rawRole = Array.isArray(employee.role) ? employee.role.join(",") : employee.role;
  const fromRole = canonicalRole(rawRole);
  return fromRole || fromPosition || "Munkakör nélkül";
};

const roleOrder = [
  "Szalonvezető",
  "Üzletvezető",
  "Adminisztrátor",
  "Recepciós",
  "Vezető kozmetikus",
  "Kozmetikus",
  "TOP fodrász",
  "Fodrász mester",
  "Fodrász",
  "Körmös",
  "Masszőr",
  "Munkatárs",
  "Munkakör nélkül",
  "Egyéb / besorolatlan",
];

export default function EmployeesList() {
  const routerLocation = useLocation();
  const positionsMode = routerLocation.pathname.includes("positions");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [wageBand, setWageBand] = useState<WageBand>("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [employeeModal, setEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<any>(emptyEmployee);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(withBase(path), { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const text = await response.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { throw new Error(`A szerver hibás választ adott (HTTP ${response.status}).`); }
    if (!response.ok) throw new Error(data?.error || "A művelet nem sikerült.");
    return data;
  }, [headers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [employeeResult, positionResult, locationResult, employmentResult] = await Promise.allSettled([
      api(`employees${includeInactive ? "?include_inactive=1" : ""}`),
      api("employees/positions"),
      api("locations"),
      api("hr/employment-types"),
    ]);

    const positionData: Position[] = positionResult.status === "fulfilled" && Array.isArray(positionResult.value)
      ? positionResult.value.map((p: any) => ({
          ...p,
          id: String(p.id || ""),
          name: String(p.name || "Névtelen munkakör"),
          base_monthly_wage: Number(p.base_monthly_wage || 0),
          base_hourly_wage: Number(p.base_hourly_wage || 0),
          commission_percent: Number(p.commission_percent || 0),
          employee_count: Number(p.employee_count || 0),
          is_active: p.is_active !== false,
        }))
      : [];
    const locationData: LocationItem[] = locationResult.status === "fulfilled" && Array.isArray(locationResult.value) ? locationResult.value : [];
    const employmentData: EmploymentType[] = employmentResult.status === "fulfilled" && Array.isArray(employmentResult.value) ? employmentResult.value : [];
    const positionNames = new Map(positionData.map(p => [String(p.id), p.name]));
    const locationNames = new Map(locationData.map(l => [String(l.id), l.name]));

    if (employeeResult.status === "fulfilled" && Array.isArray(employeeResult.value)) {
      setEmployees(employeeResult.value.map((employee: Employee) => ({
        ...employee,
        active: employee.active !== false,
        position_name: employee.position_name || positionNames.get(String(employee.position_id || "")) || undefined,
        location_name: employee.location_name || locationNames.get(String(employee.location_id || "")) || undefined,
      })));
    } else {
      setEmployees([]);
      setError(employeeResult.status === "rejected" ? employeeResult.reason?.message || "A munkatársak betöltése nem sikerült." : "A munkatársak betöltése nem sikerült.");
    }
    setPositions(positionData);
    setLocations(locationData);
    setEmploymentTypes(employmentData);
    setLoading(false);
  }, [api, includeInactive]);

  useEffect(() => { load(); }, [load]);

  const employmentName = useCallback((employee: Employee) => {
    return employmentTypes.find(t => t.code === employee.employment_type)?.name || employee.employment_type || "Nincs megadva";
  }, [employmentTypes]);

  const filtered = useMemo(() => employees.filter(employee => {
    const needle = search.trim().toLocaleLowerCase("hu-HU");
    const haystack = `${employee.full_name} ${employee.email || ""} ${employee.phone || ""} ${roleLabel(employee)} ${employee.location_name || ""} ${employmentName(employee)}`.toLocaleLowerCase("hu-HU");
    const wage = Number(employee.monthly_wage || 0);
    const wageOk = !wageBand
      || (wageBand === "none" && wage <= 0)
      || (wageBand === "lt300" && wage > 0 && wage < 300000)
      || (wageBand === "300-500" && wage >= 300000 && wage < 500000)
      || (wageBand === "500-700" && wage >= 500000 && wage < 700000)
      || (wageBand === "gte700" && wage >= 700000);

    return (!needle || haystack.includes(needle))
      && (!positionFilter || String(employee.position_id || "") === positionFilter)
      && (!locationFilter || String(employee.location_id || "") === locationFilter)
      && (!employmentFilter || employee.employment_type === employmentFilter)
      && wageOk;
  }), [employees, search, positionFilter, locationFilter, employmentFilter, wageBand, employmentName]);

  const groups = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach(employee => {
      const key = roleLabel(employee);
      map.set(key, [...(map.get(key) || []), employee]);
    });
    return Array.from(map.entries())
      .map(([name, people]) => ({ name, people: people.sort((a, b) => a.full_name.localeCompare(b.full_name, "hu")) }))
      .sort((a, b) => {
        const ai = roleOrder.indexOf(a.name);
        const bi = roleOrder.indexOf(b.name);
        if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        return a.name.localeCompare(b.name, "hu");
      });
  }, [filtered]);

  const activeCount = employees.filter(e => e.active).length;
  const monthlyTotal = employees.filter(e => e.active).reduce((sum, e) => sum + Number(e.monthly_wage || 0), 0);
  const locationCount = new Set(employees.map(e => e.location_id).filter(Boolean)).size || locations.length;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const resetFilters = () => {
    setSearch("");
    setPositionFilter("");
    setLocationFilter("");
    setEmploymentFilter("");
    setWageBand("");
  };

  const openEmployee = (employee?: Employee) => {
    setEmployeeForm(employee ? {
      ...emptyEmployee,
      ...employee,
      monthly_wage: employee.monthly_wage || "",
      hourly_wage: employee.hourly_wage || "",
      commission_percent: employee.commission_percent || "",
    } : emptyEmployee);
    setEmployeeModal(true);
  };

  const saveEmployee = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = Boolean(employeeForm.id);
      const saved = await api(isEdit ? `employees/${employeeForm.id}` : "employees", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(employeeForm),
      });
      const employeeId = employeeForm.id || saved?.id;
      if (employeeId && employeeForm.position_id) {
        try {
          await api(`hr/employees/${employeeId}/positions`, {
            method: "POST",
            body: JSON.stringify({
              position_id: employeeForm.position_id,
              location_id: employeeForm.location_id || null,
              is_primary: true,
              valid_from: new Date().toISOString().slice(0, 10),
            }),
          });
        } catch { /* a törzsadat mentése ettől még sikeres */ }
      }
      setEmployeeModal(false);
      showNotice(isEdit ? "A munkatárs adatai frissültek." : "Az új munkatárs létrejött.");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (employee: Employee) => {
    try {
      await api(`employees/${employee.id}/active`, { method: "PATCH", body: JSON.stringify({ active: !employee.active }) });
      await load();
    } catch (e: any) { setError(e.message); }
  };

  if (positionsMode) {
    return <main className="staff-page">
      <section className="staff-hero compact">
        <div><span className="staff-eyebrow">CSAPAT ÉS HR</span><h1>Munkakörök</h1><p>Munkakörök és alap bérezési paraméterek.</p></div>
      </section>
      {error && <div className="staff-alert">{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
      <section className="position-grid standalone">
        {positions.map(position => <article className="position-card" key={position.id}>
          <header><span><BriefcaseBusiness/></span><b>{position.employee_count} fő</b></header>
          <h3>{position.name}</h3>
          <p>{position.description || "Nincs leírás megadva."}</p>
          <div className="position-money">
            <div><small>Alap havibér</small><strong>{money(position.base_monthly_wage)}</strong></div>
            <div><small>Óradíj</small><strong>{money(position.base_hourly_wage)}</strong></div>
            <div><small>Jutalék</small><strong>{Number(position.commission_percent || 0)}%</strong></div>
          </div>
        </article>)}
      </section>
    </main>;
  }

  return <main className="staff-page grouped-staff-page">
    {notice && <div className="staff-toast"><Check size={18}/>{notice}</div>}

    <section className="staff-hero compact">
      <div><span className="staff-eyebrow">CSAPAT ÉS HR</span><h1>Munkatársak listája</h1><p>Munkakörönként csoportosított munkatársi törzs, HR- és béradatokkal.</p></div>
      <button className="staff-primary" onClick={() => openEmployee()}><Plus size={18}/> Hozzáadás</button>
    </section>

    <section className="staff-stats compact-stats">
      <article><span className="stat-icon purple"><UsersRound/></span><div><small>Aktív munkatárs</small><strong>{activeCount}</strong></div></article>
      <article><span className="stat-icon blue"><BriefcaseBusiness/></span><div><small>Munkakörcsoport</small><strong>{groups.length}</strong></div></article>
      <article><span className="stat-icon green"><Building2/></span><div><small>Használt telephely</small><strong>{locationCount}</strong></div></article>
      <article><span className="stat-icon gold"><CircleDollarSign/></span><div><small>Havi alapbér összesen</small><strong>{money(monthlyTotal)}</strong></div></article>
    </section>

    {error && <div className="staff-alert">{error}<button onClick={() => setError("")}><X size={16}/></button></div>}

    <section className="staff-panel grouped-panel">
      <div className="grouped-filter-area">
        <div className="staff-search wide"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés név, e-mail, telefon, munkakör vagy telephely alapján…"/></div>
        <div className="staff-filter-grid">
          <label><span>Munkakör</span><select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}><option value="">Összes</option>{positions.map(p => <option key={p.id} value={p.id}>{canonicalRole(p.name) || p.name}</option>)}</select></label>
          <label><span>Telephely</span><select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}><option value="">Összes telephely</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <label><span>Alkalmazás formája</span><select value={employmentFilter} onChange={e => setEmploymentFilter(e.target.value)}><option value="">Összes</option>{employmentTypes.filter(t => t.is_active !== false).map(t => <option key={t.id} value={t.code}>{t.name}</option>)}</select></label>
          <label><span>Havi alapbér</span><select value={wageBand} onChange={e => setWageBand(e.target.value as WageBand)}><option value="">Összes</option><option value="none">Nincs megadva</option><option value="lt300">300 000 Ft alatt</option><option value="300-500">300 000 – 499 999 Ft</option><option value="500-700">500 000 – 699 999 Ft</option><option value="gte700">700 000 Ft vagy több</option></select></label>
          <label className="staff-inactive-filter"><span>Státusz</span><span className="staff-switch"><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)}/><i/> Inaktívak is</span></label>
        </div>
        <div className="filter-actions"><button type="button" className="staff-filter-button"><SlidersHorizontal size={15}/> Találat: {filtered.length}</button><button type="button" className="staff-reset" onClick={resetFilters}>Visszaállítás</button></div>
      </div>

      <div className="staff-group-list">
        {loading ? <div className="staff-empty">Adatok betöltése…</div> : groups.length === 0 ? <div className="staff-empty">Nincs a szűrésnek megfelelő munkatárs.</div> : groups.map(group => {
          const isCollapsed = collapsed[group.name] === true;
          return <section className="staff-group" key={group.name}>
            <button className="staff-group-head" onClick={() => setCollapsed(prev => ({ ...prev, [group.name]: !prev[group.name] }))}>
              <span>{isCollapsed ? <ChevronRight size={19}/> : <ChevronDown size={19}/>}<strong>{group.name}</strong><b>{group.people.length}</b></span>
              <small>{isCollapsed ? "Kibontás" : "Összecsukás"}</small>
            </button>
            {!isCollapsed && <div className="staff-table-wrap"><table className="staff-table grouped-table">
              <thead><tr><th>Szakember</th><th>Telephely</th><th>Alkalmazás formája</th><th>Havi alapbér</th><th>Óradíj</th><th>Jutalék</th><th>Státusz</th><th/></tr></thead>
              <tbody>{group.people.map(employee => <tr key={employee.id}>
                <td><div className="staff-person">{employee.photo_url ? <img src={employee.photo_url} alt=""/> : <span>{initials(employee.full_name)}</span>}<div><strong>{employee.full_name}</strong><small>{employee.qualification || employee.email || "Nincs megadva végzettség"}</small>{employee.phone && <small>{employee.phone}</small>}</div></div></td>
                <td><span className="staff-muted"><MapPin size={15}/>{employee.location_name || "Nincs telephely"}</span></td>
                <td><span className="employment-badge">{employmentName(employee)}</span></td>
                <td><strong className="wage-value">{money(employee.monthly_wage)}</strong></td>
                <td><strong className="wage-value">{money(employee.hourly_wage)}</strong></td>
                <td><strong className="commission-value">{Number(employee.commission_percent || 0)}%</strong></td>
                <td><button className={`status-badge ${employee.active ? "on" : "off"}`} onClick={() => toggleActive(employee)}><i/>{employee.active ? "Aktív" : "Inaktív"}</button></td>
                <td><button className="icon-button" onClick={() => openEmployee(employee)} title="Szerkesztés"><Pencil size={17}/></button></td>
              </tr>)}</tbody>
            </table></div>}
          </section>;
        })}
      </div>
    </section>

    {employeeModal && <div className="staff-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEmployeeModal(false)}>
      <form className="staff-modal" onSubmit={saveEmployee}>
        <header className="modal-header"><div><h2>{employeeForm.id ? "Munkatárs szerkesztése" : "Új munkatárs"}</h2><p>Személyes, foglalkoztatási és bérezési adatok.</p></div><button type="button" onClick={() => setEmployeeModal(false)}><X size={18}/></button></header>
        <div className="modal-body">
          <label className="form-field wide"><span>Teljes név *</span><input required value={employeeForm.full_name} onChange={e => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}/></label>
          <label className="form-field"><span>E-mail</span><input type="email" value={employeeForm.email || ""} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}/></label>
          <label className="form-field"><span>Telefonszám</span><input value={employeeForm.phone || ""} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}/></label>
          <label className="form-field wide"><span>Végzettség</span><input value={employeeForm.qualification || ""} onChange={e => setEmployeeForm({ ...employeeForm, qualification: e.target.value })}/></label>
          <label className="form-field"><span>Munkakör</span><select value={employeeForm.position_id || ""} onChange={e => setEmployeeForm({ ...employeeForm, position_id: e.target.value })}><option value="">Válasszon</option>{positions.filter(p => p.is_active !== false).map(p => <option key={p.id} value={p.id}>{canonicalRole(p.name) || p.name}</option>)}</select></label>
          <label className="form-field"><span>Telephely</span><select value={employeeForm.location_id || ""} onChange={e => setEmployeeForm({ ...employeeForm, location_id: e.target.value })}><option value="">Válasszon</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <label className="form-field wide"><span>Alkalmazás formája</span><select value={employeeForm.employment_type || ""} onChange={e => setEmployeeForm({ ...employeeForm, employment_type: e.target.value })}><option value="">Válasszon</option>{employmentTypes.filter(t => t.is_active !== false).map(t => <option key={t.id} value={t.code}>{t.name}</option>)}</select></label>
          <label className="form-field"><span>Havi alapbér (Ft)</span><input type="number" min="0" value={employeeForm.monthly_wage} onChange={e => setEmployeeForm({ ...employeeForm, monthly_wage: e.target.value })}/></label>
          <label className="form-field"><span>Óradíj (Ft)</span><input type="number" min="0" value={employeeForm.hourly_wage} onChange={e => setEmployeeForm({ ...employeeForm, hourly_wage: e.target.value })}/></label>
          <label className="form-field"><span>Jutalék (%)</span><input type="number" min="0" max="100" step="0.1" value={employeeForm.commission_percent} onChange={e => setEmployeeForm({ ...employeeForm, commission_percent: e.target.value })}/></label>
          <label className="modal-active"><input type="checkbox" checked={employeeForm.active !== false} onChange={e => setEmployeeForm({ ...employeeForm, active: e.target.checked })}/><span>Aktív munkatárs</span></label>
        </div>
        <footer className="modal-footer"><button type="button" className="staff-ghost" onClick={() => setEmployeeModal(false)}>Mégse</button><button className="staff-primary" disabled={saving}>{saving ? "Mentés…" : "Mentés"}</button></footer>
      </form>
    </div>}
  </main>;
}