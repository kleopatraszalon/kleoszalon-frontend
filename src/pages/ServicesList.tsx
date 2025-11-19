import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import withBase from "../utils/apiBase";
import Modal from "react-modal";
import ServiceNewModal from "../components/ServiceNewModal";

Modal.setAppElement("#root");

type UUID = string;

type Service = {
  id: string | number;
  name: string;
  code?: string | null;
  short_name?: string | null;
  description?: string | null;
  description_short?: string | null;
  description_long?: string | null;
  service_type_id?: UUID | null;
  service_type_name?: string | null;
  parent_service_id?: UUID | null;
  parent_service_name?: string | null;
  base_price?: number | null;
  list_price?: number | null;
  currency?: string | null;
  duration?: number | null;
  duration_minutes?: number | null;
  duration_min?: number | null;
  promo_price?: number | null;
  promo_valid_from?: string | null;
  promo_valid_to?: string | null;
  promo_label?: string | null;
  online_bookable?: boolean | null;
  is_active?: boolean | null;
  is_combo?: boolean | null;
};

type ServiceType = {
  id: UUID | string;
  name: string;
};

type ApiError = { error?: string; message?: string };

const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const safeParse = <T,>(txt: string, fallback: T): T => {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
};

async function parseJson<T>(
  res: Response,
  fallback: T
): Promise<T> {
  const txt = await res.text();
  if (!txt) return fallback;
  return safeParse<T>(txt, fallback);
}

/* =================================================================== */
/*                        SZOLGÁLTATÁSOK LISTA                         */
/* =================================================================== */

