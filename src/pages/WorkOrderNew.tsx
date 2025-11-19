// src/pages/WorkOrderNew.tsx
// Új „munkalap” felugró modul – Kleopátra dizájn (kleo-theme.css alapján)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";
import { useCurrentUser } from "../hooks/useCurrentUser";

type WorkOrderStatus = "waiting" | "arrived" | "no_show" | "confirmed";

type WorkOrderForm = {
  // Backend által használt mezők
  title: string;
  notes: string;

  // UI mezők – egyelőre csak a felületen élnek
  employeeName: string;
  duration: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  noteForAnotherVisitor: boolean;
  fullyPaid: boolean;
  status: WorkOrderStatus;
};

type WorkOrderPayload = {
  title: string;
  notes: string;
};

const WorkOrderNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [form, setForm] = useState<WorkOrderForm>({
    title: "",
    notes: "",
    employeeName: "",
    duration: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    noteForAnotherVisitor: false,
    fullyPaid: false,
    status: "arrived",
  });

  const [serviceSearch, setServiceSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔧 EGYSÉGES field handler input + textarea + checkbox esetére
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;

    // Ha input + checkbox, akkor a checked-et használjuk, különben value-t
    const newValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleStatusChange = (status: WorkOrderStatus) => {
    setForm((prev) => ({ ...prev, status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("A munkalap címe kötelező");
      return;
    }

    const payload: WorkOrderPayload = {
      title: form.title,
      notes: form.notes,
    };

    try {
      setSaving(true);
      setError(null);

      const data = await apiFetch<{ id?: string } | null>("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (data && data.id) {
        navigate(`/workorders/${data.id}`);
      } else {
        navigate("/workorders");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Hiba a mentés során");
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

      {/* A modal kitakar mindent – a háttér main most csak „tartó” */}
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
                {error && <div className="wo-error">{error}</div>}

                <div className="wo-modal-grid">
                  {/* Bal hasáb – munkalap alapadatok */}
                  <section className="card wo-column">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">Munkalap adatai</h3>
                      <span className="wo-section-pill">Kötelező mezők *</span>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="title">Szolgáltatás / cím *</label>
                      <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleFieldChange}
                        placeholder="Pl. Vágás, szárítás (rövid) TOP"
                      />
                    </div>

                    <div className="wo-two-cols">
                      <div className="wo-field">
                        <label htmlFor="employeeName">Munkatárs</label>
                        <input
                          id="employeeName"
                          name="employeeName"
                          value={form.employeeName}
                          onChange={handleFieldChange}
                          placeholder="Pl. Sülyi Alexandra"
                        />
                      </div>
                      <div className="wo-field">
                        <label htmlFor="duration">Időtartam</label>
                        <input
                          id="duration"
                          name="duration"
                          value={form.duration}
                          onChange={handleFieldChange}
                          placeholder="45 perc"
                        />
                      </div>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="notes">Belső megjegyzés</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleFieldChange}
                        rows={4}
                        placeholder="Megjegyzés a szolgáltatásról, különleges kérés, stb."
                      />
                    </div>
                  </section>

                  {/* Középső hasáb – szolgáltatások / termékek + összegzés */}
                  <section className="card wo-column">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">Szolgáltatások</h3>
                      <span className="wo-section-pill wo-section-pill--success">
                        {form.fullyPaid ? "Teljesen kifizetve" : "Fizetés folyamatban"}
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
                        Szolgáltatások
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
                        Termékek
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
                      <div className="wo-service-card">
                        <div className="wo-service-main">
                          <div className="wo-service-title">
                            Vágás, szárítás (rövid) TOP
                          </div>
                          <div className="wo-service-meta">
                            <span>7690 Ft</span>
                            <span>45 perc</span>
                          </div>
                        </div>
                      </div>

                      <div className="wo-service-card">
                        <div className="wo-service-main">
                          <div className="wo-service-title">
                            Férfi mosás, vágás TOP
                          </div>
                          <div className="wo-service-meta">
                            <span>5290 Ft</span>
                            <span>30 perc</span>
                          </div>
                        </div>
                      </div>

                      <div className="wo-service-card">
                        <div className="wo-service-main">
                          <div className="wo-service-title">
                            Keratin Botx hajkezelés (szárítással)
                          </div>
                          <div className="wo-service-meta">
                            <span>7990 Ft</span>
                            <span>20 perc</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="wo-totals">
                      <div className="wo-total-row">
                        <span>Összesen</span>
                        <span>0 Ft</span>
                      </div>
                      <div className="wo-total-row">
                        <span>Kedvezmény</span>
                        <span>0 Ft</span>
                      </div>
                      <div className="wo-total-row wo-total-row--strong">
                        <span>Fizetendő</span>
                        <span>0 Ft</span>
                      </div>
                    </div>
                  </section>

                  {/* Jobb hasáb – vendég adatai */}
                  <section className="card wo-column wo-column-right">
                    <div className="wo-section-header">
                      <h3 className="wo-section-title">Vendég adatai</h3>
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientName">Név</label>
                      <input
                        id="clientName"
                        name="clientName"
                        value={form.clientName}
                        onChange={handleFieldChange}
                        placeholder="John"
                      />
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientPhone">Telefonszám</label>
                      <input
                        id="clientPhone"
                        name="clientPhone"
                        value={form.clientPhone}
                        onChange={handleFieldChange}
                        placeholder="+36 00 000 0000"
                      />
                    </div>

                    <div className="wo-field">
                      <label htmlFor="clientEmail">E-mail</label>
                      <input
                        id="clientEmail"
                        name="clientEmail"
                        value={form.clientEmail}
                        onChange={handleFieldChange}
                        placeholder="pelda@mail.hu"
                      />
                    </div>

                    <div className="wo-field wo-checkbox-field">
                      <label className="wo-checkbox">
                        <input
                          type="checkbox"
                          name="noteForAnotherVisitor"
                          checked={form.noteForAnotherVisitor}
                          onChange={handleFieldChange}
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
                      onChange={handleFieldChange}
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
                    {saving ? "Mentés..." : "Munkalap mentése"}
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
