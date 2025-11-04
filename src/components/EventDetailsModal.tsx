import React, { useEffect, useState } from "react";
import Modal from "react-modal";

interface EmployeeData {
  id: string;
  full_name?: string;
  name?: string; // fallback
  position_name?: string;
  location_name?: string;
  active?: boolean;
  login_name?: string;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;

  event?: {
    title?: string;
    start?: string | Date;
    end?: string | Date;
  };

  employee?: EmployeeData;

  onEmployeeStatusChanged?: (updated: { id: string; active: boolean }) => void;

  onEmployeeCredentialsChanged?: (updated: {
    id: string;
    login_name: string;
  }) => void;
}

// Egy szolgáltatás, ahogy a DB-ből jön
interface ServiceRow {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  duration_minutes?: number | null;
  category_id?: number | null;
  is_active?: boolean | null;
}

type TabKey = "alap" | "szolg" | "login";

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onRequestClose,
  event,
  employee,
  onEmployeeStatusChanged,
  onEmployeeCredentialsChanged,
}) => {
  // !!! egyszer globálisan: Modal.setAppElement("#root")

  const token =
    localStorage.getItem("token") || localStorage.getItem("kleo_token");

  // ---------- Tabs ----------
  const [activeTab, setActiveTab] = useState<TabKey>("alap");

  // ---------- Állapot: aktív/inaktív ----------
  const [localActive, setLocalActive] = useState<boolean>(
    employee?.active ?? false
  );
  const [updatingActive, setUpdatingActive] = useState(false);
  const [statusError, setStatusError] = useState("");

  // ---------- Állapot: belépés / jelszó ----------
  const [loginName, setLoginName] = useState(employee?.login_name || "");
  const [plainPassword, setPlainPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsError, setCredsError] = useState("");
  const [credsSuccess, setCredsSuccess] = useState("");

  // ---------- Szolgáltatások fül állapot ----------
  // teljes szolgáltatáslista a rendszerből
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesErr, setServicesErr] = useState("");

  // dolgozóhoz rendelt szolgáltatások lokális pipálása/idő állítása
  // ez egy ideiglenes kapcsolat itt frontenden.
  // kulcs: service_id -> { checked, custom_minutes }
  const [employeeServices, setEmployeeServices] = useState<
    Record<
      string,
      {
        checked: boolean;
        custom_minutes: string; // szöveg, hogy inputból tudd kezelni
      }
    >
  >({});

  // amikor új employee nyílik meg a modalban
  useEffect(() => {
    setLocalActive(employee?.active ?? false);
    setLoginName(employee?.login_name || "");
    setPlainPassword("");
    setShowPassword(false);
    setStatusError("");
    setCredsError("");
    setCredsSuccess("");
    setActiveTab("alap");

    // ha később majd backend adja vissza, hogy ez a dolgozó milyen szolgáltatásokat végezhet
    // akkor itt be tudod inicializálni employeeServices-t.
    setEmployeeServices({});
  }, [employee]);

  // szolgáltatáslista betöltése, ha megnyitjuk a modált VAGY átváltunk a "szolg" fülre
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab !== "szolg") return;

    // ha már be van töltve és nincs hiba, nem kell újra minden tabváltáskor
    if (services.length > 0 && !servicesErr) return;

    const loadServices = async () => {
      if (!token) {
        setServicesErr("Nincs jogosultság (nincs token).");
        return;
      }
      setServicesLoading(true);
      setServicesErr("");

      try {
        // ezt igazítsd a backend endpointodra
        // pl. GET /api/services/available ami a services táblából ad aktív tételeket
        const res = await fetch(
          "http://localhost:5000/api/services/available",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Szolgáltatások betöltése hiba:", data);
          setServicesErr(
            data?.error ||
              "Nem sikerült lekérni a szolgáltatásokat a szerverről."
          );
          setServicesLoading(false);
          return;
        }

        if (!Array.isArray(data)) {
          console.error("Nem tömb érkezett services-re:", data);
          setServicesErr("Váratlan szerverválasz (nem lista).");
          setServicesLoading(false);
          return;
        }

        // Feltételezve, hogy data elemei legalább: { id, name, price, duration_minutes || duration }
        setServices(data);

        // ha akarod, itt lehetne employeeServices-t feltölteni default állapotokkal
        // például ha a dolgozó minden szolgáltatást vállal  alapból:
        const initMap: Record<
          string,
          { checked: boolean; custom_minutes: string }
        > = {};
        data.forEach((srv: any) => {
          const mins =
            srv.duration_minutes ??
            srv.duration ??
            "" /* fallback üres, admin majd kitölti */;
          initMap[srv.id] = {
            checked: false,
            custom_minutes: mins ? String(mins) : "",
          };
        });
        setEmployeeServices(initMap);

        setServicesLoading(false);
      } catch (err) {
        console.error("Hálózati hiba szolgáltatásoknál:", err);
        setServicesErr("Hálózati hiba történt a szolgáltatások betöltésekor.");
        setServicesLoading(false);
      }
    };

    loadServices();
  }, [isOpen, activeTab, token, services.length, servicesErr]);

  // pipálás / kikapcsolás egy szolgáltatásnál
  const toggleServiceForEmployee = (serviceId: string) => {
    setEmployeeServices((prev) => {
      const current = prev[serviceId] || { checked: false, custom_minutes: "" };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          checked: !current.checked,
        },
      };
    });
  };

  // perc módosítása egy adott szolgáltatásnál
  const updateServiceMinutes = (serviceId: string, val: string) => {
    setEmployeeServices((prev) => {
      const current = prev[serviceId] || { checked: false, custom_minutes: "" };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          custom_minutes: val,
        },
      };
    });
  };

  // ha se event, se employee: semmit ne rendereljünk
  if (!event && !employee) return null;

  const employeeDisplayName =
    employee?.full_name || employee?.name || "Ismeretlen dolgozó";

  function formatDateTime(dt?: string | Date) {
    if (!dt) return "—";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("hu-HU");
  }

  // ---- Aktiválás / inaktiválás ----
  async function toggleActive() {
    if (!employee || !employee.id) return;
    if (!token) {
      setStatusError("Nincs jogosultság (nincs token).");
      return;
    }
    const newActive = !localActive;
    setUpdatingActive(true);
    setStatusError("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/employees/${employee.id}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ active: newActive }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Státusz frissítés hiba:", data);
        setStatusError(
          data?.error || "Nem sikerült frissíteni a státuszt a szerveren."
        );
      } else {
        setLocalActive(newActive);
        onEmployeeStatusChanged?.({ id: employee.id, active: newActive });
      }
    } catch (err) {
      console.error("Hálózati hiba státusz frissítéskor:", err);
      setStatusError("Hálózati hiba történt frissítés közben.");
    } finally {
      setUpdatingActive(false);
    }
  }

  // ---- Random erős jelszó ----
  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setPlainPassword(out);
    setShowPassword(true);
  }

  // ---- Belépési adatok mentése (külön gombbal) ----
  async function saveCredentials() {
    if (!token) {
      setCredsError("Nincs jogosultság (nincs token).");
      return;
    }
    if (!loginName.trim()) {
      setCredsError("A felhasználónév kötelező.");
      return;
    }

    setSavingCreds(true);
    setCredsError("");
    setCredsSuccess("");

    try {
      if (employee?.id) {
        // meglévő dolgozó
        const res = await fetch(
          `http://localhost:5000/api/employees/${employee.id}/credentials`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              login_name: loginName.trim(),
              plain_password: plainPassword || undefined,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Belépési adatok mentése hiba:", data);
          setCredsError(
            data?.error ||
              "Nem sikerült elmenteni a belépési adatokat a szerveren."
          );
        } else {
          setCredsSuccess("Belépési adatok mentve.");
          onEmployeeCredentialsChanged?.({
            id: employee.id,
            login_name: loginName.trim(),
          });
          setPlainPassword("");
          setShowPassword(false);
        }
      } else {
        // még nincs employee -> minimál user létrehozása
        const res = await fetch(
          "http://localhost:5000/api/employees/credentials",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              login_name: loginName.trim(),
              plain_password: plainPassword,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Új minimál user létrehozás hiba:", data);
          setCredsError(
            data?.error ||
              "Nem sikerült létrehozni az új felhasználót a szerveren."
          );
        } else {
          setCredsSuccess("Felhasználó létrehozva.");
          setPlainPassword("");
          setShowPassword(false);
        }
      }
    } catch (err) {
      console.error("Hálózati hiba belépési adatok mentésekor:", err);
      setCredsError("Hálózati hiba történt mentés közben.");
    } finally {
      setSavingCreds(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Részletek"
      style={{
        content: {
          inset: "auto",
          maxWidth: "720px",
          width: "100%",
          margin: "40px auto",
          borderRadius: "12px",
          padding: "0",
          backgroundColor: "transparent",
          border: "none",
        },
        overlay: { backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 },
      }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl overflow-hidden text-gray-800 dark:text-gray-100">
        {/* HEADER */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <div>
            <div className="text-lg font-semibold">
              {event?.title || employeeDisplayName || "Részletek"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Alap adatok · Szolgáltatások · Belépés/jogosultság
            </div>
          </div>
          <button
            onClick={onRequestClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 dark:border-neutral-700 text-sm font-medium">
          {([
            ["alap", "Alap adatok"],
            ["szolg", "Szolgáltatások"],
            ["login", "Belépés / jogosultság"],
          ] as [TabKey, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`px-4 py-2 ${
                activeTab === key
                  ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="p-4 space-y-6 text-sm max-h-[65vh] overflow-y-auto">
          {/* TAB: ALAP */}
          {activeTab === "alap" && (
            <>
              {event && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Időpont
                  </h3>
                  <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                    <p className="mb-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs block">
                        Kezdés
                      </span>
                      <span className="font-medium">
                        {formatDateTime(event.start)}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500 dark:text-gray-400 text-xs block">
                        Befejezés
                      </span>
                      <span className="font-medium">
                        {formatDateTime(event.end)}
                      </span>
                    </p>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Dolgozó
                </h3>
                <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block">
                      Név
                    </span>
                    <span className="font-medium">{employeeDisplayName}</span>
                  </div>

                  {employee?.position_name && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs block">
                        Beosztás / Pozíció
                      </span>
                      <span className="font-medium">
                        {employee.position_name}
                      </span>
                    </div>
                  )}

                  {employee?.location_name && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs block">
                        Telephely
                      </span>
                      <span className="font-medium">
                        {employee.location_name}
                      </span>
                    </div>
                  )}

                  {employee ? (
                    <>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs block">
                          Státusz
                        </span>
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                            localActive
                              ? "bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-800/40 dark:text-red-300"
                          }`}
                        >
                          {localActive ? "Aktív" : "Inaktív"}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                          Az inaktív dolgozót nem lehet foglalni. Itt tudod
                          aktiválni / inaktiválni.
                        </p>

                        <button
                          onClick={toggleActive}
                          disabled={updatingActive}
                          className={`text-sm font-medium px-4 py-2 rounded-lg shadow ${
                            localActive
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          } ${
                            updatingActive
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {updatingActive
                            ? "Mentés..."
                            : localActive
                            ? "Inaktiválás"
                            : "Aktiválás"}
                        </button>

                        {statusError && (
                          <div className="text-xs text-red-500 mt-2">
                            {statusError}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Még nincs HR profil (csak belépési adatok hozhatók létre a
                      „Belépés / jogosultság” fülön).
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* TAB: SZOLGÁLTATÁSOK */}
          {activeTab === "szolg" && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Szolgáltatások hozzárendelése
              </h3>

              <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 max-h-[50vh] overflow-y-auto">
                {servicesLoading && (
                  <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                    Szolgáltatások betöltése...
                  </div>
                )}

                {servicesErr && (
                  <div className="p-3 text-xs text-red-500">
                    {servicesErr}
                  </div>
                )}

                {!servicesLoading && !servicesErr && services.length === 0 && (
                  <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                    Nincs elérhető szolgáltatás.
                  </div>
                )}

                {!servicesLoading &&
                  !servicesErr &&
                  services.length > 0 && (
                    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                      {services.map((srv) => {
                        const state = employeeServices[srv.id] || {
                          checked: false,
                          custom_minutes:
                            srv.duration_minutes
                              ? String(srv.duration_minutes)
                              : srv.duration
                              ? String(srv.duration)
                              : "",
                        };

                        const priceDisplay =
                          srv.price != null
                            ? `${srv.price} Ft`
                            : "—";

                        const minutesLabel =
                          state.custom_minutes || "—";

                        return (
                          <div
                            key={srv.id}
                            className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          >
                            {/* Bal oldal: név + ár + leírás */}
                            <label className="flex items-start gap-2 flex-1 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-[3px]"
                                checked={state.checked}
                                onChange={() =>
                                  toggleServiceForEmployee(srv.id)
                                }
                              />
                              <div>
                                <div className="font-medium text-gray-800 dark:text-gray-100">
                                  {srv.name}
                                </div>

                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                  Ár: {priceDisplay} · Idő: {minutesLabel} perc
                                </div>

                                {srv.description && (
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {srv.description}
                                  </div>
                                )}
                              </div>
                            </label>

                            {/* Jobb oldal: egyedi perc módosítás */}
                            {state.checked && (
                              <div className="text-xs flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  Idő (perc):
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-20 border border-gray-300 dark:border-neutral-600 rounded-lg p-1 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100"
                                  value={state.custom_minutes}
                                  onChange={(e) =>
                                    updateServiceMinutes(
                                      srv.id,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Ez a lista a <code>services</code> táblából jön (név, ár,
                perc). A pipálás és a perc most csak lokál state-ben él.
                Következő lépésben ide tudunk rakni egy külön{" "}
                <strong>Mentés</strong> gombot, ami majd PATCH-eli az
                employee–service hozzárendelést a backend felé.
              </p>
            </section>
          )}

          {/* TAB: BELÉPÉS / JOGOSULTSÁG */}
          {activeTab === "login" && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Belépési adatok
              </h3>

              <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-4">
                {/* login név */}
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                    Felhasználónév
                  </label>
                  <input
                    className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="pl. szabo.anna"
                  />
                </div>

                {/* jelszó + show/hide + generálás */}
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                    Új jelszó
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={plainPassword}
                        onChange={(e) => setPlainPassword(e.target.value)}
                        placeholder="●●●●●●●●●●"
                        type={showPassword ? "text" : "password"}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-100 text-xs font-medium px-3 py-2 rounded-lg shadow whitespace-nowrap"
                      >
                        {showPassword ? "Elrejt" : "Mutat"}
                      </button>

                      <button
                        type="button"
                        onClick={generatePassword}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-100 text-xs font-medium px-3 py-2 rounded-lg shadow whitespace-nowrap"
                      >
                        Jelszó generálás
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      Ha üresen hagyod, a jelszó nem változik. Új felhasználó
                      létrehozásakor kötelező.
                    </p>
                  </div>
                </div>

                {/* csak login/jelszó mentése */}
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    type="button"
                    disabled={savingCreds}
                    onClick={saveCredentials}
                    className={`text-sm font-medium px-4 py-2 rounded-lg shadow bg-indigo-600 hover:bg-indigo-700 text-white ${
                      savingCreds ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {savingCreds
                      ? "Mentés..."
                      : employee?.id
                      ? "Belépési adatok mentése"
                      : "Új felhasználó létrehozása"}
                  </button>

                  {credsError && (
                    <div className="text-xs text-red-500 mt-2">
                      {credsError}
                    </div>
                  )}

                  {credsSuccess && (
                    <div className="text-xs text-green-600 mt-2">
                      {credsSuccess}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex justify-end">
          <button
            onClick={onRequestClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-100 text-sm font-medium px-4 py-2 rounded-lg shadow"
          >
            Bezárás
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
