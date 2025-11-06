import React, { useEffect, useState } from "react";

// ---- Tipusok (ne ütközzön a böngésző "Location" típusával) ----
export type KleoLocation = {
  id: string | number;
  name: string;
};

export type ServiceDTO = {
  id: string | number;
  name: string;
  default_duration_min: number | null;
};

export type ServiceAssignment = {
  service_id: string; // mindenhol stringesítjük az összehasonlítás miatt
  custom_duration_min: string; // üres string => nincs egyedi idő
};

export type EmployeeCreateModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  onSaved?: () => void;
};

// Megjelenített címke vs. backend kulcs
const AVAILABLE_ROLES: { key: string; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "receptionist", label: "Recepciós" },
  { key: "employee", label: "Dolgozó" },
  { key: "worker", label: "Munkatárs" },
  { key: "hairdresser", label: "Fodrász" },
  { key: "manicurist", label: "Műkörmös" },
  { key: "cosmetician", label: "Kozmetikus" },
  { key: "masseur", label: "Masszőr" },
  { key: "lash_stylist", label: "Szempilla stylist" },
  { key: "makeup_artist", label: "Sminkes" },
  { key: "waxing", label: "Gyantázás" },
  { key: "tattoo", label: "Tetováló" },
  { key: "trainee", label: "Tanonc" },
];

