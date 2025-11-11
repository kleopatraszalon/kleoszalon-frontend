import React, { useEffect, useState } from "react";
import withBase from "../utils/apiBase";
import Modal from "react-modal";

interface LocationItem {
  id: string;
  name: string;
}

// DB-ből jövő szolgáltatás
interface ServiceRow {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
}

interface EmployeeNewModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onEmployeeCreated?: (newEmp: any) => void; // visszaadjuk a friss rekordot a listának
}

const EmployeeNewModal: React.FC<EmployeeNewModalProps> = ({
  isOpen,
  onRequestClose,
  onEmployeeCreated,
}) => {
 const token =
  localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";
 const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

  // alap mezők
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // belépési adatok
  const [loginName, setLoginName] = useState("");
  const [plainPassword, setPlainPassword] = useState("");

  // jogosultságok pipákkal
  const [roleAdmin, setRoleAdmin] = useState(false);
  const [roleReception, setRoleReception] = useState(false);
  const [roleHair, setRoleHair] = useState(false);
  const [roleNails, setRoleNails] = useState(false);
  const [roleCosmetic, setRoleCosmetic] = useState(false);

  // telephely (meghagyjuk, de NEM kötelező többé mentéskor)
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationId, setLocationId] = useState("");

  // státusz
  const [active, setActive] = useState(true);

  // szolgáltatások
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesErr, setServicesErr] = useState("");

  // dolgozóhoz beállított szolgáltatások (lokális)
  // kulcs: service_id
  // érték: { checked, custom_minutes }
  const [employeeServices, setEmployeeServices] = useState<
    Record<
      string,
      {
        checked: boolean;
        custom_minutes: string;
      }
    >
  >({});

  // hiba / siker
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // jelszó generálás
  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < 10; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPlainPassword(out);
  }

  // telephelyek betöltése (de most már opcionális lesz)
  useEffect(() => {
    if (!isOpen) return;

   fetch(withBase("locations"), { headers: authHeaders });
   fetch(withBase("locations"), { headers: authHeaders });

     fetch(withBase("services/available"), { headers: authHeaders })
  .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0 && !locationId) {
            setLocationId(data[0].id); // default
          }
        }
      })
      .catch((err) => {
        console.error("Telephelyek betöltési hiba:", err);
      });
  }, [isOpen, token, locationId]);

  // szolgáltatások betöltése
  useEffect(() => {
    if (!isOpen) return;

    if (!token) {
      setServicesErr("Nincs jogosultság (nincs token).");
      return;
    }

    setServicesLoading(true);
    setServicesErr("");

    fetch(withBase("services/available"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const txt = await res.text();
        let data: any = {};
        try {
          data = txt ? JSON.parse(txt) : {};
        } catch {
          data = { error: "Váratlan szerverválasz." };
        }
        if (!res.ok) {
          throw data;
        }
        if (!Array.isArray(data)) {
          throw { error: "Nem lista jött vissza a services-re." };
        }

        setServices(data);

        // inicializáljuk employeeServices állapotot minden bejött service-re
        const initMap: Record<
          string,
          { checked: boolean; custom_minutes: string }
        > = {};
        data.forEach((srv: ServiceRow) => {
          const mins =
            srv.duration_minutes ??
            srv.duration ??
            "";
          initMap[srv.id] = {
            checked: false,
            custom_minutes: mins ? String(mins) : "",
          };
        });
        setEmployeeServices(initMap);

        setServicesLoading(false);
      })
      .catch((err) => {
        console.error("Szolgáltatások betöltése hiba:", err);
        setServicesErr(
          err?.error ||
            "Nem sikerült lekérni a szolgáltatásokat a szerverről."
        );
        setServicesLoading(false);
      });
  }, [isOpen, token]);

  // checkbox váltás egy szolgáltatásnál
  const toggleServiceForEmployee = (serviceId: string) => {
    setEmployeeServices((prev) => {
      const current = prev[serviceId] || {
        checked: false,
        custom_minutes: "",
      };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          checked: !current.checked,
        },
      };
    });
  };

  // idő (perc) módosítás egy szolgáltatásnál
  const updateServiceMinutes = (serviceId: string, val: string) => {
    setEmployeeServices((prev) => {
      const current = prev[serviceId] || {
        checked: false,
        custom_minutes: "",
      };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          custom_minutes: val,
        },
      };
    });
  };

  async function handleSaveNewEmployee() {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    // kötelező mezők (location már NEM kötelező)
    if (!fullName.trim()) {
      setErrorMsg("A név kötelező.");
      setSaving(false);
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("A telefonszám kötelező.");
      setSaving(false);
      return;
    }
    if (!loginName.trim()) {
      setErrorMsg("A belépési név kötelező.");
      setSaving(false);
      return;
    }
    if (!plainPassword.trim()) {
      setErrorMsg("Adj meg (vagy generálj) jelszót.");
      setSaving(false);
      return;
    }

    // szerepkörök összerakása
    const roles: string[] = [];
    if (roleAdmin) roles.push("admin");
    if (roleReception) roles.push("reception");
    if (roleHair) roles.push("hairdresser");
    if (roleNails) roles.push("nailtech");
    if (roleCosmetic) roles.push("cosmetician");

    try {
      // location_id most opcionális -> ha nincs kiválasztva, küldhetünk null-t
      const bodyToSend: any = {
        full_name: fullName,
        phone,
        email,
        login_name: loginName,
        plain_password: plainPassword,
        roles,
        active,
      };

      if (locationId) {
        bodyToSend.location_id = locationId;
      } else {
        bodyToSend.location_id = null;
      }

      // FIGYELEM: a backend jelenlegi /api/employees POST-jában
      // a location_id kötelező volt – te mondtad, hogy most NE kelljen.
      // Ehhez a backend oldalt is úgy kell módosítani, hogy ne dobjon hibát,
      // ha location_id null. (pl. ne legyen NOT NULL a DB-ben, és ne rejectálja.)
    const res = await fetch(withBase("employees"), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders,
  },
  body: JSON.stringify(bodyToSend),
});

      const txt = await res.text();
      let data: any = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        data = { error: "Váratlan szerverválasz" };
      }

      if (!res.ok) {
        console.error("Mentési hiba:", data);
        setErrorMsg(
          data?.error || "Nem sikerült létrehozni az új dolgozót."
        );
      } else {
        setSuccessMsg("Új dolgozó elmentve.");

        // Itt a következő lépés az lenne, hogy a pipált szolgáltatásokat
        // (employeeServices) elküldjük egy PATCH /api/employees/:id/services
        // endpointnak. Ez még nincs backendben, úgyhogy most csak console.log:
        console.log("Mentett dolgozó:", data);
        console.log("Hozzárendelt szolgáltatások (lokális):", employeeServices);

        // ürítés
        setFullName("");
        setPhone("");
        setEmail("");
        setLoginName("");
        setPlainPassword("");
        setRoleAdmin(false);
        setRoleReception(false);
        setRoleHair(false);
        setRoleNails(false);
        setRoleCosmetic(false);
        setActive(true);

        // Ha akarod, telephelyet is visszaállíthatjuk üresre vagy hagyhatjuk
        // setLocationId("");

        // listafrissítésnek szólunk
        onEmployeeCreated?.(data);
      }
    } catch (err) {
      console.error("Hálózati hiba dolgozó mentéskor:", err);
      setErrorMsg("Hálózati hiba történt mentés közben.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Új dolgozó felvétele"
      style={{
        content: {
          inset: "auto",
          maxWidth: "700px",
          width: "100%",
          margin: "40px auto",
          borderRadius: "12px",
          padding: "0",
          backgroundColor: "transparent",
          border: "none",
        },
        overlay: {
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 9999,
        },
      }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl overflow-hidden text-gray-800 dark:text-gray-100">
        {/* Fejléc */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Új dolgozó felvétele
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hozz létre egy fiókot. A többi adatot később is kitöltheted.
            </div>
          </div>

          <button
            onClick={onRequestClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tartalom */}
        <div className="p-4 space-y-6 text-sm max-h-[70vh] overflow-y-auto">
          {/* Alap azonosítók */}
          <section className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-3">
            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                Teljes név *
              </label>
              <input
                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="pl. Szabó Anna"
              />
            </div>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                Telefonszám *
              </label>
              <input
                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+36 30 ..."
              />
            </div>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                E-mail
              </label>
              <input
                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="valaki@szalon.hu"
              />
            </div>
          </section>

          {/* Belépési adatok */}
          <section className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Belépési adatok
            </h3>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                Felhasználónév (login_name) *
              </label>
              <input
                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="pl. szabo.anna"
              />
            </div>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                Jelszó *
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                  value={plainPassword}
                  onChange={(e) => setPlainPassword(e.target.value)}
                  type="text"
                  placeholder="●●●●●●●●●●"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-100 text-xs font-medium px-3 py-2 rounded-lg shadow whitespace-nowrap"
                >
                  Jelszó generálás
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                Automatikusan titkosítva kerül mentésre.
              </p>
            </div>
          </section>

          {/* Telephely + Aktív státusz */}
          <section className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Munkavégzés helye
            </h3>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">
                Telephely (nem kötelező most)
              </label>
              <select
                className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">-- Nincs telephely hozzárendelve --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="activeToggle"
                type="checkbox"
                className="w-4 h-4"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label
                htmlFor="activeToggle"
                className="text-xs text-gray-700 dark:text-gray-300"
              >
                Aktív dolgozó (foglalható)
              </label>
            </div>
          </section>

          {/* Jogosultságok */}
          <section className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Jogosultságok / szerepkörök
            </h3>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Ezek határozzák meg, milyen menüket és funkciókat lát a rendszerben.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleAdmin}
                  onChange={(e) => setRoleAdmin(e.target.checked)}
                />
                Admin
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleReception}
                  onChange={(e) => setRoleReception(e.target.checked)}
                />
                Recepciós
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleHair}
                  onChange={(e) => setRoleHair(e.target.checked)}
                />
                Fodrász
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleNails}
                  onChange={(e) => setRoleNails(e.target.checked)}
                />
                Műkörmös
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleCosmetic}
                  onChange={(e) => setRoleCosmetic(e.target.checked)}
                />
                Kozmetikus
              </label>
            </div>
          </section>

          {/* Szolgáltatások hozzárendelése */}
          <section className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Szolgáltatások
            </h3>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Mit végezhet ez a dolgozó, és hány perc alatt? (Ez most csak
              lokálisan van eltárolva, mentés után a konzolra kerül. Később
              backend PATCH-el rögzítjük.)
            </p>

            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 max-h-[30vh] overflow-y-auto divide-y divide-gray-200 dark:divide-neutral-700 text-xs">
              {servicesLoading && (
                <div className="p-3 text-gray-500 dark:text-gray-400">
                  Szolgáltatások betöltése...
                </div>
              )}

              {servicesErr && (
                <div className="p-3 text-red-500">{servicesErr}</div>
              )}

              {!servicesLoading && !servicesErr && services.length === 0 && (
                <div className="p-3 text-gray-500 dark:text-gray-400">
                  Nincs elérhető szolgáltatás.
                </div>
              )}

              {!servicesLoading &&
                !servicesErr &&
                services.length > 0 &&
                services.map((srv) => {
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
                    srv.price != null ? `${srv.price} Ft` : "—";

                  return (
                    <div
                      key={srv.id}
                      className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      {/* bal oldal */}
                      <label className="flex items-start gap-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-[2px]"
                          checked={state.checked}
                          onChange={() => toggleServiceForEmployee(srv.id)}
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {srv.name}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Ár: {priceDisplay} · Alap idő:{" "}
                            {state.custom_minutes || "—"} perc
                          </div>
                          {srv.description && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {srv.description}
                            </div>
                          )}
                        </div>
                      </label>

                      {/* jobb oldal: egyedi perc beállítás */}
                      {state.checked && (
                        <div className="text-[11px] flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <span>Idő (perc):</span>
                          <input
                            type="number"
                            min={1}
                            className="w-20 border border-gray-300 dark:border-neutral-600 rounded-lg p-1 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100"
                            value={state.custom_minutes}
                            onChange={(e) =>
                              updateServiceMinutes(srv.id, e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Hiba / siker üzenetek */}
          {errorMsg && (
            <div className="text-xs text-red-500">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="text-xs text-green-600">{successMsg}</div>
          )}
        </div>

        {/* Láb - Mentés + Bezárás */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex justify-between">
          <button
            onClick={onRequestClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-100 text-sm font-medium px-4 py-2 rounded-lg shadow"
          >
            Mégse
          </button>

          <button
            onClick={handleSaveNewEmployee}
            disabled={saving}
            className={`text-sm font-medium px-4 py-2 rounded-lg shadow bg-green-600 hover:bg-green-700 text-white ${
              saving ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {saving ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeNewModal;