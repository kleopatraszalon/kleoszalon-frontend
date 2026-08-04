import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Check, ChevronRight, CircleDollarSign, Mail, MapPin, Pencil, Phone, Plus, Search, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./EmployeesList.css";

type Employee = {
  id: string; full_name: string; first_name?: string; last_name?: string; email?: string;
  phone?: string; qualification?: string; employment_type?: string; location_id?: string;
  location_name?: string; position_id?: string; position_name?: string; monthly_wage?: number;
  hourly_wage?: number; commission_percent?: number; photo_url?: string; active: boolean;
};
type Position = { id: string; name: string; code?: string; description?: string; base_monthly_wage: number; base_hourly_wage: number; commission_percent: number; is_active: boolean; employee_count: number };
type Location = { id: string; name: string };
type Tab = "employees" | "positions" | "wages";

const emptyEmployee = { full_name: "", email: "", phone: "", qualification: "", employment_type: "teljes_munkaido", location_id: "", position_id: "", monthly_wage: "", hourly_wage: "", commission_percent: "", login_name: "", plain_password: "", active: true };
const emptyPosition = { name: "", code: "", description: "", base_monthly_wage: "", base_hourly_wage: "", commission_percent: "", is_active: true };
const money = (value?: number | string | null) => value ? `${Number(value).toLocaleString("hu-HU")} Ft` : "—";
const initials = (name = "") => name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";

