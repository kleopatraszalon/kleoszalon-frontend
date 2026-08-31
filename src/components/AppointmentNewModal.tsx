import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { fetchArray, fetchJSON, apiFetch } from "../utils/fetch";
import ClientBookingInsights from "./booking/ClientBookingInsights";
import "./AppointmentNewModal.css";
import "./ModernAppointmentNewModal.css";
import "./AppointmentNewClient.css";

type PickerItem = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  color?: string | null;
  location_id?: string | null;
  duration_minutes?: number | string | null;
  base_price?: number | string | null;
  list_price?: number | string | null;
  promo_price?: number | string | null;
  price?: number | string | null;
  retail_price_gross?: number | string | null;
  available_stock?: number | string | null;
  stock_quantity?: number | string | null;
  unit?: string | null;
  service_type_name?: string | null;
  category_name?: string | null;
  category?: string | null;
  product_group_name?: string | null;
  product_category_name?: string | null;
  brand?: string | null;
  line_name?: string | null;
  vip?: boolean | null;
  is_vip?: boolean | null;
  vip_status?: string | null;
  loyalty_points?: number | string | null;
  points?: number | string | null;
  visit_count?: number | string | null;
  appointments_count?: number | string | null;
  last_visit_at?: string | null;
  last_appointment_at?: string | null;
  favorite_service_name?: string | null;
  favourite_service_name?: string | null;
  allergies?: string | string[] | null;
  allergy_notes?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  marketing_consent?: boolean | null;
};

type ProductLine = { productId: string; quantity: number };
type Props = {
  onSaved: () => void;
  onClose: () => void;
  initialEmployeeId?: string;
  initialDate?: string;
  initialStartMinutes?: number;
  initialDurationMinutes?: number;
};