// ---- kis segédek ----
function safeParse<T>(txt: string, fallback: T): T {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

// Fontos: TSX-ben a generikus nyílfüggvény könnyen ütközik a JSX-szel.
// Ezért használjunk function deklarációt (vagy <T,> szintaxist).
async function fetchJSON<T>(url: string, init?: RequestInit, fallback?: T): Promise<T> {
  const res = await fetch(url, init);
  const txt = await res.text();
  return (txt ? (JSON.parse(txt) as T) : (fallback as T));
}

const TAB_VALUES = ["alap", "szolg", "login"] as const;
type Tab = typeof TAB_VALUES[number];

const EmployeeCreateModal: React.FC<EmployeeCreateModalProps> = ({
  isOpen,
  onRequestClose,
  onSaved,
}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";

  // aktív fül
  const [activeTab, setActiveTab] = useState<Tab>("alap");

  // dropdown adatok
  const [locations, setLocations] = useState<KleoLocation[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);

  // --- ALAP ADATOK ---
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [taj, setTaj] = useState("");
  const [taxId, setTaxId] = useState("");
  const [qualification, setQualification] = useState("");
  const [gender, setGender] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [workScheduleType, setWorkScheduleType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [hourlyWage, setHourlyWage] = useState("");

  // --- SZOLGÁLTATÁSOK ---
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]);

  // --- LOGIN / JOGOSULTSÁG ---
  const [loginName, setLoginName] = useState("");
  const [plainPassword, setPlainPassword] = useState("");
  const [rolesSelected, setRolesSelected] = useState<string[]>([]);
  const [savingWhole, setSavingWhole] = useState(false);

  // státuszüzenetek a login fülhöz
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // telephelyek + szolgáltatások betöltése modal nyitásakor
  useEffect(() => {
    if (!isOpen) return;

    // reset form minden megnyitáskor
    setActiveTab("alap");

    // Telephelyek
    fetchJSON<KleoLocation[]>(
      "/api/locations",
      { headers: { Authorization: `Bearer ${token}` } },
      []
    )
      .then((data) => {
        setLocations(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setLocationId((prev) => prev || String(data[0].id));
        }
      })
      .catch((err) => {
        console.error("Telephelyek betöltése hiba:", err);
        setLocations([]);
      });

    // Szolgáltatások (elérhető)
    fetchJSON<ServiceDTO[]>(
      "/api/services/available",
      { headers: { Authorization: `Bearer ${token}` } },
      []
    )
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Szolgáltatások betöltése hiba:", err);
        setServices([]);
      });
  }, [isOpen, token]);

  // validálók
  const isValidTaj = (value: string) => /^[0-9]{9}$/.test(value.trim());
  const isValidTaxId = (value: string) => /^[0-9]{8,11}$/.test(value.trim());

  // kötelező mezők ellenőrzése a teljes mentéshez
  const formValid = () => {
    if (!lastName.trim()) return false;
    if (!firstName.trim()) return false;
    if (!phone.trim()) return false;
    if (!birthDate.trim()) return false;
    if (!gender) return false;
    if (!locationId) return false;
    if (!loginName.trim()) return false;
    if (!plainPassword.trim() || plainPassword.trim().length < 8) return false;
    return true;
  };

  // szolgáltatás pipálás
  const toggleServiceForEmployee = (
    serviceId: string | number,
    defaultDuration: number | null
  ) => {
    const sid = String(serviceId);
    const exists = serviceAssignments.find((a) => a.service_id === sid);
    if (exists) {
      setServiceAssignments((prev) => prev.filter((a) => a.service_id !== sid));
    } else {
      setServiceAssignments((prev) => [
        ...prev,
        {
          service_id: sid,
          custom_duration_min: defaultDuration ? String(defaultDuration) : "",
        },
      ]);
    }
  };

  const updateServiceDuration = (serviceId: string | number, minutes: string) => {
    const sid = String(serviceId);
    setServiceAssignments((prev) =>
      prev.map((a) => (a.service_id === sid ? { ...a, custom_duration_min: minutes } : a))
    );
  };

  // szerepkör pipálás
  const toggleRole = (key: string) => {
    setRolesSelected((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  // jelszó generálás
  function generatePassword() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < 12; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setPlainPassword(out);
    setActiveTab("login");
    setLoginSuccess("Generált jelszó kitöltve, mentsd el!");
  }

  // TELJES FELVÉTEL MENTÉSE
  const handleSaveAll = async () => {
    if (!token) {
      alert("Nincs token, jelentkezz be újra.");
      return;
    }
    if (!formValid()) {
      alert("Hiányzik kötelező adat vagy hibás mező (jelszó min. 8 karakter).");
      return;
    }

    setSavingWhole(true);
    setLoginError("");
    setLoginSuccess("");

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${lastName} ${firstName}`.trim(),
      phone: phone.trim(),
      email: null as string | null,
      birth_date: birthDate,
      taj: taj.trim() || null,
      tax_id: taxId.trim() || null,
      qualification: qualification.trim() || null,
      gender: gender || null,
      location_id: locationId ? Number(locationId) : null,
      work_schedule: workScheduleType || null,
      employment_type: employmentType || null,
      monthly_wage: monthlyWage ? Number(monthlyWage) : null,
      hourly_wage: hourlyWage ? Number(hourlyWage) : null,

      // login
      login: {
        username: loginName.trim(),
        plain_password: plainPassword.trim(),
        roles: rolesSelected,
      },

      // szolgáltatások hozzárendelése
      services: serviceAssignments.map((a) => ({
        service_id: a.service_id,
        duration_min: a.custom_duration_min ? Number(a.custom_duration_min) : null,
      })),
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      const data = safeParse<any>(txt, {});
      if (!res.ok) {
        console.error("Mentés sikertelen:", data);
        alert(data?.error || "Hiba történt mentés közben (POST /api/employees).");
        setSavingWhole(false);
        return;
      }

      onSaved?.();
      onRequestClose();
    } catch (err) {
      console.error("Hálózati hiba új munkatárs mentésekor:", err);
      alert("Hálózati hiba történt mentés közben.");
      setSavingWhole(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[min(1100px,95vw)] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-xl">
        {/* HEADER */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Új munkatárs felvétele
          </h2>

          <button
            onClick={onRequestClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            ✕ Bezárás
          </button>
        </div>

        {/* TABS */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-gray-200 dark:border-neutral-700">
          <button
            className={`px-4 py-2 ${
              activeTab === "alap"
                ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("alap")}
          >
            Alap adatok
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "szolg"
                ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("szolg")}
          >
            Szolgáltatások
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "login"
                ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Belépés / Jogosultság
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-sm text-gray-800 dark:text-gray-100">
          {activeTab === "alap" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* vezetéknév */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vezetéknév</label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              {/* keresztnév */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Keresztnév</label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              {/* telefon */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Telefon</label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+36…"
                />
              </div>

              {/* születési dátum */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Születési dátum</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              {/* TAJ */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  TAJ szám{" "}
                  {taj && !isValidTaj(taj) && (
                    <span className="text-red-500 ml-2 text-[10px]">Hibás TAJ</span>
                  )}
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={taj}
                  onChange={(e) => setTaj(e.target.value)}
                  placeholder="9 számjegy"
                />
              </div>

              {/* Adóazonosító */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Adóazonosító jel{" "}
                  {taxId && !isValidTaxId(taxId) && (
                    <span className="text-red-500 ml-2 text-[10px]">Hibás adószám</span>
                  )}
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="adóazonosító"
                />
              </div>

              {/* Végzettség */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Végzettség</label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="pl. Kozmetikus OKJ"
                />
              </div>

              {/* Nem */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nem</label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="female">Nő</option>
                  <option value="male">Férfi</option>
                </select>
              </div>

              {/* Telephely */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Telephely</label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  {locations.map((loc) => (
                    <option key={String(loc.id)} value={String(loc.id)}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Munkarend */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Munkarend</label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={workScheduleType}
                  onChange={(e) => setWorkScheduleType(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="altalanos">Általános munkarend</option>
                  <option value="beosztas">Beosztás szerint</option>
                </select>
              </div>

              {/* Foglalkoztatás típusa */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Foglalkoztatás</label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="teljes">Teljes munkaidő</option>
                  <option value="reszmunka">Részmunkaidő</option>
                  <option value="vallalkozoi">Vállalkozói szerződés</option>
                </select>
              </div>

              {/* Fix bér */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fix havi bér (HUF)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(e.target.value)}
                />
              </div>

              {/* Órabér */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Órabér (HUF)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === "szolg" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Pipáld ki, mit vállalhat ez a munkatárs. Adj meg egyedi időt (percben), ha nem az alapértelmezett.
              </p>

              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-900">
                {services.map((srv) => {
                  const sid = String(srv.id);
                  const checked = serviceAssignments.some((a) => a.service_id === sid);
                  const current = serviceAssignments.find((a) => a.service_id === sid);

                  return (
                    <div
                      key={sid}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-neutral-800 py-2"
                    >
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-[3px]"
                          checked={checked}
                          onChange={() => toggleServiceForEmployee(sid, srv.default_duration_min)}
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">{srv.name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Alap: {srv.default_duration_min ?? "—"} perc
                          </div>
                        </div>
                      </label>

                      {checked && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Egyedi (perc)</span>
                          <input
                            className="w-20 border border-gray-300 dark:border-neutral-600 rounded-lg p-1 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100"
                            value={current?.custom_duration_min ?? ""}
                            onChange={(e) => updateServiceDuration(sid, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {services.length === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                    Még nincs szolgáltatás felvéve.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "login" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* felhasználónév */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Felhasználónév (email)</label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="pl. anna.kovacs@szalon.hu"
                />
              </div>

              {/* jelszó + generálás */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Jelszó</label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                    value={plainPassword}
                    onChange={(e) => setPlainPassword(e.target.value)}
                    placeholder="**********"
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="whitespace-nowrap bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-100 text-xs font-medium px-3 py-2 rounded-lg shadow"
                  >
                    Jelszó generálás
                  </button>
                </div>
                {loginError && <div className="text-xs text-red-500 mt-1">{loginError}</div>}
                {loginSuccess && <div className="text-xs text-green-600 mt-1">{loginSuccess}</div>}
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  A generált jelszó mentéskor titkosítva kerül az adatbázisba. (Min. 8 karakter.)
                </div>
              </div>

              {/* szerepkörök */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Szerepkörök</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {AVAILABLE_ROLES.map((r) => (
                    <label
                      key={r.key}
                      className="flex items-start gap-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg p-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-[2px]"
                        checked={rolesSelected.includes(r.key)}
                        onChange={() => toggleRole(r.key)}
                      />
                      <span className="text-gray-800 dark:text-gray-100">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-end gap-3">
          <button
            onClick={onRequestClose}
            className="px-4 py-2 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-gray-100"
          >
            Mégse
          </button>

          <button
            onClick={handleSaveAll}
            disabled={savingWhole || !formValid()}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              savingWhole || !formValid()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {savingWhole ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCreateModal;
