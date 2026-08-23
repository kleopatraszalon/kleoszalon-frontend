import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, MapPin, Plus, Search, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { fetchArray, fetchJSON, apiFetch } from "../utils/fetch";
import ClientBookingInsights from "./booking/ClientBookingInsights";
import "./AppointmentNewModal.css";
import "./ModernAppointmentNewModal.css";
import "./AppointmentNewClient.css";

type PickerItem = {
  id: string; name?: string | null; full_name?: string | null; title?: string | null;
  phone?: string | null; email?: string | null; color?: string | null; location_id?: string | null;
  duration_minutes?: number | string | null; base_price?: number | string | null;
  list_price?: number | string | null; promo_price?: number | string | null;
  service_type_name?: string | null; category_name?: string | null; category?: string | null;
  vip?: boolean | null; is_vip?: boolean | null; vip_status?: string | null;
  loyalty_points?: number | string | null; points?: number | string | null;
  visit_count?: number | string | null; appointments_count?: number | string | null;
  last_visit_at?: string | null; last_appointment_at?: string | null;
  favorite_service_name?: string | null; favourite_service_name?: string | null;
  allergies?: string | string[] | null; allergy_notes?: string | null; notes?: string | null;
  internal_notes?: string | null; marketing_consent?: boolean | null;
};
type Props = { onSaved: () => void; onClose: () => void; initialEmployeeId?: string; initialDate?: string; initialStartMinutes?: number; initialDurationMinutes?: number };

const pad2 = (value: number) => String(value).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const minutesToHM = (value: number) => `${pad2(Math.floor(value / 60) % 24)}:${pad2(value % 60)}`;
const hmToMinutes = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
const addMinutesHM = (value: string, duration: number) => minutesToHM(hmToMinutes(value) + duration);
const displayName = (item: PickerItem) => item.full_name || item.name || item.title || item.id;
const serviceDuration = (item: PickerItem) => Math.max(Number(item.duration_minutes || 30), 5);
const servicePrice = (item: PickerItem) => Number(item.promo_price ?? item.list_price ?? item.base_price ?? 0);
const serviceGroup = (item: PickerItem) => item.service_type_name || item.category_name || item.category || "Egyéb szolgáltatások";
const combineISO = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

