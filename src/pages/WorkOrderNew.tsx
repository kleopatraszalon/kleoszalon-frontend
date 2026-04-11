import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";
import { useCurrentUser } from "../hooks/useCurrentUser";

type WorkOrderStatus = "waiting" | "arrived" | "no_show" | "confirmed";

type Employee = {
  id: string | number;
  full_name?: string;
  display_name?: string;
};

type Service = {
  id: string | number;
  name: string;
  duration_minutes?: number | null;
  default_duration?: number | null;
  price?: number | null;
  price_gross?: number | null;
};

type Product = {
  id: string | number;
  name: string;
  price?: number | null;
  price_gross?: number | null;
};

type WorkOrderPayload = {
  title: string;
  notes: string;
  status: WorkOrderStatus;
  employee_id?: string | number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  fully_paid?: boolean;
  note_for_another_visitor?: boolean;
  services?: { service_id: string | number; quantity: number }[];
  products?: { product_id: string | number; quantity: number }[];
};

const WorkOrderNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [form, setForm] = useState({
    title: "",
    notes: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    noteForAnotherVisitor: false,
    fullyPaid: false,
    status: "arrived" as WorkOrderStatus,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await apiFetch<Employee[]>("/api/employees");
        if (Array.isArray(data)) setEmployees(data);
      } catch (err) {
        console.error("Munkatársak betöltési hiba", err);
      }
    };

    const loadProducts = async () => {
      try {
        const data = await apiFetch<Product[]>("/api/products");
        if (Array.isArray(data)) setProducts(data);
      } catch (err) {
        console.error("Termékek betöltési hiba", err);
      }
    };

    loadEmployees();
    loadProducts();
  }, []);

  const handleEmployeeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    setSelectedEmployeeId(employeeId);
    setSelectedServiceIds([]);

    if (!employeeId) {
      setServices([]);
      return;
    }

    try {
      const data = await apiFetch<Service[]>(`/api/services?employee_id=${encodeURIComponent(employeeId)}`);
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Szolgáltatások betöltési hiba", err);
      setServices([]);
    }
  };

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const selectedServices = useMemo(() => services.filter((s) => selectedServiceIds.includes(String(s.id))), [services, selectedServiceIds]);
  const selectedProducts = useMemo(() => products.filter((p) => selectedProductIds.includes(String(p.id))), [products, selectedProductIds]);

  const totalPrice = useMemo(() => {
    const serviceTotal = selectedServices.reduce((sum, s) => sum + Number(s.price_gross ?? s.price ?? 0), 0);
    const productTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price_gross ?? p.price ?? 0), 0);
    return serviceTotal + productTotal;
  }, [selectedServices, selectedProducts]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.duration_minutes ?? s.default_duration ?? 0), 0),
    [selectedServices]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: WorkOrderStatus) => {
    setForm((prev) => ({ ...prev, status }));
  };

  const toggleService = (service: Service) => {
    const id = String(service.id);
    setSelectedServiceIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!form.title.trim() && !prev.includes(id)) {
        setForm((old) => ({ ...old, title: service.name }));
      }
      return next;
    });
  };

  const toggleProduct = (product: Product) => {
    const id = String(product.id);
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() && selectedServices.length === 0 && selectedProducts.length === 0) {
      setError("Adj meg egy címet vagy válassz legalább egy szolgáltatást / terméket.");
      return;
    }

    const payload: WorkOrderPayload = {
      title: form.title.trim() || selectedServices[0]?.name || selectedProducts[0]?.name || "Munkalap",
      notes: form.notes,
      status: form.status,
      employee_id: selectedEmployeeId || undefined,
      client_name: form.clientName || undefined,
      client_phone: form.clientPhone || undefined,
      client_email: form.clientEmail || undefined,
      fully_paid: form.fullyPaid,
      note_for_another_visitor: form.noteForAnotherVisitor,
      services: selectedServiceIds.length > 0 ? selectedServiceIds.map((id) => ({ service_id: id, quantity: 1 })) : undefined,
      products: selectedProductIds.length > 0 ? selectedProductIds.map((id) => ({ product_id: id, quantity: 1 })) : undefined,
    };

    try {
      setSaving(true);
      setError(null);

      const data = await apiFetch<{ id?: string | number }>("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newId = data?.id;
      if (newId) navigate(`/workorders/${newId}`);
      else navigate("/workorders");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Hiba a munkalap mentése során");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />
      <main className="calendar-container">
        <div style={{ padding: 20, background: "#f5f6fa", minHeight: "100vh" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 380px", gap: 18, alignItems: "start" }}>
              <aside style={panelStyle}>
                <div style={panelTitle}>Munkalap</div>
                <div style={smallMuted}>Lépésről lépésre rögzítés</div>

                <div style={{ marginTop: 16 }}>
                  <div style={labelStyle}>Státusz</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      ["waiting", "Ügyfélre várakozás"],
                      ["arrived", "Ügyfél megérkezett"],
                      ["no_show", "Nem jött el"],
                      ["confirmed", "Ügyfél megerősítette"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleStatusChange(value as WorkOrderStatus)}
                        style={form.status === value ? chipActive : chipStyle}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={labelStyle}>Munkatárs</div>
                  <select value={selectedEmployeeId} onChange={handleEmployeeChange} style={inputStyle}>
                    <option value="">Válassz munkatársat</option>
                    {employees.map((e) => (
                      <option key={String(e.id)} value={String(e.id)}>
                        {e.display_name || e.full_name || `#${e.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={labelStyle}>Megjegyzés</div>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleTextAreaChange}
                    rows={6}
                    style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                    placeholder="Belső megjegyzés"
                  />
                </div>

                <div style={{ marginTop: 18 }}>
                  <label style={checkLabel}><input type="checkbox" name="noteForAnotherVisitor" checked={form.noteForAnotherVisitor} onChange={handleInputChange} /> Bejegyzés egy másik látogató számára</label>
                  <label style={checkLabel}><input type="checkbox" name="fullyPaid" checked={form.fullyPaid} onChange={handleInputChange} /> Teljesen kifizetve</label>
                </div>
              </aside>

              <section style={panelStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={panelTitle}>Szolgáltatások és termékek</div>
                    <div style={smallMuted}>A jobb oldali összesítő automatikusan számol</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={activeTab === "services" ? tabActive : tabStyle} onClick={() => setActiveTab("services")}>Szolgáltatások</button>
                    <button type="button" style={activeTab === "products" ? tabActive : tabStyle} onClick={() => setActiveTab("products")}>Termékek</button>
                  </div>
                </div>

                {activeTab === "services" ? (
                  <>
                    <input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Keresés szolgáltatások szerint" style={{ ...inputStyle, marginTop: 14 }} />
                    <div style={cardsGrid}>
                      {filteredServices.map((service) => {
                        const selected = selectedServiceIds.includes(String(service.id));
                        const price = Number(service.price_gross ?? service.price ?? 0);
                        const duration = Number(service.duration_minutes ?? service.default_duration ?? 0);
                        return (
                          <button key={String(service.id)} type="button" onClick={() => toggleService(service)} style={selected ? serviceCardActive : serviceCard}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>{service.name}</div>
                            <div style={smallMuted}>{price.toLocaleString("hu-HU")} Ft</div>
                            <div style={smallMuted}>{duration ? `${duration} perc` : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Keresés termékek szerint" style={{ ...inputStyle, marginTop: 14 }} />
                    <div style={cardsGrid}>
                      {filteredProducts.map((product) => {
                        const selected = selectedProductIds.includes(String(product.id));
                        const price = Number(product.price_gross ?? product.price ?? 0);
                        return (
                          <button key={String(product.id)} type="button" onClick={() => toggleProduct(product)} style={selected ? serviceCardActive : serviceCard}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>{product.name}</div>
                            <div style={smallMuted}>{price.toLocaleString("hu-HU")} Ft</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <aside style={panelStyle}>
                <div style={panelTitle}>Vendég és összesítő</div>

                <div style={{ marginTop: 14 }}>
                  <div style={labelStyle}>Név</div>
                  <input name="clientName" value={form.clientName} onChange={handleInputChange} style={inputStyle} placeholder="Vendég neve" />
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>Telefonszám</div>
                  <input name="clientPhone" value={form.clientPhone} onChange={handleInputChange} style={inputStyle} placeholder="+36..." />
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>E-mail</div>
                  <input name="clientEmail" value={form.clientEmail} onChange={handleInputChange} style={inputStyle} placeholder="vendeg@email.hu" />
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>Munkalap címe</div>
                  <input name="title" value={form.title} onChange={handleInputChange} style={inputStyle} placeholder="Pl. Szemöldök formázás" />
                </div>

                <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Összesítés</div>
                  <div style={sumRow}><span>Kiválasztott szolgáltatás</span><span>{selectedServices.length}</span></div>
                  <div style={sumRow}><span>Kiválasztott termék</span><span>{selectedProducts.length}</span></div>
                  <div style={sumRow}><span>Időtartam</span><span>{totalDuration} perc</span></div>
                  <div style={sumRowStrong}><span>Fizetendő</span><span>{totalPrice.toLocaleString("hu-HU")} Ft</span></div>
                </div>

                {error ? <div style={{ color: "#b91c1c", marginTop: 14 }}>{error}</div> : null}

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="button" onClick={() => navigate("/workorders")} style={secondaryBtn}>Mégse</button>
                  <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Mentés..." : "Munkalap mentése"}</button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};
const panelTitle: React.CSSProperties = { fontSize: 22, fontWeight: 900 };
const smallMuted: React.CSSProperties = { fontSize: 13, color: "#667085" };
const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 10, border: "1px solid #d0d5dd", padding: "0 12px", boxSizing: "border-box", background: "#fff" };
const chipStyle: React.CSSProperties = { border: "1px solid #d0d5dd", background: "#fff", borderRadius: 10, height: 38, textAlign: "left", padding: "0 12px", cursor: "pointer" };
const chipActive: React.CSSProperties = { ...chipStyle, border: "1px solid #111827", background: "#111827", color: "#fff" };
const tabStyle: React.CSSProperties = { border: "1px solid #d0d5dd", background: "#fff", borderRadius: 10, height: 36, padding: "0 12px", cursor: "pointer" };
const tabActive: React.CSSProperties = { ...tabStyle, background: "#f4f3ff", border: "1px solid #c7d2fe", color: "#4338ca", fontWeight: 700 };
const cardsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 14 };
const serviceCard: React.CSSProperties = { textAlign: "left", border: "1px solid #e5e7eb", background: "#fff", borderRadius: 14, padding: 14, cursor: "pointer" };
const serviceCardActive: React.CSSProperties = { ...serviceCard, border: "1px solid #6366f1", background: "#eef2ff" };
const checkLabel: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 10 };
const sumRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", marginTop: 8, color: "#475467" };
const sumRowStrong: React.CSSProperties = { display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 800, fontSize: 18 };
const primaryBtn: React.CSSProperties = { flex: 1, height: 42, border: 0, borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, cursor: "pointer" };
const secondaryBtn: React.CSSProperties = { flex: 1, height: 42, border: "1px solid #d0d5dd", borderRadius: 10, background: "#fff", fontWeight: 700, cursor: "pointer" };

export default WorkOrderNew;