const ServicesList: React.FC = () => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTypeId, setFilterTypeId] = useState("");
  const [hierarchy, setHierarchy] = useState<
    "all" | "root" | "child"
  >("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<
    string | null
  >(null);

  /* ---------- Típusok betöltése ---------- */
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(withBase("service-types"), {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data = await parseJson<ServiceType[]>(res, []);
        setServiceTypes(Array.isArray(data) ? data : []);
      } catch {
        // nem kritikus
      }
    };
    run();
  }, []);

  /* ---------- Szolgáltatások betöltése ---------- */
  const loadServices = async () => {
    const token = getToken();

    if (!token) {
      setAuthError(
        "Nincs token – jelentkezz be először a szolgáltatások megtekintéséhez."
      );
      setAllServices([]);
      return;
    }

    const path = includeInactive
      ? "services?include_inactive=1"
      : "services";

    try {
      setLoading(true);
      setAuthError("");

      const res = await fetch(withBase(path), {
        headers: authHeaders(),
      });

      if (res.status === 401 || res.status === 403) {
        setAuthError(
          "Nincs jogosultság vagy lejárt a bejelentkezés."
        );
        setAllServices([]);
        return;
      }

      const data = await parseJson<unknown>(res, []);
      if (!res.ok) {
        throw new Error(
          `HTTP hiba! státusz: ${res.status}`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "Nem tömb érkezett a /services végpontról."
        );
      }

      setAllServices(data as Service[]);
    } catch (e) {
      console.error("Szolgáltatások betöltése hiba:", e);
      setAuthError(
        "Szolgáltatások betöltése nem sikerült. Ellenőrizd a hálózatot vagy a szervert."
      );
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  /* ---------- Szűrés ---------- */
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return allServices.filter((srv) => {
      const name = (srv.name || "").toLowerCase();
      const typeName = (
        srv.service_type_name || ""
      ).toLowerCase();
      const desc = (
        srv.description_short ||
        srv.description_long ||
        srv.description ||
        ""
      ).toLowerCase();

      const price =
        srv.list_price ??
        srv.base_price ??
        0;

      if (
        s &&
        !name.includes(s) &&
        !typeName.includes(s) &&
        !desc.includes(s)
      ) {
        return false;
      }

      if (filterTypeId && srv.service_type_id !== filterTypeId) {
        return false;
      }

      if (hierarchy === "root" && srv.parent_service_id) {
        return false;
      }

      if (hierarchy === "child" && !srv.parent_service_id) {
        return false;
      }

      if (minPrice && price < Number(minPrice)) {
        return false;
      }

      if (maxPrice && price > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [allServices, search, filterTypeId, hierarchy, minPrice, maxPrice]);

  /* ---------- Sor kattintás: szerkesztés ---------- */
  const handleRowClick = (srv: Service) => {
    setEditingServiceId(String(srv.id));
  };

  /* ---------- Render ---------- */
  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar />

      <main className="calendar-container">
        {/* Fejléc */}
        <div className="employees-header">
          <div>
            <h2 className="employees-title">Szolgáltatások</h2>
            <p className="employees-subtitle">
              Szolgáltatások listája, keresés, akciók, átárazás és
              új szolgáltatás felvétel.
            </p>
            {authError && (
              <div className="employees-error">
                {authError}
              </div>
            )}
          </div>

          <div className="employees-header-buttons">
            <button
              type="button"
              className="employees-primary-btn"
              onClick={() => setShowNewModal(true)}
            >
              + Új szolgáltatás
            </button>

            <button
              type="button"
              className={
                "employees-secondary-btn" +
                (includeInactive
                  ? " employees-secondary-btn--active"
                  : "")
              }
              onClick={() =>
                setIncludeInactive((prev) => !prev)
              }
            >
              {includeInactive
                ? "Csak aktív szolgáltatások"
                : "Inaktívak is"}
            </button>
          </div>
        </div>

        {/* Szűrők */}
        <div className="employees-filters">
          <div className="employees-filters-row">
            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Keresés név / típus / leírás
              </label>
              <input
                className="employees-filter-input"
                placeholder="pl. Géllakk, masszázs, hajvágás…"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Szolgáltatás típus
              </label>
              <select
                className="employees-filter-input"
                value={filterTypeId}
                onChange={(e) =>
                  setFilterTypeId(e.target.value)
                }
              >
                <option value="">Összes típus</option>
                {serviceTypes.map((t) => (
                  <option
                    key={String(t.id)}
                    value={String(t.id)}
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Hierarchia
              </label>
              <select
                className="employees-filter-input"
                value={hierarchy}
                onChange={(e) =>
                  setHierarchy(
                    e.target.value as
                      | "all"
                      | "root"
                      | "child"
                  )
                }
              >
                <option value="all">
                  Fő- és alszolgáltatások is
                </option>
                <option value="root">
                  Csak főszolgáltatások
                </option>
                <option value="child">
                  Csak alszolgáltatások
                </option>
              </select>
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Min. ár (Ft)
              </label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Max. ár (Ft)
              </label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-summary">
              {filtered.length} találat
            </div>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="employees-loading">
            Szolgáltatások betöltése…
          </div>
        ) : (
          <div className="employees-list-card">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Név</th>
                  <th>Kód</th>
                  <th>Típus</th>
                  <th>Főszolgáltatás</th>
                  <th>Listaár (Ft)</th>
                  <th>Akciós ár</th>
                  <th>Időtartam</th>
                  <th>Aktív?</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((srv) => {
                  const price =
                    srv.list_price ??
                    srv.base_price ??
                    null;
                  const promo =
                    srv.promo_price ?? null;
                  const duration =
                    srv.duration_minutes ??
                    srv.duration_min ??
                    srv.duration ??
                    null;

                  return (
                    <tr
                      key={String(srv.id)}
                      className="employees-row"
                      onClick={() =>
                        handleRowClick(srv)
                      }
                    >
                      <td>
                        <span className="employees-name-link">
                          {srv.name}
                        </span>
                      </td>
                      <td>{srv.code || "—"}</td>
                      <td>
                        {srv.service_type_name ||
                          "—"}
                      </td>
                      <td>
                        {srv.parent_service_name ||
                          (srv.parent_service_id
                            ? srv.parent_service_id
                            : "—")}
                      </td>
                      <td>
                        {price != null
                          ? `${price.toLocaleString()} Ft`
                          : "—"}
                      </td>
                      <td>
                        {promo != null
                          ? `${promo.toLocaleString()} Ft`
                          : "—"}
                      </td>
                      <td>
                        {duration != null
                          ? `${duration} perc`
                          : "—"}
                      </td>
                      <td>
                        {srv.is_active ? (
                          <span className="employees-badge employees-badge--active">
                            aktív
                          </span>
                        ) : (
                          <span className="employees-badge employees-badge--inactive">
                            inaktív
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="employees-loading"
                    >
                      Nincs találat a megadott
                      szűrőkre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Új szolgáltatás modal */}
        <ServiceNewModal
          isOpen={showNewModal}
          onRequestClose={() =>
            setShowNewModal(false)
          }
          onServiceCreated={(newSrv) => {
            setShowNewModal(false);
            if (newSrv) {
              setAllServices((prev) => [
                newSrv as unknown as Service,
                ...prev,
              ]);
            } else {
              loadServices();
            }
          }}
        />

        {/* Szerkesztő modal */}
        <ServiceEditModal
          isOpen={!!editingServiceId}
          serviceId={editingServiceId}
          onClose={() => setEditingServiceId(null)}
          onSaved={(updated) => {
            setAllServices((prev) =>
              prev.map((s) =>
                String(s.id) ===
                String(updated.id)
                  ? updated
                  : s
              )
            );
            setEditingServiceId(null);
          }}
        />
      </main>
    </div>
  );
};

/* =================================================================== */
/*                        SZOLGÁLTATÁS SZERKESZTŐ                      */
/* =================================================================== */

type ServiceEditModalProps = {
  isOpen: boolean;
  serviceId: string | null;
  onClose: () => void;
  onSaved: (srv: Service) => void;
};

const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  isOpen,
  serviceId,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<Service | null>(null);
  const [serviceTypes, setServiceTypes] = useState<
    ServiceType[]
  >([]);
  const [parentOptions, setParentOptions] = useState<
    { id: UUID | string; name: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isOpen || !serviceId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const headers = authHeaders();

        const [srvRes, typeRes, allSrvRes] =
          await Promise.all([
            fetch(
              withBase(
                `services/${serviceId}`
              ),
              { headers }
            ),
            fetch(withBase("service-types"), {
              headers,
            }),
            fetch(
              withBase(
                "services?include_inactive=1"
              ),
              { headers }
            ),
          ]);

        if (!srvRes.ok) {
          const d =
            await parseJson<ApiError>(
              srvRes,
              {}
            );
          throw new Error(
            d.error ||
              d.message ||
              "Nem sikerült betölteni a szolgáltatást."
          );
        }

        const srv = await parseJson<Service>(
          srvRes,
          {} as Service
        );
        const types =
          (await parseJson<ServiceType[]>(
            typeRes,
            []
          )) || [];
        const allSrv =
          (await parseJson<Service[]>(
            allSrvRes,
            []
          )) || [];

        if (!cancelled) {
          setForm(srv);
          setServiceTypes(Array.isArray(types) ? types : []);
          setParentOptions(
            (allSrv || [])
              .filter(
                (s) =>
                  String(s.id) !==
                  String(serviceId)
              )
              .map((s) => ({
                id: String(s.id),
                name: s.name,
              }))
          );
          setDirty(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(
            e?.message ||
              "Hiba történt a szolgáltatás betöltésekor."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen, serviceId]);

  const onChange = <K extends keyof Service>(
    key: K,
    value: Service[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      setDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const payload: any = {
        ...form,
      };

      const res = await fetch(
        withBase(`services/${form.id}`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await parseJson<
        Service | ApiError
      >(res, {} as any);

      if (!res.ok) {
        throw new Error(
          (data as ApiError)?.error ||
            (data as ApiError)?.message ||
            "Nem sikerült menteni a szolgáltatást."
        );
      }

      const updated = data as Service;
      setForm(updated);
      setDirty(false);
      onSaved(updated);
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Hiba történt mentés közben."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Szolgáltatás szerkesztése"
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 9999,
        },
        content: {
          inset: "40px auto auto",
          maxWidth: "1100px",
          width: "calc(100% - 80px)",
          margin: "0 auto",
          border: "none",
          background: "transparent",
          padding: 0,
          overflow: "visible",
        },
      }}
    >
      <div className="bg-white text-gray-800 border border-gray-200 rounded-xl shadow-xl overflow-visible">
        {/* Felső gombsor */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
          >
            Bezár
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form}
            className={`px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 ${
              saving
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>

        {loading || !form ? (
          <div className="p-4 employees-loading">
            Betöltés…
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Fejléc */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden">
                <span className="text-gray-400 text-xs leading-tight text-center">
                  Szolgáltatás
                </span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {form.name}
                </div>
                <div className="text-xs text-gray-500">
                  {form.service_type_name ||
                    "Szolgáltatás szerkesztése"}
                </div>
              </div>
            </div>

            {/* Alapadatok + hierarchia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="bg-[#faf7f0] border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="text-sm font-semibold">
                  Alapadatok
                </div>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Név
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.name || ""}
                    onChange={(e) =>
                      onChange("name", e.target.value)
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Kód
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.code || ""}
                    onChange={(e) =>
                      onChange("code", e.target.value)
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Rövid név
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.short_name || ""}
                    onChange={(e) =>
                      onChange(
                        "short_name",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Szolgáltatás típus
                  </span>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.service_type_id
                        ? String(
                            form.service_type_id
                          )
                        : ""
                    }
                    onChange={(e) =>
                      onChange(
                        "service_type_id",
                        e.target.value || null
                      )
                    }
                  >
                    <option value="">
                      — nincs típus —
                    </option>
                    {serviceTypes.map((t) => (
                      <option
                        key={String(t.id)}
                        value={String(t.id)}
                      >
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Főszolgáltatás
                  </span>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.parent_service_id
                        ? String(
                            form.parent_service_id
                          )
                        : ""
                    }
                    onChange={(e) =>
                      onChange(
                        "parent_service_id",
                        e.target.value || null
                      )
                    }
                  >
                    <option value="">
                      — ez főszolgáltatás —
                    </option>
                    {parentOptions.map((p) => (
                      <option
                        key={String(p.id)}
                        value={String(p.id)}
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              {/* Ár, idő, akció, flag-ek */}
              <section className="bg-[#faf7f0] border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="text-sm font-semibold">
                  Árazás és idő
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Alap ár (Ft)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.base_price != null
                          ? String(
                              form.base_price
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "base_price",
                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : null
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Listaár (Ft)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.list_price != null
                          ? String(
                              form.list_price
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "list_price",
                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : null
                        )
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Pénznem
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.currency || "HUF"
                      }
                      onChange={(e) =>
                        onChange(
                          "currency",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Időtartam (perc)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.duration_minutes !=
                          null
                          ? String(
                              form.duration_minutes
                            )
                          : form.duration_min !=
                            null
                          ? String(
                              form.duration_min
                            )
                          : form.duration != null
                          ? String(form.duration)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v
                          ? Number(v)
                          : null;
                        onChange(
                          "duration_minutes",
                          num as any
                        );
                      }}
                    />
                  </label>
                </div>

                <div className="text-sm font-semibold mt-3">
                  Akció
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Akciós ár (Ft)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.promo_price != null
                          ? String(
                              form.promo_price
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "promo_price",
                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : null
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Akció neve
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={form.promo_label || ""}
                      onChange={(e) =>
                        onChange(
                          "promo_label",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Akció kezdete (YYYY-MM-DD)
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.promo_valid_from ||
                        ""
                      }
                      onChange={(e) =>
                        onChange(
                          "promo_valid_from",
                          e.target.value || null
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Akció vége (YYYY-MM-DD)
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.promo_valid_to || ""
                      }
                      onChange={(e) =>
                        onChange(
                          "promo_valid_to",
                          e.target.value || null
                        )
                      }
                    />
                  </label>
                </div>

                <div className="text-sm font-semibold mt-3">
                  Egyéb beállítások
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.is_active}
                    onChange={(e) =>
                      onChange(
                        "is_active",
                        e.target.checked
                      )
                    }
                  />
                  Aktív
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.online_bookable}
                    onChange={(e) =>
                      onChange(
                        "online_bookable",
                        e.target.checked
                      )
                    }
                  />
                  Foglalható online
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.is_combo}
                    onChange={(e) =>
                      onChange(
                        "is_combo",
                        e.target.checked
                      )
                    }
                  />
                  Kombinált / csomag
                </label>
              </section>
            </div>

            {/* Leírások */}
            <section className="bg-[#faf7f0] border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">
                Leírások
              </div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Rövid leírás
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={
                    form.description_short ||
                    form.description ||
                    ""
                  }
                  onChange={(e) =>
                    onChange(
                      "description_short",
                      e.target.value
                    )
                  }
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Részletes leírás
                </span>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={
                    form.description_long || ""
                  }
                  onChange={(e) =>
                    onChange(
                      "description_long",
                      e.target.value
                    )
                  }
                />
              </label>
            </section>

            {dirty && (
              <div className="mt-2 text-xs text-amber-700">
                Vannak el nem mentett módosítások.
              </div>
            )}
            {errorMsg && (
              <div className="mt-2 text-xs text-red-600">
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ServicesList;