export function AppointmentNewModal({ onSaved, onClose, initialEmployeeId, initialDate, initialStartMinutes, initialDurationMinutes = 30 }: Props) {
  const initialTime = initialStartMinutes == null ? minutesToHM(Math.ceil((new Date().getHours() * 60 + new Date().getMinutes()) / 15) * 15) : minutesToHM(initialStartMinutes);
  const [locations, setLocations] = useState<PickerItem[]>([]);
  const [employees, setEmployees] = useState<PickerItem[]>([]);
  const [clients, setClients] = useState<PickerItem[]>([]);
  const [services, setServices] = useState<PickerItem[]>([]);
  const [locationId, setLocationId] = useState("");
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || "");
  const [clientId, setClientId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate || todayISO());
  const [startHM, setStartHM] = useState(initialTime);
  const [note, setNote] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", birth_date: "", notes: "" });
  const [clientSaving, setClientSaving] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [serviceToAdd, setServiceToAdd] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchArray<PickerItem>("/api/locations"), fetchArray<PickerItem>("/api/employees"),
      fetchArray<PickerItem>("/api/clients"), fetchArray<PickerItem>("/api/services"),
    ]).then(([locs, emps, cls, svs]) => {
      if (!active) return;
      setLocations(locs); setEmployees(emps); setClients(cls); setServices(svs);
      setLocationId((current) => current || locs[0]?.id || "");
      setEmployeeId((current) => current || emps[0]?.id || "");
    }).catch(() => setError("A foglaláshoz szükséges adatok betöltése sikertelen.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const selectedServices = useMemo(() => selectedServiceIds.map((id) => services.find((service) => service.id === id)).filter(Boolean) as PickerItem[], [selectedServiceIds, services]);
  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId) || null, [clients, clientId]);
  const totalDuration = useMemo(() => selectedServices.reduce((sum, service) => sum + serviceDuration(service), 0) || initialDurationMinutes, [selectedServices, initialDurationMinutes]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, service) => sum + servicePrice(service), 0), [selectedServices]);
  const endHM = useMemo(() => addMinutesHM(startHM, totalDuration), [startHM, totalDuration]);
  const visibleClients = useMemo(() => clients.filter((client) => `${displayName(client)} ${client.phone || ""}`.toLocaleLowerCase("hu-HU").includes(clientQuery.toLocaleLowerCase("hu-HU"))).slice(0, 8), [clients, clientQuery]);
  const serviceCategories = useMemo(() => Array.from(new Set(services.map(serviceGroup))).sort((a,b)=>a.localeCompare(b,"hu")), [services]);
  const selectableServices = useMemo(() => services
    .filter((service) => !selectedServiceIds.includes(service.id))
    .filter((service) => serviceCategory === "all" || serviceGroup(service) === serviceCategory)
    .filter((service) => `${displayName(service)} ${serviceGroup(service)}`.toLocaleLowerCase("hu-HU").includes(serviceQuery.toLocaleLowerCase("hu-HU")))
    .sort((a,b) => serviceGroup(a).localeCompare(serviceGroup(b),"hu") || displayName(a).localeCompare(displayName(b),"hu")),
    [services, selectedServiceIds, serviceCategory, serviceQuery]);
  const groupedServices = useMemo(() => {
    const groups = new Map<string, PickerItem[]>();
    selectableServices.forEach(service => { const group = serviceGroup(service); groups.set(group, [...(groups.get(group) || []), service]); });
    return [...groups.entries()];
  }, [selectableServices]);
  const filteredEmployees = useMemo(() => employees.filter((employee) => !locationId || !employee.location_id || employee.location_id === locationId), [employees, locationId]);

  const checkConflicts = useCallback(async () => {
    if (!employeeId || !locationId || !date || !startHM) return;
    setChecking(true);
    try {
      const query = new URLSearchParams({ employee_id: employeeId, location_id: locationId, start: combineISO(date, startHM), end: combineISO(date, endHM) });
      const result = await fetchJSON<any>(`/api/appointments/conflicts?${query}`, undefined, []);
      setConflicts(Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []);
    } catch { setConflicts([]); }
    finally { setChecking(false); }
  }, [employeeId, locationId, date, startHM, endHM]);

  useEffect(() => { const timer = window.setTimeout(() => void checkConflicts(), 350); return () => window.clearTimeout(timer); }, [checkConflicts]);

  const addService = (service: PickerItem) => { setSelectedServiceIds((current) => [...current, service.id]); setServiceToAdd(""); setError(null); };
  const removeService = (id: string) => setSelectedServiceIds((current) => current.filter((serviceId) => serviceId !== id));
  const createClient = async () => {
    const name = newClient.name.trim(), phone = newClient.phone.trim(), email = newClient.email.trim();
    if (!name) { setError("Az új vendég neve kötelező."); return; }
    if (!phone && !email) { setError("Az új vendéghez telefonszám vagy e-mail-cím szükséges."); return; }
    if (!locationId) { setError("Az új vendég felvétele előtt válasszon telephelyet."); return; }
    setClientSaving(true); setError(null);
    try {
      const result = await apiFetch<{ id: string }>("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newClient, name, full_name: name, phone: phone || null, email: email || null, birth_date: newClient.birth_date || null, location_id: locationId, source: "appointment" }) });
      const created: PickerItem = { id: String(result.id), name, full_name: name, phone: phone || null, email: email || null, location_id: locationId };
      setClients((current) => [created, ...current.filter((client) => client.id !== created.id)]);
      setClientId(created.id); setClientQuery(name); setNewClientOpen(false);
      setNewClient({ name: "", phone: "", email: "", birth_date: "", notes: "" });
    } catch (reason: any) { setError(reason?.message || "Az új vendég létrehozása sikertelen."); }
    finally { setClientSaving(false); }
  };
  const canSubmit = Boolean(locationId && employeeId && clientId && selectedServiceIds.length && date && startHM && !conflicts.length && !checking && !saving);

  const submit = async () => {
    if (!canSubmit) { setError(conflicts.length ? "A kiválasztott munkatársnak ekkor már van foglalása." : "Töltse ki a kötelező mezőket és adjon hozzá legalább egy szolgáltatást."); return; }
    setSaving(true); setError(null);
    try {
      await apiFetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        location_id: locationId, employee_id: employeeId, client_id: clientId,
        start_time: combineISO(date, startHM), end_time: combineISO(date, endHM), notes: note,
        services: selectedServices.map((service) => ({ service_id: service.id })),
      }) });
      onSaved();
    } catch (reason: any) { setError(reason?.message || "Az időpont mentése sikertelen."); }
    finally { setSaving(false); }
  };

  return <div className="booking-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <header className="booking-modal-header"><div className="booking-modal-title-group"><i><CalendarDays size={20}/></i><div><span>Új foglalás</span><h2 id="booking-modal-title">Időpont létrehozása</h2><p>Adja meg a vendéget, a szolgáltatást és a megfelelő időpontot.</p></div></div><button onClick={onClose} aria-label="Bezárás"><X size={20}/></button></header>
      {loading ? <div className="booking-modal-loading">Foglalási adatok betöltése…</div> : <div className="booking-modal-body">
        <div className="booking-modal-form">
          {error && <div className="booking-error">{error}</div>}
          <div className="booking-section"><div className="booking-section-title"><MapPin size={17}/><div><h3>Hely és munkatárs</h3><p>Hol és kinél történjen a szolgáltatás?</p></div></div><div className="booking-two-columns"><label>Telephely<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Válasszon telephelyet</option>{locations.map((item) => <option key={item.id} value={item.id}>{displayName(item)}</option>)}</select></label><label>Munkatárs<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Válasszon munkatársat</option>{filteredEmployees.map((item) => <option key={item.id} value={item.id}>{displayName(item)}</option>)}</select></label></div></div>
          <div className="booking-section"><div className="booking-section-title booking-client-title"><UserRound size={17}/><div><h3>Vendég</h3><p>Keresés név vagy telefonszám alapján</p></div><button type="button" className="booking-new-client-trigger" onClick={()=>setNewClientOpen((open)=>!open)}><UserPlus size={15}/>{newClientOpen?"Űrlap bezárása":"Új vendég"}</button></div>
            {newClientOpen&&<div className="booking-new-client"><div><b>Új vendég felvétele</b><small>Mentés után automatikusan ez a vendég lesz kiválasztva a foglaláshoz.</small></div><div className="booking-new-client-grid"><label>Teljes név *<input autoFocus value={newClient.name} onChange={e=>setNewClient(v=>({...v,name:e.target.value}))} placeholder="Vendég neve"/></label><label>Telefonszám<input value={newClient.phone} onChange={e=>setNewClient(v=>({...v,phone:e.target.value}))} placeholder="+36..."/></label><label>E-mail<input type="email" value={newClient.email} onChange={e=>setNewClient(v=>({...v,email:e.target.value}))} placeholder="nev@email.hu"/></label><label>Születési dátum<input type="date" value={newClient.birth_date} onChange={e=>setNewClient(v=>({...v,birth_date:e.target.value}))}/></label><label className="booking-new-client-note">Megjegyzés<input value={newClient.notes} onChange={e=>setNewClient(v=>({...v,notes:e.target.value}))} placeholder="Opcionális belső megjegyzés"/></label></div><div className="booking-new-client-actions"><button type="button" onClick={()=>setNewClientOpen(false)} disabled={clientSaving}>Mégse</button><button type="button" className="primary" onClick={()=>void createClient()} disabled={clientSaving}>{clientSaving?"Vendég mentése…":"Vendég mentése és kiválasztása"}</button></div></div>}
            <label className="booking-search"><Search size={16}/><input value={clientQuery} onChange={(event) => setClientQuery(event.target.value)} placeholder="Vendég keresése..."/></label><div className="booking-picker-list">{visibleClients.map((client) => <button type="button" key={client.id} className={clientId === client.id ? "selected" : ""} onClick={() => setClientId(client.id)}><span className="booking-avatar">{displayName(client).charAt(0)}</span><span><b>{displayName(client)}</b><small>{client.phone || client.email || "Nincs elérhetőség"}</small></span>{clientId === client.id && <Check size={17}/>}</button>)}</div><ClientBookingInsights client={selectedClient}/></div>
          <div className="booking-section booking-services-section"><div className="booking-section-title"><Plus size={17}/><div><h3>Szolgáltatások</h3><p>Kategória szerint csoportosítva, több szolgáltatás is hozzáadható.</p></div></div>
            {selectedServices.length > 0 && <div className="selected-services">{selectedServices.map((service, index) => <article key={service.id}><span>{index + 1}</span><div><b>{displayName(service)}</b><small>{serviceGroup(service)} · {serviceDuration(service)} perc · {servicePrice(service).toLocaleString("hu-HU")} Ft</small></div><button onClick={() => removeService(service.id)} aria-label="Szolgáltatás eltávolítása"><Trash2 size={16}/></button></article>)}</div>}
            <div className="service-select-panel">
              <label><span>Kategória</span><select value={serviceCategory} onChange={(e)=>{setServiceCategory(e.target.value);setServiceToAdd("");}}><option value="all">Összes kategória</option>{serviceCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label>
              <label className="service-search-field"><span>Keresés</span><div className="booking-search"><Search size={16}/><input value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Szolgáltatás keresése..."/></div></label>
              <label className="service-main-select"><span>Szolgáltatás</span><select value={serviceToAdd} onChange={(e)=>setServiceToAdd(e.target.value)}><option value="">Válasszon szolgáltatást</option>{groupedServices.map(([group, items])=><optgroup key={group} label={group}>{items.map(service=><option key={service.id} value={service.id}>{displayName(service)} — {serviceDuration(service)} perc — {servicePrice(service).toLocaleString("hu-HU")} Ft</option>)}</optgroup>)}</select></label>
              <button type="button" className="service-add-button" disabled={!serviceToAdd} onClick={()=>{const service=services.find(item=>item.id===serviceToAdd);if(service)addService(service);}}><Plus size={16}/> Hozzáadás</button>
            </div>
            {!selectableServices.length && <div className="service-empty-state">Nincs több választható szolgáltatás a megadott szűrés mellett.</div>}
          </div>
          <div className="booking-section"><div className="booking-section-title"><CalendarDays size={17}/><div><h3>Időzítés</h3><p>A befejezést a szolgáltatások alapján számítjuk</p></div></div><div className="booking-three-columns"><label>Dátum<input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label><label>Kezdés<input type="time" step={900} value={startHM} onChange={(event) => setStartHM(event.target.value)}/></label><label>Befejezés<input type="time" value={endHM} readOnly/></label></div>{checking && <p className="booking-checking">Ütközés ellenőrzése…</p>}{conflicts.length > 0 && <div className="booking-conflict">Ez az időpont foglalt. Válasszon másik kezdési időt.</div>}</div>
          <div className="booking-section"><label>Megjegyzés<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Belső megjegyzés a foglaláshoz..."/></label></div>
        </div>
        <aside className="booking-summary"><span className="booking-summary-eyebrow">Élő összesítés</span><span className="booking-summary-icon"><CalendarDays/></span><h3>Foglalás összesítése</h3><p className="booking-summary-lead">Mentés előtt ellenőrizze a kiválasztott adatokat.</p><dl><div><dt>Vendég</dt><dd>{displayName(selectedClient || { id: "Nincs kiválasztva" })}</dd></div><div><dt>Munkatárs</dt><dd>{displayName(employees.find((employee) => employee.id === employeeId) || { id: "Nincs kiválasztva" })}</dd></div><div><dt>Időpont</dt><dd>{date}<br/>{startHM}–{endHM}</dd></div><div><dt>Szolgáltatások</dt><dd>{selectedServices.length ? `${selectedServices.length} kiválasztva` : "Nincs kiválasztva"}</dd></div></dl><div className="booking-total"><span><Clock3 size={16}/>{totalDuration} perc</span><strong>{totalPrice.toLocaleString("hu-HU")} Ft</strong></div><div className={`booking-availability ${conflicts.length ? "busy" : "free"}`}>{conflicts.length ? <X size={16}/> : <Check size={16}/>} {checking ? "Ellenőrzés…" : conflicts.length ? "Az időpont foglalt" : "Az időpont elérhető"}</div></aside>
      </div>}
      <footer className="booking-modal-footer"><button onClick={onClose}>Mégse</button><button className="booking-save" disabled={!canSubmit} onClick={submit}>{saving ? "Mentés…" : <>Időpont létrehozása <ChevronRight size={17}/></>}</button></footer>
    </section>
  </div>;
}
