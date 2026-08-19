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
import { useLanguage } from "../i18n/LanguageProvider";
import withBase from "../utils/apiBase";
import { applyColumnFilters } from "../utils/tableFilters";
import "./EmployeesList.css";
import "./EmployeesColumnFilters.css";

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
type EmployeeColumnFilterState = {
  name: string;
  location: string;
  employment: string;
  monthlyMin: string;
  hourlyMin: string;
  commissionMin: string;
  status: string;
};

const emptyColumnFilters: EmployeeColumnFilterState = {
  name: "",
  location: "",
  employment: "",
  monthlyMin: "",
  hourlyMin: "",
  commissionMin: "",
  status: "",
};

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

const money = (value?: number | string | null, locale = "hu-HU") =>
  value === undefined || value === null || value === "" || Number(value) === 0
    ? "—"
    : `${Number(value).toLocaleString(locale)} Ft`;

const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

const cleanRoleToken = (value?: string | null) => {
  if (!value) return "";
  return String(value)
    .replace(/[[\]{}"']/g, " ")
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

const ROLE_EN: Record<string,string> = {
  "Szalonvezető":"Salon manager","Üzletvezető":"Store manager","Adminisztrátor":"Administrator","Recepciós":"Receptionist",
  "Vezető kozmetikus":"Lead cosmetician","Kozmetikus":"Cosmetician","TOP fodrász":"TOP hairdresser","Fodrász mester":"Master hairdresser",
  "Fodrász":"Hairdresser","Körmös":"Nail technician","Masszőr":"Massage therapist","Munkatárs":"Staff member",
  "Munkakör nélkül":"No position","Egyéb / besorolatlan":"Other / unclassified","Tulajdonos":"Owner",
};
const localizedRole=(name:string,language:string)=>language==="en"?(ROLE_EN[name]||name):name;

export default function EmployeesList() {
  const routerLocation = useLocation();
  const { language, locale, t } = useLanguage();
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
  const [columnFilters, setColumnFilters] = useState<EmployeeColumnFilterState>(emptyColumnFilters);
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
    try { data = text ? JSON.parse(text) : null; } catch { throw new Error(language === "en" ? `Invalid server response (HTTP ${response.status}).` : `A szerver hibás választ adott (HTTP ${response.status}).`); }
    if (!response.ok) throw new Error(data?.error || (language === "en" ? "The operation failed." : "A művelet nem sikerült."));
    return data;
  }, [headers, language]);

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
          name: String(p.name || (language === "en" ? "Unnamed position" : "Névtelen munkakör")),
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
      const fallback=language === "en" ? "Staff could not be loaded." : "A munkatársak betöltése nem sikerült.";
      setError(employeeResult.status === "rejected" ? employeeResult.reason?.message || fallback : fallback);
    }
    setPositions(positionData);
    setLocations(locationData);
    setEmploymentTypes(employmentData);
    setLoading(false);
  }, [api, includeInactive, language]);

  useEffect(() => { load(); }, [load]);

  const employmentName = useCallback((employee: Employee) => {
    return employmentTypes.find(item => item.code === employee.employment_type)?.name || employee.employment_type || t("common.none");
  }, [employmentTypes, t]);

  const filtered = useMemo(() => {
    const baseRows = employees.filter(employee => {
      const needle = search.trim().toLocaleLowerCase(locale);
      const haystack = `${employee.full_name} ${employee.email || ""} ${employee.phone || ""} ${roleLabel(employee)} ${employee.location_name || ""} ${employmentName(employee)}`.toLocaleLowerCase(locale);
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
    });

    return applyColumnFilters(baseRows, [
      { id: "name", kind: "text", value: columnFilters.name, getValue: employee => employee.full_name },
      { id: "location", kind: "select", value: columnFilters.location, getValue: employee => String(employee.location_id || "") },
      { id: "employment", kind: "select", value: columnFilters.employment, getValue: employee => employee.employment_type || "" },
      { id: "monthly", kind: "number-min", value: columnFilters.monthlyMin, getValue: employee => employee.monthly_wage || 0 },
      { id: "hourly", kind: "number-min", value: columnFilters.hourlyMin, getValue: employee => employee.hourly_wage || 0 },
      { id: "commission", kind: "number-min", value: columnFilters.commissionMin, getValue: employee => employee.commission_percent || 0 },
      { id: "status", kind: "boolean", value: columnFilters.status, getValue: employee => employee.active !== false },
    ], locale);
  }, [employees, search, positionFilter, locationFilter, employmentFilter, wageBand, columnFilters, employmentName, locale]);

  const groups = useMemo(() => {
    const map = new Map<string, Employee[]>();
    filtered.forEach(employee => {
      const key = roleLabel(employee);
      map.set(key, [...(map.get(key) || []), employee]);
    });
    return Array.from(map.entries())
      .map(([name, people]) => ({ name, people: people.sort((a, b) => a.full_name.localeCompare(b.full_name, locale)) }))
      .sort((a, b) => {
        const ai = roleOrder.indexOf(a.name);
        const bi = roleOrder.indexOf(b.name);
        if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        return a.name.localeCompare(b.name, locale);
      });
  }, [filtered, locale]);

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
    setColumnFilters(emptyColumnFilters);
  };

  const setColumnFilter = (key: keyof EmployeeColumnFilterState, value: string) =>
    setColumnFilters(current => ({ ...current, [key]: value }));

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
      showNotice(isEdit ? t("staff.saved") : t("staff.created"));
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
        <div><span className="staff-eyebrow">{t("staff.eyebrow")}</span><h1>{t("staff.positions_title")}</h1><p>{t("staff.positions_description")}</p></div>
      </section>
      {error && <div className="staff-alert">{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
      <section className="position-grid standalone">
        {positions.map(position => <article className="position-card" key={position.id}>
          <header><span><BriefcaseBusiness/></span><b>{position.employee_count} {t("staff.people")}</b></header>
          <h3>{localizedRole(canonicalRole(position.name)||position.name,language)}</h3>
          <p>{position.description || t("staff.no_description")}</p>
          <div className="position-money">
            <div><small>{t("staff.base_monthly")}</small><strong>{money(position.base_monthly_wage,locale)}</strong></div>
            <div><small>{t("staff.hourly_wage")}</small><strong>{money(position.base_hourly_wage,locale)}</strong></div>
            <div><small>{t("staff.commission")}</small><strong>{Number(position.commission_percent || 0)}%</strong></div>
          </div>
        </article>)}
      </section>
    </main>;
  }

  return <main className="staff-page grouped-staff-page">
    {notice && <div className="staff-toast"><Check size={18}/>{notice}</div>}

    <section className="staff-hero compact">
      <div><span className="staff-eyebrow">{t("staff.eyebrow")}</span><h1>{t("staff.title")}</h1><p>{t("staff.description")}</p></div>
      <button className="staff-primary" onClick={() => openEmployee()}><Plus size={18}/> {t("staff.add")}</button>
    </section>

    <section className="staff-stats compact-stats">
      <article><span className="stat-icon purple"><UsersRound/></span><div><small>{t("staff.active_count")}</small><strong>{activeCount}</strong></div></article>
      <article><span className="stat-icon blue"><BriefcaseBusiness/></span><div><small>{t("staff.position_groups")}</small><strong>{groups.length}</strong></div></article>
      <article><span className="stat-icon green"><Building2/></span><div><small>{t("staff.location_count")}</small><strong>{locationCount}</strong></div></article>
      <article><span className="stat-icon gold"><CircleDollarSign/></span><div><small>{t("staff.monthly_total")}</small><strong>{money(monthlyTotal,locale)}</strong></div></article>
    </section>

    {error && <div className="staff-alert">{error}<button onClick={() => setError("")}><X size={16}/></button></div>}

    <section className="staff-panel grouped-panel">
      <div className="grouped-filter-area">
        <div className="staff-search wide"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("staff.search")}/></div>
        <div className="staff-filter-grid">
          <label><span>{t("staff.position")}</span><select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}><option value="">{t("staff.all_positions")}</option>{positions.map(p => <option key={p.id} value={p.id}>{localizedRole(canonicalRole(p.name) || p.name,language)}</option>)}</select></label>
          <label><span>{t("staff.location")}</span><select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}><option value="">{t("staff.all_locations")}</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <label><span>{t("staff.employment_type")}</span><select value={employmentFilter} onChange={e => setEmploymentFilter(e.target.value)}><option value="">{t("common.all")}</option>{employmentTypes.filter(item => item.is_active !== false).map(item => <option key={item.id} value={item.code}>{item.name}</option>)}</select></label>
          <label><span>{t("staff.monthly_wage")}</span><select value={wageBand} onChange={e => setWageBand(e.target.value as WageBand)}><option value="">{t("common.all")}</option><option value="none">{t("common.none")}</option><option value="lt300">{language==="en"?"Under HUF 300,000":"300 000 Ft alatt"}</option><option value="300-500">{language==="en"?"HUF 300,000–499,999":"300 000 – 499 999 Ft"}</option><option value="500-700">{language==="en"?"HUF 500,000–699,999":"500 000 – 699 999 Ft"}</option><option value="gte700">{language==="en"?"HUF 700,000 or more":"700 000 Ft vagy több"}</option></select></label>
          <label className="staff-inactive-filter"><span>{t("staff.status")}</span><span className="staff-switch"><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)}/><i/> {t("staff.include_inactive")}</span></label>
        </div>
        <div className="filter-actions"><button type="button" className="staff-filter-button"><SlidersHorizontal size={15}/> {t("staff.found")}: {filtered.length}</button><button type="button" className="staff-reset" onClick={resetFilters}>{t("common.reset")}</button></div>
      </div>

      <div className="staff-group-list">
        {loading ? <div className="staff-empty">{t("common.loading")}</div> : groups.length === 0 ? <div className="staff-empty">{t("staff.empty")}</div> : groups.map(group => {
          const isCollapsed = collapsed[group.name] === true;
          return <section className="staff-group" key={group.name}>
            <button className="staff-group-head" onClick={() => setCollapsed(prev => ({ ...prev, [group.name]: !prev[group.name] }))}>
              <span>{isCollapsed ? <ChevronRight size={19}/> : <ChevronDown size={19}/>}<strong>{localizedRole(group.name,language)}</strong><b>{group.people.length}</b></span>
              <small>{isCollapsed ? t("staff.expand") : t("staff.collapse")}</small>
            </button>
            {!isCollapsed && <div className="staff-table-wrap"><table className="staff-table grouped-table">
              <thead>
                <tr><th>{t("staff.professional")}</th><th>{t("staff.location")}</th><th>{t("staff.employment_type")}</th><th>{t("staff.monthly_wage")}</th><th>{t("staff.hourly_wage")}</th><th>{t("staff.commission")}</th><th>{t("staff.status")}</th><th/></tr>
                <tr className="staff-column-filter-row">
                  <th><input aria-label={language === "en" ? "Filter professional" : "Szakember szűrése"} value={columnFilters.name} onChange={e => setColumnFilter("name", e.target.value)} placeholder={language === "en" ? "Name…" : "Név…"}/></th>
                  <th><select aria-label={language === "en" ? "Filter location" : "Telephely szűrése"} value={columnFilters.location} onChange={e => setColumnFilter("location", e.target.value)}><option value="">{t("common.all")}</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></th>
                  <th><select aria-label={language === "en" ? "Filter employment type" : "Foglalkoztatás szűrése"} value={columnFilters.employment} onChange={e => setColumnFilter("employment", e.target.value)}><option value="">{t("common.all")}</option>{employmentTypes.filter(item => item.is_active !== false).map(item => <option key={item.id} value={item.code}>{item.name}</option>)}</select></th>
                  <th><input aria-label={language === "en" ? "Minimum monthly wage" : "Minimum havibér"} type="number" min="0" value={columnFilters.monthlyMin} onChange={e => setColumnFilter("monthlyMin", e.target.value)} placeholder="≥ Ft"/></th>
                  <th><input aria-label={language === "en" ? "Minimum hourly wage" : "Minimum órabér"} type="number" min="0" value={columnFilters.hourlyMin} onChange={e => setColumnFilter("hourlyMin", e.target.value)} placeholder="≥ Ft"/></th>
                  <th><input aria-label={language === "en" ? "Minimum commission" : "Minimum jutalék"} type="number" min="0" max="100" step="0.1" value={columnFilters.commissionMin} onChange={e => setColumnFilter("commissionMin", e.target.value)} placeholder="≥ %"/></th>
                  <th><select aria-label={language === "en" ? "Filter status" : "Státusz szűrése"} value={columnFilters.status} onChange={e => setColumnFilter("status", e.target.value)}><option value="">{t("common.all")}</option><option value="true">{t("common.active")}</option><option value="false">{t("common.inactive")}</option></select></th>
                  <th><button type="button" className="column-filter-reset" onClick={() => setColumnFilters(emptyColumnFilters)} title={t("common.reset")}><X size={14}/></button></th>
                </tr>
              </thead>
              <tbody>{group.people.map(employee => <tr key={employee.id}>
                <td><div className="staff-person">{employee.photo_url ? <img src={employee.photo_url} alt=""/> : <span>{initials(employee.full_name)}</span>}<div><strong>{employee.full_name}</strong><small>{employee.qualification || employee.email || t("staff.no_qualification")}</small>{employee.phone && <small>{employee.phone}</small>}</div></div></td>
                <td><span className="staff-muted"><MapPin size={15}/>{employee.location_name || t("staff.no_location")}</span></td>
                <td><span className="employment-badge">{employmentName(employee)}</span></td>
                <td><strong className="wage-value">{money(employee.monthly_wage,locale)}</strong></td>
                <td><strong className="wage-value">{money(employee.hourly_wage,locale)}</strong></td>
                <td><strong className="commission-value">{Number(employee.commission_percent || 0)}%</strong></td>
                <td><button className={`status-badge ${employee.active ? "on" : "off"}`} onClick={() => toggleActive(employee)}><i/>{employee.active ? t("common.active") : t("common.inactive")}</button></td>
                <td><button className="icon-button" onClick={() => openEmployee(employee)} title={t("common.edit")}><Pencil size={17}/></button></td>
              </tr>)}</tbody>
            </table></div>}
          </section>;
        })}
      </div>
    </section>

    {employeeModal && <div className="staff-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEmployeeModal(false)}>
      <form className="staff-modal" onSubmit={saveEmployee}>
        <header className="modal-header"><div><h2>{employeeForm.id ? t("staff.edit_title") : t("staff.new_title")}</h2><p>{t("staff.modal_description")}</p></div><button type="button" onClick={() => setEmployeeModal(false)}><X size={18}/></button></header>
        <div className="modal-body">
          <label className="form-field wide"><span>{t("staff.full_name")}</span><input required value={employeeForm.full_name} onChange={e => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}/></label>
          <label className="form-field"><span>{t("staff.email")}</span><input type="email" value={employeeForm.email || ""} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}/></label>
          <label className="form-field"><span>{t("staff.phone")}</span><input value={employeeForm.phone || ""} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}/></label>
          <label className="form-field wide"><span>{t("staff.qualification")}</span><input value={employeeForm.qualification || ""} onChange={e => setEmployeeForm({ ...employeeForm, qualification: e.target.value })}/></label>
          <label className="form-field"><span>{t("staff.position")}</span><select value={employeeForm.position_id || ""} onChange={e => setEmployeeForm({ ...employeeForm, position_id: e.target.value })}><option value="">{t("common.choose")}</option>{positions.filter(p => p.is_active !== false).map(p => <option key={p.id} value={p.id}>{localizedRole(canonicalRole(p.name) || p.name,language)}</option>)}</select></label>
          <label className="form-field"><span>{t("staff.location")}</span><select value={employeeForm.location_id || ""} onChange={e => setEmployeeForm({ ...employeeForm, location_id: e.target.value })}><option value="">{t("common.choose")}</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <label className="form-field wide"><span>{t("staff.employment_type")}</span><select value={employeeForm.employment_type || ""} onChange={e => setEmployeeForm({ ...employeeForm, employment_type: e.target.value })}><option value="">{t("common.choose")}</option>{employmentTypes.filter(item => item.is_active !== false).map(item => <option key={item.id} value={item.code}>{item.name}</option>)}</select></label>
          <label className="form-field"><span>{t("staff.monthly_wage")} (Ft)</span><input type="number" min="0" value={employeeForm.monthly_wage} onChange={e => setEmployeeForm({ ...employeeForm, monthly_wage: e.target.value })}/></label>
          <label className="form-field"><span>{t("staff.hourly_wage")} (Ft)</span><input type="number" min="0" value={employeeForm.hourly_wage} onChange={e => setEmployeeForm({ ...employeeForm, hourly_wage: e.target.value })}/></label>
          <label className="form-field"><span>{t("staff.commission")} (%)</span><input type="number" min="0" max="100" step="0.1" value={employeeForm.commission_percent} onChange={e => setEmployeeForm({ ...employeeForm, commission_percent: e.target.value })}/></label>
          <label className="modal-active"><input type="checkbox" checked={employeeForm.active !== false} onChange={e => setEmployeeForm({ ...employeeForm, active: e.target.checked })}/><span>{t("staff.active_employee")}</span></label>
        </div>
        <footer className="modal-footer"><button type="button" className="staff-ghost" onClick={() => setEmployeeModal(false)}>{t("common.cancel")}</button><button className="staff-primary" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</button></footer>
      </form>
    </div>}
  </main>;
}