const pad2 = (value: number) => String(value).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const minutesToHM = (value: number) => `${pad2(Math.floor(value / 60) % 24)}:${pad2(value % 60)}`;
const hmToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const addMinutesHM = (value: string, duration: number) => minutesToHM(hmToMinutes(value) + duration);
const displayName = (item: PickerItem) => item.full_name || item.name || item.title || item.id;
const serviceDuration = (item: PickerItem) => Math.max(Number(item.duration_minutes || 30), 5);
const servicePrice = (item: PickerItem) => Number(item.promo_price ?? item.list_price ?? item.base_price ?? item.price ?? 0);
const serviceGroup = (item: PickerItem) => item.service_type_name || item.category_name || item.category || "Egyéb szolgáltatások";
const productPrice = (item: PickerItem) => Number(item.price ?? item.retail_price_gross ?? 0);
const productStock = (item: PickerItem) => {
  const value = item.available_stock ?? item.stock_quantity;
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const productGroup = (item: PickerItem) => item.product_group_name || item.product_category_name || item.brand || "Egyéb termékek";
const combineISO = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();
const norm = (value: unknown) => String(value || "").trim().toLocaleLowerCase("hu-HU");

export function AppointmentNewModal({
  onSaved,
  onClose,
  initialEmployeeId,
  initialDate,
  initialStartMinutes,
  initialDurationMinutes = 30,
}: Props) {
  const initialTime = initialStartMinutes == null
    ? minutesToHM(Math.ceil((new Date().getHours() * 60 + new Date().getMinutes()) / 15) * 15)
    : minutesToHM(initialStartMinutes);

  const [locations, setLocations] = useState<PickerItem[]>([]);
  const [employees, setEmployees] = useState<PickerItem[]>([]);
  const [clients, setClients] = useState<PickerItem[]>([]);
  const [services, setServices] = useState<PickerItem[]>([]);
  const [products, setProducts] = useState<PickerItem[]>([]);
  const [locationId, setLocationId] = useState("");
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || "");
  const [clientId, setClientId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [date, setDate] = useState(initialDate || todayISO());
  const [startHM, setStartHM] = useState(initialTime);
  const [note, setNote] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "", birth_date: "", notes: "" });
  const [clientSaving, setClientSaving] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [serviceToAdd, setServiceToAdd] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productToAdd, setProductToAdd] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchArray<PickerItem>("/api/locations"),
      fetchArray<PickerItem>("/api/employees"),
      fetchArray<PickerItem>("/api/clients"),
      fetchArray<PickerItem>("/api/services"),
    ])
      .then(([locs, emps, cls, svs]) => {
        if (!active) return;
        setLocations(locs);
        setEmployees(emps);
        setClients(cls);
        setServices(svs);
        setLocationId((current) => current || locs[0]?.id || "");
        setEmployeeId((current) => current || emps[0]?.id || "");
      })
      .catch(() => setError("A foglaláshoz szükséges adatok betöltése sikertelen."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!locationId) {
      setProducts([]);
      setProductLines([]);
      return () => { active = false; };
    }
    setProductsLoading(true);
    fetchArray<PickerItem>(`/api/appointments/products?location_id=${encodeURIComponent(locationId)}`)
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [locationId]);

  const selectedServices = useMemo(
    () => selectedServiceIds.map((id) => services.find((service) => service.id === id)).filter(Boolean) as PickerItem[],
    [selectedServiceIds, services],
  );
  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId) || null, [clients, clientId]);
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, service) => sum + serviceDuration(service), 0) || initialDurationMinutes,
    [selectedServices, initialDurationMinutes],
  );
  const serviceTotal = useMemo(() => selectedServices.reduce((sum, service) => sum + servicePrice(service), 0), [selectedServices]);
  const productTotal = useMemo(() => productLines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    return sum + (product ? productPrice(product) * line.quantity : 0);
  }, 0), [productLines, products]);
  const totalPrice = serviceTotal + productTotal;
  const endHM = useMemo(() => addMinutesHM(startHM, totalDuration), [startHM, totalDuration]);

  const visibleClients = useMemo(() => {
    const query = norm(clientQuery);
    if (!query) return [];
    return clients
      .filter((client) => norm(`${displayName(client)} ${client.phone || ""} ${client.email || ""}`).includes(query))
      .slice(0, 8);
  }, [clients, clientQuery]);

  const serviceCategories = useMemo(
    () => Array.from(new Set(services.map(serviceGroup))).sort((a, b) => a.localeCompare(b, "hu")),
    [services],
  );
  const selectableServices = useMemo(() => services
    .filter((service) => !selectedServiceIds.includes(service.id))
    .filter((service) => serviceCategory === "all" || serviceGroup(service) === serviceCategory)
    .filter((service) => norm(`${displayName(service)} ${serviceGroup(service)}`).includes(norm(serviceQuery)))
    .sort((a, b) => serviceGroup(a).localeCompare(serviceGroup(b), "hu") || displayName(a).localeCompare(displayName(b), "hu")),
  [services, selectedServiceIds, serviceCategory, serviceQuery]);
  const groupedServices = useMemo(() => {
    const groups = new Map<string, PickerItem[]>();
    selectableServices.forEach((service) => {
      const group = serviceGroup(service);
      groups.set(group, [...(groups.get(group) || []), service]);
    });
    return [...groups.entries()];
  }, [selectableServices]);

  const selectableProducts = useMemo(() => products
    .filter((product) => !productLines.some((line) => line.productId === product.id))
    .filter((product) => norm(`${displayName(product)} ${product.brand || ""} ${product.line_name || ""} ${productGroup(product)}`).includes(norm(productQuery)))
    .sort((a, b) => productGroup(a).localeCompare(productGroup(b), "hu") || displayName(a).localeCompare(displayName(b), "hu")),
  [products, productLines, productQuery]);

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => !locationId || !employee.location_id || employee.location_id === locationId),
    [employees, locationId],
  );

  const checkConflicts = useCallback(async () => {
    if (!employeeId || !locationId || !date || !startHM) return;
    setChecking(true);
    try {
      const query = new URLSearchParams({
        employee_id: employeeId,
        location_id: locationId,
        start: combineISO(date, startHM),
        end: combineISO(date, endHM),
      });
      const result = await fetchJSON<any>(`/api/appointments/conflicts?${query}`, undefined, []);
      setConflicts(Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []);
    } catch {
      setConflicts([]);
    } finally {
      setChecking(false);
    }
  }, [employeeId, locationId, date, startHM, endHM]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkConflicts(), 350);
    return () => window.clearTimeout(timer);
  }, [checkConflicts]);

  const chooseClient = (client: PickerItem) => {
    setClientId(client.id);
    setClientQuery(displayName(client));
    setClientDropdownOpen(false);
    setError(null);
  };

  const handleClientQueryChange = (value: string) => {
    setClientQuery(value);
    if (clientId) {
      const selected = clients.find((client) => client.id === clientId);
      if (!selected || value !== displayName(selected)) setClientId("");
    }
    setClientDropdownOpen(Boolean(value.trim()));
  };

  const addService = (service: PickerItem) => {
    setSelectedServiceIds((current) => [...current, service.id]);
    setServiceToAdd("");
    setError(null);
  };
  const removeService = (id: string) => setSelectedServiceIds((current) => current.filter((serviceId) => serviceId !== id));

  const addProduct = () => {
    const product = products.find((item) => item.id === productToAdd);
    const quantity = Math.max(1, Number(productQuantity || 1));
    if (!product) return;
    const stock = productStock(product);
    if (stock !== null && stock < quantity) {
      setError(`Nincs elegendő készlet: ${displayName(product)}. Elérhető: ${stock.toLocaleString("hu-HU")} ${product.unit || "db"}.`);
      return;
    }
    setProductLines((current) => [...current, { productId: product.id, quantity }]);
    setProductToAdd("");
    setProductQuantity(1);
    setError(null);
  };

  const changeProductQuantity = (productId: string, raw: number) => {
    const product = products.find((item) => item.id === productId);
    const stock = product ? productStock(product) : null;
    let quantity = Math.max(1, Number.isFinite(raw) ? raw : 1);
    if (stock !== null) quantity = Math.min(quantity, Math.max(1, stock));
    setProductLines((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line));
  };
  const removeProduct = (productId: string) => setProductLines((current) => current.filter((line) => line.productId !== productId));

  const createClient = async () => {
    const name = newClient.name.trim();
    const phone = newClient.phone.trim();
    const email = newClient.email.trim();
    if (!name) { setError("Az új vendég neve kötelező."); return; }
    if (!phone && !email) { setError("Az új vendéghez telefonszám vagy e-mail-cím szükséges."); return; }
    if (!locationId) { setError("Az új vendég felvétele előtt válasszon telephelyet."); return; }
    setClientSaving(true);
    setError(null);
    try {
      const result = await fetchJSON<{ id: string }>("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newClient,
          name,
          full_name: name,
          phone: phone || null,
          email: email || null,
          birth_date: newClient.birth_date || null,
          location_id: locationId,
          source: "appointment",
        }),
      });
      const created: PickerItem = {
        id: String(result.id), name, full_name: name, phone: phone || null, email: email || null, location_id: locationId,
      };
      setClients((current) => [created, ...current.filter((client) => client.id !== created.id)]);
      chooseClient(created);
      setNewClientOpen(false);
      setNewClient({ name: "", phone: "", email: "", birth_date: "", notes: "" });
    } catch (reason: any) {
      setError(reason?.message || "Az új vendég létrehozása sikertelen.");
    } finally {
      setClientSaving(false);
    }
  };

  const canSubmit = Boolean(
    locationId && employeeId && clientId && selectedServiceIds.length && date && startHM && !conflicts.length && !checking && !saving,
  );

  const submit = async () => {
    if (!canSubmit) {
      setError(conflicts.length
        ? "A kiválasztott munkatársnak ekkor már van foglalása."
        : "Töltse ki a kötelező mezőket és adjon hozzá legalább egy szolgáltatást.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: locationId,
          employee_id: employeeId,
          client_id: clientId,
          start_time: combineISO(date, startHM),
          end_time: combineISO(date, endHM),
          notes: note,
          services: selectedServices.map((service) => ({ service_id: service.id })),
          products: productLines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
        }),
      });
      onSaved();
    } catch (reason: any) {
      setError(reason?.message || "Az időpont mentése sikertelen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="booking-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
        <header className="booking-modal-header">
          <div className="booking-modal-title-group">
            <i><CalendarDays size={20} /></i>
            <div>
              <span>Új foglalás</span>
              <h2 id="booking-modal-title">Időpont létrehozása</h2>
              <p>Munkalap-szerű rögzítés: vendég, szolgáltatás, termék és időzítés egy helyen.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Bezárás"><X size={20} /></button>
        </header>

        {loading ? <div className="booking-modal-loading">Foglalási adatok betöltése…</div> : (
          <div className="booking-modal-body">
            <div className="booking-modal-form">
              {error && <div className="booking-error">{error}</div>}

              <div className="booking-section">
                <div className="booking-section-title"><MapPin size={17} /><div><h3>Hely és munkatárs</h3><p>Hol és kinél történjen a szolgáltatás?</p></div></div>
                <div className="booking-two-columns">
                  <label>Telephely
                    <select value={locationId} onChange={(event) => { setLocationId(event.target.value); setProductLines([]); setProductToAdd(""); }}>
                      <option value="">Válasszon telephelyet</option>
                      {locations.map((item) => <option key={item.id} value={item.id}>{displayName(item)}</option>)}
                    </select>
                  </label>
                  <label>Munkatárs
                    <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
                      <option value="">Válasszon munkatársat</option>
                      {filteredEmployees.map((item) => <option key={item.id} value={item.id}>{displayName(item)}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="booking-section booking-client-section">
                <div className="booking-section-title booking-client-title">
                  <UserRound size={17} />
                  <div><h3>Vendég</h3><p>Az első karaktertől szűr névre, telefonszámra és e-mailre.</p></div>
                  <button type="button" className="booking-new-client-trigger" onClick={() => setNewClientOpen((open) => !open)}>
                    <UserPlus size={15} />{newClientOpen ? "Űrlap bezárása" : "Új vendég"}
                  </button>
                </div>

                {newClientOpen && (
                  <div className="booking-new-client">
                    <div><b>Új vendég felvétele</b><small>Mentés után automatikusan ez a vendég lesz kiválasztva a foglaláshoz.</small></div>
                    <div className="booking-new-client-grid">
                      <label>Teljes név *<input autoFocus value={newClient.name} onChange={(e) => setNewClient((v) => ({ ...v, name: e.target.value }))} placeholder="Vendég neve" /></label>
                      <label>Telefonszám<input value={newClient.phone} onChange={(e) => setNewClient((v) => ({ ...v, phone: e.target.value }))} placeholder="+36..." /></label>
                      <label>E-mail<input type="email" value={newClient.email} onChange={(e) => setNewClient((v) => ({ ...v, email: e.target.value }))} placeholder="nev@email.hu" /></label>
                      <label>Születési dátum<input type="date" value={newClient.birth_date} onChange={(e) => setNewClient((v) => ({ ...v, birth_date: e.target.value }))} /></label>
                      <label className="booking-new-client-note">Megjegyzés<input value={newClient.notes} onChange={(e) => setNewClient((v) => ({ ...v, notes: e.target.value }))} placeholder="Opcionális belső megjegyzés" /></label>
                    </div>
                    <div className="booking-new-client-actions">
                      <button type="button" onClick={() => setNewClientOpen(false)} disabled={clientSaving}>Mégse</button>
                      <button type="button" className="primary" onClick={() => void createClient()} disabled={clientSaving}>{clientSaving ? "Vendég mentése…" : "Vendég mentése és kiválasztása"}</button>
                    </div>
                  </div>
                )}

                <div className="booking-client-combobox">
                  <label className="booking-search">
                    <Search size={16} />
                    <input
                      value={clientQuery}
                      onChange={(event) => handleClientQueryChange(event.target.value)}
                      onFocus={() => setClientDropdownOpen(Boolean(clientQuery.trim()))}
                      onBlur={() => window.setTimeout(() => setClientDropdownOpen(false), 120)}
                      placeholder="Kezdje el beírni a vendég nevét, telefonját vagy e-mailjét..."
                      role="combobox"
                      aria-autocomplete="list"
                      aria-controls="booking-client-options"
                      aria-expanded={clientDropdownOpen}
                    />
                  </label>
                  {clientDropdownOpen && clientQuery.trim() && (
                    <div id="booking-client-options" className="booking-client-dropdown" role="listbox">
                      {visibleClients.length ? visibleClients.map((client) => (
                        <button
                          type="button"
                          key={client.id}
                          role="option"
                          aria-selected={clientId === client.id}
                          className={clientId === client.id ? "selected" : ""}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseClient(client)}
                        >
                          <span className="booking-avatar">{displayName(client).charAt(0)}</span>
                          <span><b>{displayName(client)}</b><small>{[client.phone, client.email].filter(Boolean).join(" · ") || "Nincs elérhetőség"}</small></span>
                          {clientId === client.id && <Check size={17} />}
                        </button>
                      )) : <div className="booking-client-empty">Nincs találat erre a keresésre.</div>}
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <div className="booking-selected-client">
                    <span className="booking-avatar">{displayName(selectedClient).charAt(0)}</span>
                    <div><small>Kiválasztott vendég</small><b>{displayName(selectedClient)}</b><span>{[selectedClient.phone, selectedClient.email].filter(Boolean).join(" · ")}</span></div>
                    <button type="button" onClick={() => { setClientId(""); setClientQuery(""); setClientDropdownOpen(false); }} aria-label="Vendég kiválasztás törlése"><X size={16} /></button>
                  </div>
                )}
                <ClientBookingInsights client={selectedClient} />
              </div>

              <div className="booking-section booking-items-section">
                <div className="booking-section-title"><ShoppingBag size={17} /><div><h3>Szolgáltatás és termék</h3><p>A munkalaphoz hasonlóan egy foglaláshoz több szolgáltatás és termék is felvihető.</p></div></div>

                <div className="booking-item-block">
                  <div className="booking-item-block-title"><span><Plus size={16} /> Szolgáltatások</span><b>{selectedServices.length} tétel</b></div>
                  {selectedServices.length > 0 && (
                    <div className="selected-services">
                      {selectedServices.map((service, index) => (
                        <article key={service.id}>
                          <span>{index + 1}</span>
                          <div><b>{displayName(service)}</b><small>{serviceGroup(service)} · {serviceDuration(service)} perc · {servicePrice(service).toLocaleString("hu-HU")} Ft</small></div>
                          <button type="button" onClick={() => removeService(service.id)} aria-label="Szolgáltatás eltávolítása"><Trash2 size={16} /></button>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="service-select-panel">
                    <label><span>Kategória</span><select value={serviceCategory} onChange={(e) => { setServiceCategory(e.target.value); setServiceToAdd(""); }}><option value="all">Összes kategória</option>{serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                    <label className="service-search-field"><span>Keresés</span><div className="booking-search"><Search size={16} /><input value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Szolgáltatás keresése..." /></div></label>
                    <label className="service-main-select"><span>Szolgáltatás</span><select value={serviceToAdd} onChange={(e) => setServiceToAdd(e.target.value)}><option value="">Válasszon szolgáltatást</option>{groupedServices.map(([group, items]) => <optgroup key={group} label={group}>{items.map((service) => <option key={service.id} value={service.id}>{displayName(service)} — {serviceDuration(service)} perc — {servicePrice(service).toLocaleString("hu-HU")} Ft</option>)}</optgroup>)}</select></label>
                    <button type="button" className="service-add-button" disabled={!serviceToAdd} onClick={() => { const service = services.find((item) => item.id === serviceToAdd); if (service) addService(service); }}><Plus size={16} /> Hozzáadás</button>
                  </div>
                </div>

                <div className="booking-item-block booking-product-block">
                  <div className="booking-item-block-title"><span><Package size={16} /> Termékek</span><b>{productLines.length} tétel</b></div>
                  {productLines.length > 0 && (
                    <div className="selected-products">
                      {productLines.map((line) => {
                        const product = products.find((item) => item.id === line.productId);
                        if (!product) return null;
                        const stock = productStock(product);
                        return (
                          <article key={line.productId}>
                            <span className="product-icon"><Package size={15} /></span>
                            <div><b>{displayName(product)}</b><small>{productGroup(product)} · {productPrice(product).toLocaleString("hu-HU")} Ft/{product.unit || "db"}{stock !== null ? ` · készlet: ${stock.toLocaleString("hu-HU")} ${product.unit || "db"}` : ""}</small></div>
                            <label className="product-qty">Menny.<input type="number" min={1} max={stock ?? undefined} step="1" value={line.quantity} onChange={(event) => changeProductQuantity(line.productId, Number(event.target.value))} /></label>
                            <strong>{(productPrice(product) * line.quantity).toLocaleString("hu-HU")} Ft</strong>
                            <button type="button" onClick={() => removeProduct(line.productId)} aria-label="Termék eltávolítása"><Trash2 size={16} /></button>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <div className="product-select-panel">
                    <label className="product-search-field"><span>Keresés</span><div className="booking-search"><Search size={16} /><input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Termék, márka vagy kategória..." /></div></label>
                    <label className="product-main-select"><span>Termék</span><select value={productToAdd} onChange={(event) => setProductToAdd(event.target.value)} disabled={productsLoading}><option value="">{productsLoading ? "Termékek betöltése…" : "Válasszon terméket"}</option>{selectableProducts.map((product) => { const stock = productStock(product); return <option key={product.id} value={product.id} disabled={stock !== null && stock <= 0}>{displayName(product)} — {productPrice(product).toLocaleString("hu-HU")} Ft{stock !== null ? ` — készlet: ${stock.toLocaleString("hu-HU")}` : ""}</option>; })}</select></label>
                    <label className="product-quantity-field"><span>Mennyiség</span><input type="number" min={1} step="1" value={productQuantity} onChange={(event) => setProductQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
                    <button type="button" className="product-add-button" disabled={!productToAdd || productsLoading} onClick={addProduct}><Plus size={16} /> Hozzáadás</button>
                  </div>
                  {!productsLoading && !selectableProducts.length && !productLines.length && <div className="service-empty-state">Nincs választható termék a megadott szűrés mellett.</div>}
                </div>
              </div>

              <div className="booking-section">
                <div className="booking-section-title"><CalendarDays size={17} /><div><h3>Időzítés</h3><p>A befejezést a szolgáltatások alapján számítjuk.</p></div></div>
                <div className="booking-three-columns">
                  <label>Dátum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                  <label>Kezdés<input type="time" step={900} value={startHM} onChange={(event) => setStartHM(event.target.value)} /></label>
                  <label>Befejezés<input type="time" value={endHM} readOnly /></label>
                </div>
                {checking && <p className="booking-checking">Ütközés ellenőrzése…</p>}
                {conflicts.length > 0 && <div className="booking-conflict">Ez az időpont foglalt. Válasszon másik kezdési időt.</div>}
              </div>

              <div className="booking-section"><label>Megjegyzés<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Belső megjegyzés a foglaláshoz..." /></label></div>
            </div>

            <aside className="booking-summary">
              <span className="booking-summary-eyebrow">Élő összesítés</span>
              <span className="booking-summary-icon"><CalendarDays /></span>
              <h3>Foglalás összesítése</h3>
              <p className="booking-summary-lead">Mentés előtt ellenőrizze a kiválasztott adatokat.</p>
              <dl>
                <div><dt>Vendég</dt><dd>{displayName(selectedClient || { id: "Nincs kiválasztva" })}</dd></div>
                <div><dt>Munkatárs</dt><dd>{displayName(employees.find((employee) => employee.id === employeeId) || { id: "Nincs kiválasztva" })}</dd></div>
                <div><dt>Időpont</dt><dd>{date}<br />{startHM}–{endHM}</dd></div>
                <div><dt>Szolgáltatások</dt><dd>{selectedServices.length ? `${selectedServices.length} kiválasztva · ${serviceTotal.toLocaleString("hu-HU")} Ft` : "Nincs kiválasztva"}</dd></div>
                <div><dt>Termékek</dt><dd>{productLines.length ? `${productLines.length} tétel · ${productTotal.toLocaleString("hu-HU")} Ft` : "Nincs termék"}</dd></div>
              </dl>
              <div className="booking-total"><span><Clock3 size={16} />{totalDuration} perc</span><strong>{totalPrice.toLocaleString("hu-HU")} Ft</strong></div>
              <div className={`booking-availability ${conflicts.length ? "busy" : "free"}`}>{conflicts.length ? <X size={16} /> : <Check size={16} />} {checking ? "Ellenőrzés…" : conflicts.length ? "Az időpont foglalt" : "Az időpont elérhető"}</div>
            </aside>
          </div>
        )}

        <footer className="booking-modal-footer">
          <button onClick={onClose}>Mégse</button>
          <button className="booking-save" disabled={!canSubmit} onClick={submit}>{saving ? "Mentés…" : <>Időpont létrehozása <ChevronRight size={17} /></>}</button>
        </footer>
      </section>
    </div>
  );
}
