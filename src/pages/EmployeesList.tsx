import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight, CircleDollarSign, FileText, History, Mail, MapPin, Pencil, Percent, Phone, Plus, Search, ShieldCheck, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./EmployeesList.css";
import "./EmployeesHrV2.css";

type Employee = {
  id: string; full_name: string; first_name?: string; last_name?: string; email?: string;
  phone?: string; qualification?: string; employment_type?: string; location_id?: string;
  location_name?: string; position_id?: string; position_name?: string; monthly_wage?: number;
  hourly_wage?: number; commission_percent?: number; photo_url?: string; active?: boolean; role?: string | string[];
};
type Position = { id: string; name: string; code?: string; description?: string; base_monthly_wage: number; base_hourly_wage: number; commission_percent: number; is_active: boolean; employee_count: number };
type Location = { id: string; name: string };
type EmploymentType = { id: string; code: string; name: string; employee_kind: string; default_weekly_hours?: number; is_active: boolean };
type CompensationPlan = { id: string; name: string; code?: string; monthly_base: number; hourly_rate: number; service_commission_percent: number; product_commission_percent: number; is_active: boolean };
type Service = { id: string; name: string; base_price?: number; base_duration_minutes?: number; active?: boolean };
type EmployeeOverview = { contracts: any[]; positions: any[]; compensation: any[]; services: any[]; timesheets: any[]; leaves: any[] };
type Tab = "employees" | "positions" | "employment" | "wages" | "admin";

const emptyEmployee = { full_name: "", email: "", phone: "", qualification: "", employment_type: "full_time_indefinite", location_id: "", position_id: "", monthly_wage: "", hourly_wage: "", commission_percent: "", login_name: "", plain_password: "", active: true };
const emptyPosition = { name: "", code: "", description: "", base_monthly_wage: "", base_hourly_wage: "", commission_percent: "", is_active: true };
const money = (value?: number | string | null) => value ? `${Number(value).toLocaleString("hu-HU")} Ft` : "—";
const initials = (name = "") => name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
const roleLabel = (employee: Employee) => {
  if (employee.position_name) return employee.position_name;
  const raw = Array.isArray(employee.role) ? employee.role[0] : employee.role;
  const labels: Record<string, string> = { admin: "Adminisztrátor", receptionist: "Recepciós", employee: "Munkatárs", worker: "Munkatárs", hairdresser: "Fodrász", manicurist: "Körmös", cosmetician: "Kozmetikus", masseur: "Masszőr" };
  return raw ? (labels[raw] || raw) : "Nincs munkakör";
};