export default function EmployeesList() {
  const location = useLocation();
  const defaultTab: Tab = location.pathname.includes("payroll") ? "wages" : location.pathname.includes("positions") ? "positions" : "employees";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [employeeModal, setEmployeeModal] = useState(false);
  const [positionModal, setPositionModal] = useState(false);
  const [wageEmployee, setWageEmployee] = useState<Employee | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [employeeForm, setEmployeeForm] = useState<any>(emptyEmployee);
  const [positionForm, setPositionForm] = useState<any>(emptyPosition);
  const [wageForm, setWageForm] = useState<any>({ monthly_wage: "", hourly_wage: "", commission_percent: "", valid_from: new Date().toISOString().slice(0, 10), note: "" });
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
    try {
      const [employeeData, positionData, locationData] = await Promise.all([
        api(`employees${includeInactive ? "?include_inactive=1" : ""}`), api("employees/positions"), api("locations")
      ]);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setPositions(Array.isArray(positionData) ? positionData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
    } catch (e: any) { setError(e.message || "Az adatok betöltése nem sikerült."); }
    finally { setLoading(false); }
  }, [api, includeInactive]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => employees.filter(emp => {
    const needle = search.trim().toLowerCase();
    const haystack = `${emp.full_name} ${emp.email || ""} ${emp.phone || ""} ${emp.position_name || ""}`.toLowerCase();
    return (!needle || haystack.includes(needle)) && (!positionFilter || emp.position_id === positionFilter);
  }), [employees, search, positionFilter]);
  const activeCount = employees.filter(e => e.active).length;
  const totalMonthly = employees.filter(e => e.active).reduce((sum, e) => sum + Number(e.monthly_wage || 0), 0);

  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3200); };
  const openEmployee = (employee?: Employee) => {
    setEmployeeForm(employee ? { ...emptyEmployee, ...employee, monthly_wage: employee.monthly_wage || "", hourly_wage: employee.hourly_wage || "", commission_percent: employee.commission_percent || "" } : emptyEmployee);
    setEmployeeModal(true);
  };
  const saveEmployee = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const isEdit = Boolean(employeeForm.id);
      await api(isEdit ? `employees/${employeeForm.id}` : "employees", { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(employeeForm) });
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
    setWageEmployee(employee); setWageForm({ monthly_wage: employee.monthly_wage || "", hourly_wage: employee.hourly_wage || "", commission_percent: employee.commission_percent || "", valid_from: new Date().toISOString().slice(0, 10), note: "" });
  };
  const saveWage = async (event: FormEvent) => {
    event.preventDefault(); if (!wageEmployee) return; setSaving(true);
    try { await api(`employees/${wageEmployee.id}/wages`, { method: "POST", body: JSON.stringify(wageForm) }); setWageEmployee(null); showNotice("Az új bérezés rögzítve és naplózva lett."); await load(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const toggleActive = async (employee: Employee) => {
    try { await api(`employees/${employee.id}/active`, { method: "PATCH", body: JSON.stringify({ active: !employee.active }) }); await load(); }
    catch (e: any) { setError(e.message); }
  };

  return <main className="staff-page">
    {notice && <div className="staff-toast"><Check size={17}/>{notice}</div>}
    <section className="staff-hero">
      <div><span className="staff-eyebrow">CSAPAT ÉS HR</span><h1>Munkatársak</h1><p>Csapat, munkakörök és bérezés egy átlátható felületen.</p></div>
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
      <button className={tab === "wages" ? "active" : ""} onClick={() => setTab("wages")}><CircleDollarSign size={17}/> Bérezés</button>
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
        <td><span className="staff-pill">{emp.position_name || "Nincs munkakör"}</span></td>
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
      <header className="section-heading"><div><h2>Bérezés</h2><p>Egyéni alapbér, óradíj és jutalék módosítása bértörténettel.</p></div></header>
      <div className="wage-list">{employees.map(emp => <button key={emp.id} className="wage-row" onClick={() => openWage(emp)}><span className="mini-avatar">{initials(emp.full_name)}</span><span className="wage-person"><strong>{emp.full_name}</strong><small>{emp.position_name || "Nincs munkakör"}</small></span><span><small>Havibér</small><strong>{money(emp.monthly_wage)}</strong></span><span><small>Óradíj</small><strong>{money(emp.hourly_wage)}</strong></span><span><small>Jutalék</small><strong>{Number(emp.commission_percent || 0)}%</strong></span><ChevronRight size={18}/></button>)}</div>
    </section>}

    {employeeModal && <div className="staff-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEmployeeModal(false)}><form className="staff-modal wide" onSubmit={saveEmployee}><ModalHeader title={employeeForm.id ? "Munkatárs szerkesztése" : "Új munkatárs"} subtitle="Személyes, munkavégzési és bérezési adatok" onClose={() => setEmployeeModal(false)}/><div className="modal-body">
      <FormSection title="Személyes adatok"><Field label="Teljes név *"><input required value={employeeForm.full_name} onChange={e => setEmployeeForm({...employeeForm, full_name:e.target.value})}/></Field><Field label="E-mail"><input type="email" value={employeeForm.email || ""} onChange={e => setEmployeeForm({...employeeForm, email:e.target.value})}/></Field><Field label="Telefonszám"><input value={employeeForm.phone || ""} onChange={e => setEmployeeForm({...employeeForm, phone:e.target.value})}/></Field><Field label="Végzettség"><input value={employeeForm.qualification || ""} onChange={e => setEmployeeForm({...employeeForm, qualification:e.target.value})}/></Field></FormSection>
      <FormSection title="Munkavégzés"><Field label="Munkakör"><select value={employeeForm.position_id || ""} onChange={e => setEmployeeForm({...employeeForm, position_id:e.target.value})}><option value="">Válasszon munkakört</option>{positions.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Telephely"><select value={employeeForm.location_id || ""} onChange={e => setEmployeeForm({...employeeForm, location_id:e.target.value})}><option value="">Válasszon telephelyet</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field><Field label="Foglalkoztatás"><select value={employeeForm.employment_type || ""} onChange={e => setEmployeeForm({...employeeForm, employment_type:e.target.value})}><option value="teljes_munkaido">Teljes munkaidő</option><option value="reszmunkaido">Részmunkaidő</option><option value="vallalkozo">Vállalkozó</option><option value="gyakornok">Gyakornok</option></select></Field><label className="modal-check"><input type="checkbox" checked={employeeForm.active} onChange={e=>setEmployeeForm({...employeeForm,active:e.target.checked})}/><span><b>Aktív munkatárs</b><small>Megjelenik a foglalható munkatársak között.</small></span></label></FormSection>
      <FormSection title="Bérezés"><Field label="Havi alapbér (Ft)"><input type="number" min="0" value={employeeForm.monthly_wage} onChange={e=>setEmployeeForm({...employeeForm,monthly_wage:e.target.value})}/></Field><Field label="Óradíj (Ft)"><input type="number" min="0" value={employeeForm.hourly_wage} onChange={e=>setEmployeeForm({...employeeForm,hourly_wage:e.target.value})}/></Field><Field label="Jutalék (%)"><input type="number" min="0" max="100" step="0.1" value={employeeForm.commission_percent} onChange={e=>setEmployeeForm({...employeeForm,commission_percent:e.target.value})}/></Field></FormSection>
      {!employeeForm.id && <FormSection title="Belépés (opcionális)"><Field label="Felhasználónév"><input value={employeeForm.login_name} onChange={e=>setEmployeeForm({...employeeForm,login_name:e.target.value})}/></Field><Field label="Ideiglenes jelszó"><input type="password" value={employeeForm.plain_password} onChange={e=>setEmployeeForm({...employeeForm,plain_password:e.target.value})}/></Field></FormSection>}
    </div><ModalFooter saving={saving} onCancel={()=>setEmployeeModal(false)}/></form></div>}

    {positionModal && <div className="staff-modal-backdrop"><form className="staff-modal" onSubmit={savePosition}><ModalHeader title={editingPosition ? "Munkakör szerkesztése" : "Új munkakör"} subtitle="Alapadatok és bérezési alapértékek" onClose={()=>setPositionModal(false)}/><div className="modal-body one"><FormSection title="Munkakör adatai"><Field label="Megnevezés *"><input required value={positionForm.name} onChange={e=>setPositionForm({...positionForm,name:e.target.value})}/></Field><Field label="Rövid kód"><input value={positionForm.code || ""} onChange={e=>setPositionForm({...positionForm,code:e.target.value})}/></Field><Field label="Leírás" wide><textarea value={positionForm.description || ""} onChange={e=>setPositionForm({...positionForm,description:e.target.value})}/></Field><Field label="Alap havibér"><input type="number" min="0" value={positionForm.base_monthly_wage} onChange={e=>setPositionForm({...positionForm,base_monthly_wage:e.target.value})}/></Field><Field label="Alap óradíj"><input type="number" min="0" value={positionForm.base_hourly_wage} onChange={e=>setPositionForm({...positionForm,base_hourly_wage:e.target.value})}/></Field><Field label="Jutalék (%)"><input type="number" min="0" max="100" value={positionForm.commission_percent} onChange={e=>setPositionForm({...positionForm,commission_percent:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setPositionModal(false)}/></form></div>}

    {wageEmployee && <div className="staff-modal-backdrop"><form className="staff-modal" onSubmit={saveWage}><ModalHeader title="Bérezés módosítása" subtitle={`${wageEmployee.full_name} · ${wageEmployee.position_name || "Nincs munkakör"}`} onClose={()=>setWageEmployee(null)}/><div className="modal-body one"><FormSection title="Új bérbeállítás"><Field label="Havi alapbér (Ft)"><input type="number" min="0" value={wageForm.monthly_wage} onChange={e=>setWageForm({...wageForm,monthly_wage:e.target.value})}/></Field><Field label="Óradíj (Ft)"><input type="number" min="0" value={wageForm.hourly_wage} onChange={e=>setWageForm({...wageForm,hourly_wage:e.target.value})}/></Field><Field label="Jutalék (%)"><input type="number" min="0" max="100" step="0.1" value={wageForm.commission_percent} onChange={e=>setWageForm({...wageForm,commission_percent:e.target.value})}/></Field><Field label="Érvényes ettől"><input type="date" value={wageForm.valid_from} onChange={e=>setWageForm({...wageForm,valid_from:e.target.value})}/></Field><Field label="Megjegyzés" wide><textarea value={wageForm.note} onChange={e=>setWageForm({...wageForm,note:e.target.value})}/></Field></FormSection></div><ModalFooter saving={saving} onCancel={()=>setWageEmployee(null)}/></form></div>}
  </main>;
}

function ModalHeader({title, subtitle, onClose}:{title:string;subtitle:string;onClose:()=>void}) { return <header className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" onClick={onClose}><X size={20}/></button></header>; }
function ModalFooter({saving,onCancel}:{saving:boolean;onCancel:()=>void}) { return <footer className="modal-footer"><button type="button" className="staff-ghost" onClick={onCancel}>Mégse</button><button type="submit" className="staff-primary" disabled={saving}>{saving ? "Mentés…" : "Mentés"}</button></footer>; }
function FormSection({title,children}:{title:string;children:React.ReactNode}) { return <section className="form-section"><h3>{title}</h3><div className="form-grid">{children}</div></section>; }
function Field({label,children,wide}:{label:string;children:React.ReactNode;wide?:boolean}) { return <label className={wide ? "form-field wide" : "form-field"}><span>{label}</span>{children}</label>; }
