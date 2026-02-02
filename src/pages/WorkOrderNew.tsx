// src/pages/WorkOrderNew.tsx
// „Új munkalap” – Kleopátra dizájn, adatbázis alapú munkatárs + szolgáltatás választással

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

type WorkOrderPayload = {
  title: string;
  notes: string;
  status: WorkOrderStatus;
  employee_id?: string | number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  services?: { service_id: string | number; quantity: number }[];
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
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================
  // Adatbetöltés
  // =====================

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        // Ha nálad más az endpoint (pl. /api/locations/:id/employees), itt kell átírni
        const data = await apiFetch<Employee[]>("/api/employees");
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      } catch (err) {
        console.error("Munkatársak betöltési hiba", err);
      }
    };

    loadEmployees();
  }, []);

  const handleEmployeeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const employeeId = e.target.value;
    setSelectedEmployeeId(employeeId);
    setSelectedServiceIds([]);

    if (!employeeId) {
      setServices([]);
      return;
    }

    try {
      // ⬇ Itt szűrünk munkatársra – ha nálad más az endpoint, ezt az URL-t módosítsd
      const data = await apiFetch<Service[]>(
        `/api/services?employee_id=${encodeURIComponent(employeeId)}`
      );
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error("Szolgáltatások betöltési hiba", err);
      setServices([]);
    }
  };

  // =====================
  // Keresés + összegzés
  // =====================

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const selectedServices = useMemo(
    () =>
      services.filter((s) => selectedServiceIds.includes(String(s.id))),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () =>
      selectedServices.reduce((sum, s) => {
        const price = s.price_gross ?? s.price ?? 0;
        return sum + (price || 0);
      }, 0),
    [selectedServices]
  );

  // =====================
  // Mezőkezelők
  // =====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: WorkOrderStatus) => {
    setForm((prev) => ({ ...prev, status }));
  };

  const toggleService = (service: Service) => {
    const id = String(service.id);
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      const next = [...prev, id];

      // Ha még nincs cím, automatikusan az első kiválasztott szolgáltatás nevét használjuk
      if (!form.title.trim()) {
        setForm((old) => ({
          ...old,
          title: service.name,
        }));
      }

      return next;
    });
  };

  // =====================
  // Mentés
  // =====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() && selectedServices.length === 0) {
      setError("Adj meg egy címet vagy válassz legalább egy szolgáltatást.");
      return;
    }

    const payload: WorkOrderPayload = {
      title: form.title.trim() || selectedServices[0]?.name || "Munkalap",
      notes: form.notes,
      status: form.status,
      employee_id: selectedEmployeeId || undefined,
      client_name: form.clientName || undefined,
      client_phone: form.clientPhone || undefined,
      client_email: form.clientEmail || undefined,
      services:
        selectedServiceIds.length > 0
          ? selectedServiceIds.map((id) => ({
              service_id: id,
              quantity: 1,
            }))
          : undefined,
    };

    try {
      setSaving(true);
      setError(null);

      const data = await apiFetch<{ id?: string | number }>(
        "/api/workorders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const newId = data?.id;
      if (newId) {
        navigate(`/workorders/${newId}`);
      } else {
        navigate("/workorders");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Hiba a munkalap mentése során");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/workorders");
  };

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />

      <main className="calendar-container">
        <div className="admin-modal-overlay">
          <div className="admin-modal workorder-modal">
            <form onSubmit={handleSubmit} className="workorder-form">
              <header className="modal-header workorder-modal-header">
                <div className="wo-header-main">
                  <h2 className="wo-title">Új munkalap</h2>
                  <p className="wo-subtitle">
                    Szolgáltatás és fizetés rögzítése az aktuális vendéghez
                  </p>
                </div>

                <div className="wo-status-chips">
                  <button
                    type="button"
                    className={
                      form.status === "waiting"
                        ? "wo-status-chip wo-status-chip--active"
                        : "wo-status-chip"
                    }
                    onClick={() => handleStatusChange("waiting")}
                  >
                    Várakozás az ügyfélre
                  </button>
                  <button
                    type="button"
                    className={
                      form.status === "arrived"
                        ? "wo-status-chip wo-status-chip--active"
                        : "wo-status-chip"
                    }
                    onClick={() => handleStatusChange("arrived")}
                  >
                    Ügyfél megérkezett
                  </button>
                  <button
                    type="button"
                    className={
                      form.status === "no_show"
                        ? "wo-status-chip wo-status-chip--active"
                        : "wo-status-chip"
                    }
                    onClick={() => handleStatusChange("no_show")}
                  >
                    Nem jött el
                  </button>
                  <button
                    type="button"
                    className={
                      form.status === "confirmed"
                        ? "wo-status-chip wo-status-chip--active"
                        : "wo-status-chip"
                    }
                    onClick={() => handleStatusChange("confirmed")}
                  >
                    Megerősítve
                  </button>
                </div>
              </header>

              <div className="modal-body">
                {error && <div className="wo-error">API hiba: {error}</div>}

                <div className="wo-modal-grid">
                  {/* BAL HASÁB – munkalap alapadatok */}
                  <section className="card wo-column">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">MUNKALAP ADATAI</h3>
                      <span className="wo-section-pill">KÖTELEZŐ MEZŐK *</span>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="title">Szolgáltatás / cím *</label>
                      <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        placeholder="Pl. Vágás, szárítás (rövid) TOP"
                      />
                    </div>

                    <div className="wo-two-cols">
                      <div className="wo-field">
                        <label htmlFor="employeeSelect">Munkatárs</label>
                        <select
                          id="employeeSelect"
                          value={selectedEmployeeId}
                          onChange={handleEmployeeChange}
                        >
                          <option value="">Válassz munkatársat</option>
                          {employees.map((e) => (
                            <option key={String(e.id)} value={String(e.id)}>
                              {e.display_name ||
                                e.full_name ||
                                `#${e.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="wo-field">
                        <label>Időtartam</label>
                        <input
                          name="duration"
                          value={
                            selectedServices.length === 1
                              ? `${
                                  selectedServices[0].duration_minutes ??
                                  selectedServices[0].default_duration ??
                                  ""
                                } perc`
                              : selectedServices.length > 1
                              ? "Több szolgáltatás"
                              : ""
                          }
                          readOnly
                          placeholder="Automatikusan számolva"
                        />
                      </div>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="notes">Belső megjegyzés</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleTextAreaChange}
                        rows={4}
                        placeholder="Megjegyzés a szolgáltatásról, különleges kérés, stb."
                      />
                    </div>
                  </section>

                  {/* KÖZÉPSŐ HASÁB – szolgáltatások / termékek */}
                  <section className="card wo-column">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">SZOLGÁLTATÁSOK</h3>
                      <span className="wo-section-pill wo-section-pill--success">
                        {form.fullyPaid ? "TELJESEN KIFIZETVE" : "FIZETÉS FOLYAMATBAN"}
                      </span>
                    </div>

                    <div className="wo-service-tabs">
                      <button
                        type="button"
                        className={
                          activeTab === "services"
                            ? "wo-service-tab wo-service-tab--active"
                            : "wo-service-tab"
                        }
                        onClick={() => setActiveTab("services")}
                      >
                        SZOLGÁLTATÁSOK
                      </button>
                      <button
                        type="button"
                        className={
                          activeTab === "products"
                            ? "wo-service-tab wo-service-tab--active"
                            : "wo-service-tab"
                        }
                        onClick={() => setActiveTab("products")}
                      >
                        TERMÉKEK
                      </button>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="serviceSearch">Keresés</label>
                      <input
                        id="serviceSearch"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder={
                          activeTab === "services"
                            ? "Keresés szolgáltatások szerint"
                            : "Keresés termékek szerint"
                        }
                      />
                    </div>

                    <div className="wo-service-cards">
                      {filteredServices.map((service) => {
                        const id = String(service.id);
                        const isSelected = selectedServiceIds.includes(id);
                        const price = service.price_gross ?? service.price ?? 0;
                        const duration =
                          service.duration_minutes ??
                          service.default_duration ??
                          null;

                        return (
                          <button
                            type="button"
                            key={id}
                            className={
                              isSelected
                                ? "wo-service-card wo-service-card--selected"
                                : "wo-service-card"
                            }
                            onClick={() => toggleService(service)}
                          >
                            <div className="wo-service-main">
                              <div className="wo-service-title">
                                {service.name}
                              </div>
                              <div className="wo-service-meta">
                                <span>
                                  {price
                                    ? `${price.toLocaleString("hu-HU")} Ft`
                                    : "—"}
                                </span>
                                <span>
                                  {duration ? `${duration} perc` : ""}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {filteredServices.length === 0 && (
                        <div className="wo-service-empty">
                          Nincs megjeleníthető szolgáltatás.
                          Válassz munkatársat vagy módosítsd a keresést.
                        </div>
                      )}
                    </div>

                    <div className="wo-totals">
                      <div className="wo-total-row">
                        <span>Összesen</span>
                        <span>{totalPrice.toLocaleString("hu-HU")} Ft</span>
                      </div>
                      <div className="wo-total-row">
                        <span>Kedvezmény</span>
                        <span>0 Ft</span>
                      </div>
                      <div className="wo-total-row wo-total-row--strong">
                        <span>Fizetendő</span>
                        <span>{totalPrice.toLocaleString("hu-HU")} Ft</span>
                      </div>
                    </div>
                  </section>

                  {/* JOBB HASÁB – vendég adatai */}
                  <section className="card wo-column wo-column-right">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">VENDÉG ADATAI</h3>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientName">Név</label>
                      <input
                        id="clientName"
                        name="clientName"
                        value={form.clientName}
                        onChange={handleInputChange}
                        placeholder="Név"
                      />
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientPhone">Telefonszám</label>
                      <input
                        id="clientPhone"
                        name="clientPhone"
                        value={form.clientPhone}
                        onChange={handleInputChange}
                        placeholder="+36 00 000 0000"
                      />
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientEmail">E-mail</label>
                      <input
                        id="clientEmail"
                        name="clientEmail"
                        value={form.clientEmail}
                        onChange={handleInputChange}
                        placeholder="pelda@mail.hu"
                      />
                    </div>

                    <div className="wo-field wo-checkbox-field">
                      <label className="wo-checkbox">
                        <input
                          type="checkbox"
                          name="noteForAnotherVisitor"
                          checked={form.noteForAnotherVisitor}
                          onChange={handleInputChange}
                        />
                        <span>Bejegyzés egy másik látogató számára</span>
                      </label>
                    </div>
                  </section>
                </div>
              </div>

              <footer className="modal-footer workorder-modal-footer">
                <div className="wo-footer-left">
                  <label className="wo-checkbox">
                    <input
                      type="checkbox"
                      name="fullyPaid"
                      checked={form.fullyPaid}
                      onChange={handleInputChange}
                    />
                    <span>Teljesen kifizetve</span>
                  </label>
                </div>
                <div className="wo-footer-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                  >
                    {saving ? "Munkalap mentése..." : "Munkalap mentése"}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkOrderNew;