export default function EmployeesList() {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultTab: Tab = location.pathname.includes("payroll") ? "wages" : location.pathname.includes("positions") ? "positions" : "employees";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [compensationPlans, setCompensationPlans] = useState<CompensationPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<any[]>([]);
  const [adminData, setAdminData] = useState<any>({ rules:[], runs:[], audit:[], timesheets:[], leaves:[] });
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [employeeModal, setEmployeeModal] = useState(false);
  const [positionModal, setPositionModal] = useState(false);
  const [wageEmployee, setWageEmployee] = useState<Employee | null>(null);
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null);
  const [overview, setOverview] = useState<EmployeeOverview | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [employeeForm, setEmployeeForm] = useState<any>(emptyEmployee);
  const [positionForm, setPositionForm] = useState<any>(emptyPosition);
  const [wageForm, setWageForm] = useState<any>({ monthly_wage: "", hourly_wage: "", commission_percent: "", valid_from: new Date().toISOString().slice(0, 10), note: "" });
  const [contractForm, setContractForm] = useState<any>({ employment_type_id: "", contract_number: "", start_date: new Date().toISOString().slice(0,10), end_date: "", probation_end_date: "", weekly_hours: "40", work_schedule_type: "general", cost_center: "", notes: "", is_active: true });
  const [planModal, setPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<any>({ name:"",code:"",monthly_base:"",hourly_rate:"",service_commission_percent:"",product_commission_percent:"",attendance_bonus:"",target_bonus:"",is_active:true });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);
  const api = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(withBase(path), { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.error || "A művelet nem sikerült.");
    return data;
  }, [headers]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [employeeResult, positionResult, locationResult, typeResult, planResult, serviceResult, ruleResult, runResult, auditResult, timeResult, leaveResult] = await Promise.allSettled([
      api(`employees${includeInactive ? "?include_inactive=1" : ""}`),
      api("employees/positions"),
      api("locations"),
      api("hr/employment-types"),
      api("hr/compensation-plans"),
      api("services"),
      api("payroll/commission-rules"),
      api("payroll/runs"),
      api("hr/audit?limit=30"),
      api("hr/timesheets"),
      api("hr/leave-requests")
    ]);
    const employeeData = employeeResult.status === "fulfilled" && Array.isArray(employeeResult.value) ? employeeResult.value : [];
    const positionData = positionResult.status === "fulfilled" && Array.isArray(positionResult.value)
      ? positionResult.value.map((position: Partial<Position>) => ({
          ...position,
          id: String(position.id || ""),
          name: String(position.name || "Névtelen munkakör"),
          base_monthly_wage: Number(position.base_monthly_wage || 0),
          base_hourly_wage: Number(position.base_hourly_wage || 0),
          commission_percent: Number(position.commission_percent || 0),
          employee_count: Number(position.employee_count || 0),
          is_active: position.is_active !== false,
        }))
      : [];
    const locationData = locationResult.status === "fulfilled" && Array.isArray(locationResult.value) ? locationResult.value : [];
    const locationNames = new Map(locationData.map((item: Location) => [String(item.id), item.name]));
    const positionNames = new Map(positionData.map((item: Position) => [String(item.id), item.name]));
    setEmployees(employeeData.map((employee: Employee) => ({
      ...employee,
      active: employee.active !== false,
      location_name: employee.location_name || locationNames.get(String(employee.location_id || "")) || undefined,
      position_name: employee.position_name || positionNames.get(String(employee.position_id || "")) || undefined,
    })));
    setPositions(positionData);
    setLocations(locationData);
    setEmploymentTypes(typeResult.status === "fulfilled" && Array.isArray(typeResult.value) ? typeResult.value : []);
    setCompensationPlans(planResult.status === "fulfilled" && Array.isArray(planResult.value) ? planResult.value : []);
    setServices(serviceResult.status === "fulfilled" && Array.isArray(serviceResult.value) ? serviceResult.value : []);
    setAdminData({
      rules:ruleResult.status==="fulfilled"&&Array.isArray(ruleResult.value)?ruleResult.value:[],
      runs:runResult.status==="fulfilled"&&Array.isArray(runResult.value)?runResult.value:[],
      audit:auditResult.status==="fulfilled"&&Array.isArray(auditResult.value)?auditResult.value:[],
      timesheets:timeResult.status==="fulfilled"&&Array.isArray(timeResult.value)?timeResult.value:[],
      leaves:leaveResult.status==="fulfilled"&&Array.isArray(leaveResult.value)?leaveResult.value:[]
    });
    if (employeeResult.status === "rejected") {
      setError(employeeResult.reason?.message || "A munkatársak betöltése nem sikerült.");
    } else if (positionResult.status === "rejected") {
      setError("A munkatársak betöltődtek, de a munkakör-kezelő backend még nincs telepítve.");
    } else if (locationResult.status === "rejected") {
      setError("A munkatársak betöltődtek, de a telephelyek lekérése nem sikerült.");
    }
    setLoading(false);
  }, [api, includeInactive]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => employees.filter(emp => {
    const needle = search.trim().toLowerCase();
    const haystack = `${emp.full_name} ${emp.email || ""} ${emp.phone || ""} ${roleLabel(emp)}`.toLowerCase();
    return (!needle || haystack.includes(needle)) && (!positionFilter || emp.position_id === positionFilter);
  }), [employees, search, positionFilter]);
  const activeCount = employees.filter(e => e.active).length;
  const totalMonthly = employees.filter(e => e.active).reduce((sum, e) => sum + Number(e.monthly_wage || 0), 0);

  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); };
  const openEmployee = async (employee?: Employee) => {
    setEmployeeForm(employee ? { ...emptyEmployee, ...employee, monthly_wage: employee.monthly_wage || "", hourly_wage: employee.hourly_wage || "", commission_percent: employee.commission_percent || "" } : emptyEmployee);
    setOverview(null); setEmployeeServices([]);
    setEmployeeModal(true);
    if (employee?.id) {
      try {
        const detail = await api(`hr/employees/${employee.id}/overview`);
        setOverview(detail);
        setEmployeeServices((detail.services || []).map((item:any)=>({ service_id:item.service_id, custom_price:item.custom_price ?? "", custom_duration_minutes:item.custom_duration_minutes ?? "" })));
      } catch(e:any) { setError(e.message); }
    }
  };
  const saveEmployee = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const isEdit = Boolean(employeeForm.id);
      const saved = await api(isEdit ? `employees/${employeeForm.id}` : "employees", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(employeeForm) });
      const employeeId = employeeForm.id || saved?.id;
      if (employeeId && employeeForm.position_id) await api(`hr/employees/${employeeId}/positions`, { method:"POST", body:JSON.stringify({ position_id:employeeForm.position_id, location_id:employeeForm.location_id || null, is_primary:true, valid_from:new Date().toISOString().slice(0,10) }) });
      if (employeeId) await api(`employees/${employeeId}/services`, { method:"PUT", body:JSON.stringify({ services:employeeServices }) });
      setEmployeeModal(false); showNotice(isEdit ? "A munkatárs adatai frissültek." : "Az új munkatárs létrejött."); await load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const savePosition = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api(editingPosition ? `employees/positions/${editingPosition.id}` : "employees/positions", { method: editingPosition ? "PATCH" : "POST", body: JSON.stringify(positionForm) });
      setPositionModal(false); setEditingPosition(null); showNotice("A munkakör mentése sikerült."); await load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const openPosition = (position?: Position) => {
    setEditingPosition(position || null); setPositionForm(position ? { ...position } : emptyPosition); setPositionModal(true);
  };
  const openWage = (employee: Employee) => {
    setWageEmployee(employee); setWageForm({ compensation_plan_id:"", monthly_wage: employee.monthly_wage || "", hourly_wage: employee.hourly_wage || "", commission_percent: employee.commission_percent || "", product_commission_percent:"", valid_from: new Date().toISOString().slice(0, 10), note: "" });
  };
  const saveWage = async (event: FormEvent) => {
    event.preventDefault(); if (!wageEmployee) return; setSaving(true);
    try { await api(`hr/employees/${wageEmployee.id}/compensation`, { method: "POST", body: JSON.stringify({ compensation_plan_id:wageForm.compensation_plan_id || null, monthly_base:wageForm.monthly_wage, hourly_rate:wageForm.hourly_wage, service_commission_percent:wageForm.commission_percent, product_commission_percent:wageForm.product_commission_percent, valid_from:wageForm.valid_from, reason:wageForm.note }) }); setWageEmployee(null); showNotice("Az új bérezés rögzítve és auditálva lett."); await load(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const openContract = async (employee: Employee) => {
    setContractEmployee(employee); setOverview(null);
    setContractForm({ employment_type_id:employmentTypes.find(t=>t.code===employee.employment_type)?.id || "", contract_number:"", start_date:new Date().toISOString().slice(0,10), end_date:"", probation_end_date:"", weekly_hours:"40", work_schedule_type:"general", cost_center:"", notes:"", is_active:true });
    try { setOverview(await api(`hr/employees/${employee.id}/overview`)); } catch(e:any) { setError(e.message); }
  };
  const saveContract = async (event:FormEvent) => {
    event.preventDefault(); if(!contractEmployee)return; setSaving(true);
    try { await api(`hr/employees/${contractEmployee.id}/contracts`,{method:"POST",body:JSON.stringify(contractForm)}); showNotice("A foglalkoztatási szerződés létrejött."); setContractEmployee(null); await load(); }
    catch(e:any){setError(e.message);} finally{setSaving(false);}
  };
  const savePlan = async (event:FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { await api("hr/compensation-plans",{method:"POST",body:JSON.stringify(planForm)}); setPlanModal(false); showNotice("Az új bércsomag létrejött."); await load(); }
    catch(e:any){setError(e.message);} finally{setSaving(false);}
  };
  const toggleActive = async (employee: Employee) => {
    try { await api(`employees/${employee.id}/active`, { method: "PATCH", body: JSON.stringify({ active: !employee.active }) }); await load(); }
    catch (e: any) { setError(e.message); }
  };

  return <main className="staff-page">
    {notice && <div className="staff-toast"><Check size={17}/>{notice}</div>}
    <section className="staff-hero">
      <div><span className="staff-eyebrow">CSAPAT ÉS HR</span><h1>Munkatársak</h1><p>Csapat, munkakörök, szerződések és bérezés egy átlátható felületen.</p></div>
      <button className="staff-primary" onClick={() => openEmployee()}><Plus size={18}/> Új munkatárs</button>
    </section>
    <section className="staff-stats">
      <article><span className="stat-icon purple"><UsersRound/></span><div><small>Aktív munkatárs</small><strong>{activeCount}</strong></div></article>
      <article><span className="stat-icon blue"><BriefcaseBusiness/></span><div><small>Aktív munkakör</small><strong>{positions.filter(p => p.is_active).length}</strong></div></article>
      <article><span className="stat-icon gold"><CircleDollarSign/></span><div><small>Havi alapbér összesen</small><strong>{money(totalMonthly)}</strong></div></article>
      <article><span className="stat-icon green"><Building2/></span><div><small>Telephely</small><strong>{locations.length}</strong></div></article>
    </section>
    <nav className="staff-tabs">
      <button className={tab === "employees" ? "active" : ""} onClick={() => setTab("employees")}><UsersRound size={17}/> Munkatársak <b>{employees.length}</b></button>
      <button className={tab === "positions" ? "active" : ""} onClick={() => setTab("positions")}><BriefcaseBusiness size={17}/> Munkakörök</button>
      <button className={tab === "employment" ? "active" : ""} onClick={() => setTab("employment")}><FileText size={17}/> Foglalkoztatás</button>
      <button className={tab === "wages" ? "active" : ""} onClick={() => setTab("wages")}><CircleDollarSign size={17}/> Bérezés</button>
      <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}><ShieldCheck size={17}/> HR adminisztráció</button>
    </nav>
    {error && <div className="staff-alert">{error}<button onClick={() => setError("")}><X size={16}/></button></div>}

    {tab === "employees" && <section className="staff-panel">
      <header className="panel-toolbar">
        <div className="staff-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Keresés név, e-mail, telefonszám alapján…"/></div>
        <div className="staff-select"><SlidersHorizontal size={16}/><select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}><option value="">Minden munkakör</option>{positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <label className="staff-switch"><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)}/><span/> Inaktívak</label>
      </header>
      <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>Munkatárs</th><th>Munkakör</th><th>Telephely</th><th>Kapcsolat</th><th>Bérezés</th><th>Státusz</th><th/></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7} className="staff-empty">Adatok betöltése…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="staff-empty">Nincs a szűrésnek megfelelő munkatárs.</td></tr> : filtered.map(emp => <tr key={emp.id}>
        <td><div className="staff-person">{emp.photo_url ? <img src={emp.photo_url} alt=""/> : <span>{initials(emp.full_name)}</span>}<div><strong>{emp.full_name}</strong><small>{emp.qualification || "Nincs megadva végzettség"}</small></div></div></td>
        <td><span className="staff-pill">{roleLabel(emp)}</span></td>
        <td><span className="staff-muted"><MapPin size={14}/>{emp.location_name || "Nincs telephely"}</span></td>
        <td><div className="staff-contact">{emp.email && <span><Mail size={13}/>{emp.email}</span>}{emp.phone && <span><Phone size={13}/>{emp.phone}</span>}{!emp.email && !emp.phone && "—"}</div></td>
        <td><strong>{money(emp.monthly_wage)}</strong><small className="staff-block">{emp.hourly_wage ? `${money(emp.hourly_wage)} / óra` : ""}</small></td>
        <td><button className={`status-badge ${emp.active ? "on" : "off"}`} onClick={() => toggleActive(emp)}><i/>{emp.active ? "Aktív" : "Inaktív"}</button></td>
        <td><button className="icon-button" onClick={() => openEmployee(emp)} title="Szerkesztés"><Pencil size={16}/></button></td>
      </tr>)}</tbody></table></div>
    </section>}

    {tab === "positions" && <section className="staff-panel">
      <header className="section-heading"><div><h2>Munkakörök</h2><p>Alapbérek, óradíjak és jutalékok központi kezelése.</p></div><button className="staff-secondary" onClick={() => openPosition()}><Plus size={17}/> Új munkakör</button></header>
      <div className="position-grid">{positions.map(pos => <article className="position-card" key={pos.id}><header><span><BriefcaseBusiness/></span><button className="icon-button" onClick={() => openPosition(pos)}><Pencil size={16}/></button></header><h3>{pos.name}</h3><p>{pos.description || "Nincs leírás megadva."}</p><div className="position-money"><div><small>Alap havibér</small><strong>{money(pos.base_monthly_wage)}</strong></div><div><small>Óradíj</small><strong>{money(pos.base_hourly_wage)}</strong></div><div><small>Jutalék</small><strong>{Number(pos.commission_percent || 0)}%</strong></div></div><footer><span>{pos.employee_count} munkatárs</span><span className={pos.is_active ? "active-text" : "inactive-text"}>{pos.is_active ? "Aktív" : "Inaktív"}</span></footer></article>)}</div>
    </section>}

    {tab === "wages" && <section className="staff-panel">
      <header className="section-heading"><div><h2>Bérezés</h2><p>Bércsomagok, egyéni alapbér, óradíj és jutalék auditálható történettel.</p></div><button className="staff-secondary" onClick={()=>setPlanModal(true)}><Plus size={17}/> Új bércsomag</button></header>
      <div className="hr-chip-grid">{compensationPlans.map(plan=><article className="hr-chip-card" key={plan.id}><CircleDollarSign/><div><strong>{plan.name}</strong><small>{money(plan.monthly_base)} · {Number(plan.service_commission_percent||0)}% szolgáltatási jutalék</small></div></article>)}</div>
      <div className="wage-list">{employees.map(emp => <button key={emp.id} className="wage-row" onClick={() => openWage(emp)}><span className="mini-avatar">{initials(emp.full_name)}</span><span className="wage-person"><strong>{emp.full_name}</strong><small>{roleLabel(emp)}</small></span><span><small>Havibér</small><strong>{money(emp.monthly_wage)}</strong></span><span><small>Óradíj</small><strong>{money(emp.hourly_wage)}</strong></span><span><small>Jutalék</small><strong>{Number(emp.commission_percent || 0)}%</strong></span><ChevronRight size={18}/></button>)}</div>
    </section>}

    {tab === "employment" && <section className="staff-panel"><header className="section-heading"><div><h2>Foglalkoztatás és szerződések</h2><p>Jogviszonyok, munkaidő és szerződési időszakok kezelése.</p></div></header><div className="employment-types">{employmentTypes.filter(t=>t.is_active).map(t=><span key={t.id}>{t.name}</span>)}</div><div className="wage-list">{employees.map(emp=><button key={emp.id} className="wage-row" onClick={()=>openContract(emp)}><span className="mini-avatar">{initials(emp.full_name)}</span><span className="wage-person"><strong>{emp.full_name}</strong><small>{roleLabel(emp)} · {emp.location_name||"Nincs telephely"}</small></span><span><small>Jogviszony</small><strong>{employmentTypes.find(t=>t.code===emp.employment_type)?.name||"Nincs szerződés"}</strong></span><ChevronRight size={18}/></button>)}</div></section>}

    {tab === "admin" && <section className="staff-panel hr-admin-panel">
      <header className="section-heading"><div><h2>HR adminisztráció</h2><p>Minden munkatársi törzsadat, foglalkoztatás és számfejtési funkció egy helyről.</p></div><button className="staff-secondary" onClick={load}>Adatok frissítése</button></header>
      <div className="hr-admin-grid">
        <button onClick={()=>setTab("positions")}><BriefcaseBusiness/><span><strong>Munkakörök</strong><small>{positions.length} munkakör · létrehozás és bérezési alapok</small></span><ChevronRight/></button>
        <button onClick={()=>setTab("employment")}><FileText/><span><strong>Szerződések és jogviszonyok</strong><small>{employmentTypes.length} foglalkoztatási forma</small></span><ChevronRight/></button>
        <button onClick={()=>setTab("wages")}><CircleDollarSign/><span><strong>Bércsomagok</strong><small>{compensationPlans.length} csomag · alapbér, órabér, jutalék</small></span><ChevronRight/></button>
        <button onClick={()=>setTab("employees")}><UsersRound/><span><strong>Szolgáltatás-hozzárendelések</strong><small>Munkatárs szerkesztése alatt állítható</small></span><ChevronRight/></button>
        <button onClick={()=>navigate("/hr/timesheets")}><CalendarDays/><span><strong>Jelenléti ívek</strong><small>{adminData.timesheets.length} rögzített sor</small></span><ChevronRight/></button>
        <button onClick={()=>navigate("/hr/vacations")}><CalendarDays/><span><strong>Szabadságok és távollétek</strong><small>{adminData.leaves.length} kérelem</small></span><ChevronRight/></button>
        <button onClick={()=>navigate("/modules/team/payroll")}><Percent/><span><strong>Jutalékszabályok</strong><small>{adminData.rules.length} szabály</small></span><ChevronRight/></button>
        <button onClick={()=>navigate("/modules/team/payroll")}><CircleDollarSign/><span><strong>Számfejtések</strong><small>{adminData.runs.length} mentett számfejtés</small></span><ChevronRight/></button>
        <button onClick={()=>navigate("/admin/access-control")}><ShieldCheck/><span><strong>Jogosultságok</strong><small>Szerepkörök és menü-hozzáférés</small></span><ChevronRight/></button>
      </div>
      <div className="hr-admin-audit"><header><div><History/><span><h3>Legutóbbi adminisztrációs események</h3><p>Munkakör-, szerződés-, bérezés- és jelenléti változások.</p></span></div><b>{adminData.audit.length} bejegyzés</b></header><div>{adminData.audit.slice(0,12).map((row:any)=><article key={row.id}><span>{String(row.action||"módosítás").toUpperCase()}</span><div><strong>{row.entity_type||"rendszer"}</strong><small>{row.entity_id||"—"}</small></div><time>{row.created_at?new Date(row.created_at).toLocaleString("hu-HU"):"—"}</time></article>)}{adminData.audit.length===0&&<p className="staff-empty">Nincs megjeleníthető auditbejegyzés.</p>}</div></div>
    </section>}

    {employeeModal && <div className="staff-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEmployeeModal(false)}><form className="staff-modal wide" onSubmit={saveEmployee}><ModalHeader title={employeeForm.id ? "Munkatárs szerkesztése" : "Új munkatárs"} subtitle="Személyes, munkavégzési és bérezési adatok" onClose={() => setEmployeeModal(false)}/><div className="modal-body">
      <FormSection title="Személyes adatok"><Field label="Teljes név *"><input required value={employeeForm.full_name} onChange={e => setEmployeeForm({...employeeForm, full_name:e.target.value})}/></Field><Field label="E-mail"><input type="email" value={employeeForm.email || ""} onChange={e => setEmployeeForm({...employeeForm, email:e.target.value})}/></Field><Field label="Telefonszám"><input value={employeeForm.phone || ""} onChange={e => setEmployeeForm({...employeeForm, phone:e.target.value})}/></Field><Field label="Végzettség"><input value={employeeForm.qualification || ""} onChange={e => setEmployeeForm({...employeeForm, qualification:e.target.value})}/></Field></FormSection>
      <FormSection title="Munkavégzés"><Field label="Munkakör"><select value={employeeForm.position_id || ""} onChange={e => setEmployeeForm({...employeeForm, position_id:e.target.value})}><option value="">Válasszon munkakört</option>{positions.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Telephely"><select value={employeeForm.location_id || ""} onChange={e => setEmployeeForm({...employeeForm, location_id:e.target.value})}><option value="">Válasszon telephelyet</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field><Field label="Foglalkoztatás"><select value={employeeForm.employment_type || ""} onChange={e => setEmployeeForm({...employeeForm, employment_type:e.target.value})}>{employmentTypes.filter(t=>t.is_active).map(t=><option key={t.id} value={t.code}>{t.name}</option>)}</select></Field><label className="modal-check"><input type="checkbox" checked={employeeForm.active} onChange={e=>setEmployeeForm({...employeeForm,active:e.target.checked})}/><span><b>Aktív munkatárs</b><small>Megjelenik a foglalható munkatársak között.</small></span></label></FormSection>
      <FormSection title="Bérezés"><Field label="Havi alapbér (Ft)"><input type="number" min="0" value={employeeForm.monthly_wage} onChange={e=>setEmployeeForm({...employeeForm,monthly_wage:e.target.value})}/></Field><Field label="Óradíj (Ft)"><input type="number" min="0" value={employeeForm.hourly_wage} onChange={e=>setEmployeeForm({...employeeForm,hourly_wage:e.target.value})}/></Field><Field label="Jutalék (%)"><input type="number" min="0" max="100" step="0.1" value={employeeForm.commission_percent} onChange={e=>setEmployeeForm({...employeeForm,commission_percent:e.target.value})}/></Field></FormSection>
      <FormSection title="Végezhető szolgáltatások"><div className="employee-service-picker">{services.filter(s=>s.active!==false).map(service=>{const assigned=employeeServices.find(x=>x.service_id===service.id);return <label key={service.id} className={assigned?"selected":""}><input type="checkbox" checked={Boolean(assigned)} onChange={e=>setEmployeeServices(e.target.checked?[...employeeServices,{service_id:service.id,custom_price:"",custom_duration_minutes:""}]:employeeServices.filter(x=>x.service_id!==service.id))}/><span><b>{service.name}</b><small>{money(service.base_price)} · {service.base_duration_minutes||0} perc</small></span></label>})}{services.length===0&&<p className="staff-empty">Nincs elérhető szolgáltatás.</p>}</div></FormSection>
      {employeeForm.id && <FormSection title="HR előzmények"><div className="employee-history"><article><b>{overview?.contracts?.length||0}</b><span>Szerződés</span><small>{overview?.contracts?.[0]?.employment_type_name||"Nincs aktív szerződés"}</small></article><article><b>{overview?.positions?.length||0}</b><span>Munkakör-hozzárendelés</span><small>{overview?.positions?.[0]?.position_name||"Nincs hozzárendelés"}</small></article><article><b>{overview?.compensation?.length||0}</b><span>Bérbeállítás</span><small>{overview?.compensation?.[0]?.compensation_plan_name||"Egyedi / nincs csomag"}</small></article><article><b>{overview?.timesheets?.length||0}</b><span>Jelenléti sor</span><small>Legutóbbi 10 bejegyzés</small></article><article><b>{overview?.leaves?.length||0}</b><span>Távollét</span><small>Legutóbbi 10 bejegyzés</small></article></div></FormSection>}
      {!employeeForm.id && <FormSection title="Belépés (opcionális)"><Field label="Felhasználónév"><input value={employeeForm.login_name} onChange={e=>setEmployeeForm({...employeeForm,login_name:e.target.value})}/></Field><Field label="Ideiglenes jelszó"><input type="password" value={employeeForm.plain_password} onChange={e=>setEmployeeForm({...employeeForm,plain_password:e.target.value})}/></Field></FormSection>}
    </div><ModalFooter saving={saving} onCancel={()=>setEmployeeModal(false)}/></form></div>}

    {positionModal && <div className="staff-modal-backdrop"><form className="staff-modal" onSubmit={savePosition}><ModalHeader title={editingPosition ? "Munkakör szerkesztése" : "Új munkakör"} subtitle="Alapadatok és bérezési alapértékek" onClose={()=>setPositionModal(false)}/><div className="modal-body one"><FormSection title="Munkakör adatai"><Field label="Megnevezés *"><input required value={positionForm.name} onChange={e=>setPositionForm({...positionForm,name:e.target.value})}/></Field><Field label="Rövid kód"><input value={positionForm.code || ""} onChange={e=>setPositionForm({...positionForm,code:e.target.value})}/></Field><Field label="Leírás" wide><textarea value={positionForm.description || ""} onChange={e=>setPositionForm({...positionForm,description:e.target.value})}/></Field><Field label="Alap havibér"><input type="number" min="0" value={positionForm.base_monthly_wage} onChange={e=>setPositionForm({...positionForm,base_monthly_wage:e.target.value})}/></Field><Field label="Alap óradíj"><input type="number" min="0" value={positionForm.base_hourly_wage} onChange={e=>setPositionForm({...positionForm,base_hourly_wage:e.target.value})}/></Field><Field label="Jutalék (%)"><input type="number" min="0" max="100" value={positionForm.commission_percent} onChange={e=>setPositionForm({...positionForm,commission_percent:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setPositionModal(false)}/></form></div>}

    {wageEmployee && <div className="staff-modal-backdrop"><form className="staff-modal" onSubmit={saveWage}><ModalHeader title="Bérezés módosítása" subtitle={`${wageEmployee.full_name} · ${roleLabel(wageEmployee)}`} onClose={()=>setWageEmployee(null)}/><div className="modal-body one"><FormSection title="Új bérbeállítás"><Field label="Bércsomag"><select value={wageForm.compensation_plan_id} onChange={e=>{const p=compensationPlans.find(x=>x.id===e.target.value);setWageForm({...wageForm,compensation_plan_id:e.target.value,monthly_wage:p?.monthly_base??wageForm.monthly_wage,hourly_wage:p?.hourly_rate??wageForm.hourly_wage,commission_percent:p?.service_commission_percent??wageForm.commission_percent,product_commission_percent:p?.product_commission_percent??wageForm.product_commission_percent})}}><option value="">Egyedi bérezés</option>{compensationPlans.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Havi alapbér (Ft)"><input type="number" min="0" value={wageForm.monthly_wage} onChange={e=>setWageForm({...wageForm,monthly_wage:e.target.value})}/></Field><Field label="Óradíj (Ft)"><input type="number" min="0" value={wageForm.hourly_wage} onChange={e=>setWageForm({...wageForm,hourly_wage:e.target.value})}/></Field><Field label="Szolgáltatási jutalék (%)"><input type="number" min="0" max="100" step="0.1" value={wageForm.commission_percent} onChange={e=>setWageForm({...wageForm,commission_percent:e.target.value})}/></Field><Field label="Termékjutalék (%)"><input type="number" min="0" max="100" step="0.1" value={wageForm.product_commission_percent} onChange={e=>setWageForm({...wageForm,product_commission_percent:e.target.value})}/></Field><Field label="Érvényes ettől"><input type="date" value={wageForm.valid_from} onChange={e=>setWageForm({...wageForm,valid_from:e.target.value})}/></Field><Field label="Megjegyzés" wide><textarea value={wageForm.note} onChange={e=>setWageForm({...wageForm,note:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setWageEmployee(null)}/></form></div>}

    {contractEmployee && <div className="staff-modal-backdrop"><form className="staff-modal wide" onSubmit={saveContract}><ModalHeader title="Új foglalkoztatási szerződés" subtitle={`${contractEmployee.full_name} · ${overview?.contracts.length||0} korábbi szerződés`} onClose={()=>setContractEmployee(null)}/><div className="modal-body"><FormSection title="Jogviszony"><Field label="Foglalkoztatási forma *"><select required value={contractForm.employment_type_id} onChange={e=>setContractForm({...contractForm,employment_type_id:e.target.value})}><option value="">Válasszon</option>{employmentTypes.filter(t=>t.is_active).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field><Field label="Szerződésszám"><input value={contractForm.contract_number} onChange={e=>setContractForm({...contractForm,contract_number:e.target.value})}/></Field><Field label="Kezdőnap *"><input required type="date" value={contractForm.start_date} onChange={e=>setContractForm({...contractForm,start_date:e.target.value})}/></Field><Field label="Zárónap"><input type="date" value={contractForm.end_date} onChange={e=>setContractForm({...contractForm,end_date:e.target.value})}/></Field><Field label="Próbaidő vége"><input type="date" value={contractForm.probation_end_date} onChange={e=>setContractForm({...contractForm,probation_end_date:e.target.value})}/></Field><Field label="Heti óraszám"><input type="number" min="0" max="80" value={contractForm.weekly_hours} onChange={e=>setContractForm({...contractForm,weekly_hours:e.target.value})}/></Field></FormSection><FormSection title="Munkarend és adminisztráció"><Field label="Munkarend"><select value={contractForm.work_schedule_type} onChange={e=>setContractForm({...contractForm,work_schedule_type:e.target.value})}><option value="general">Általános</option><option value="flexible">Rugalmas</option><option value="shift">Műszakos</option><option value="individual">Egyéni</option></select></Field><Field label="Költséghely"><input value={contractForm.cost_center} onChange={e=>setContractForm({...contractForm,cost_center:e.target.value})}/></Field><Field label="Megjegyzés" wide><textarea value={contractForm.notes} onChange={e=>setContractForm({...contractForm,notes:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setContractEmployee(null)}/></form></div>}

    {planModal && <div className="staff-modal-backdrop"><form className="staff-modal" onSubmit={savePlan}><ModalHeader title="Új bércsomag" subtitle="Újrafelhasználható bérezési szabályok" onClose={()=>setPlanModal(false)}/><div className="modal-body one"><FormSection title="Bércsomag"><Field label="Megnevezés *"><input required value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})}/></Field><Field label="Kód"><input value={planForm.code} onChange={e=>setPlanForm({...planForm,code:e.target.value})}/></Field><Field label="Havi alapbér"><input type="number" min="0" value={planForm.monthly_base} onChange={e=>setPlanForm({...planForm,monthly_base:e.target.value})}/></Field><Field label="Óradíj"><input type="number" min="0" value={planForm.hourly_rate} onChange={e=>setPlanForm({...planForm,hourly_rate:e.target.value})}/></Field><Field label="Szolgáltatási jutalék (%)"><input type="number" min="0" max="100" value={planForm.service_commission_percent} onChange={e=>setPlanForm({...planForm,service_commission_percent:e.target.value})}/></Field><Field label="Termékjutalék (%)"><input type="number" min="0" max="100" value={planForm.product_commission_percent} onChange={e=>setPlanForm({...planForm,product_commission_percent:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setPlanModal(false)}/></form></div>}
  </main>;
}

function ModalHeader({title, subtitle, onClose}:{title:string;subtitle:string;onClose:()=>void}) { return <header className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" onClick={onClose}><X size={20}/></button></header>; }
function ModalFooter({saving,onCancel}:{saving:boolean;onCancel:()=>void}) { return <footer className="modal-footer"><button type="button" className="staff-ghost" onClick={onCancel}>Mégse</button><button type="submit" className="staff-primary" disabled={saving}>{saving ? "Mentés…" : "Mentés"}</button></footer>; }
function FormSection({title,children}:{title:string;children:React.ReactNode}) { return <section className="form-section"><h3>{title}</h3><div className="form-grid">{children}</div></section>; }
function Field({label,children,wide}:{label:string;children:React.ReactNode;wide?:boolean}) { return <label className={wide ? "form-field wide" : "form-field"}><span>{label}</span>{children}</label>; }
