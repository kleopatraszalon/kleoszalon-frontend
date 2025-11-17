import React, { useEffect, useState } from "react";
import withBase from "../utils/apiBase";

// ---- Típusok (ne ütközzön a böngésző "Location" típusával) ----
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

type RoleOption = {
  key: string;
  label: string;
};

export type EmployeeCreateModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  onSaved?: () => void;
};

// ---- Alapértelmezett (fallback) jogosultság lista ----
const FALLBACK_ROLES: RoleOption[] = [
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
async function fetchJSON<T>(
  url: string,
  init?: RequestInit,
  fallback?: T
): Promise<T> {
  const res = await fetch(url, init);
  const txt = await res.text();
  if (!txt) {
    return (fallback as T) ?? ({} as T);
  }
  return safeParse<T>(txt, (fallback as T) ?? ({} as T));
}

const TAB_VALUES = ["alap", "szolg", "login"] as const;
type Tab = (typeof TAB_VALUES)[number];

const EmployeeCreateModal: React.FC<EmployeeCreateModalProps> = ({
  isOpen,
  onRequestClose,
  onSaved,
}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";

  // aktív fül
  const [activeTab, setActiveTab] = useState<Tab>("alap");

  // dropdown / törzs adatok
  const [locations, setLocations] = useState<KleoLocation[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>(FALLBACK_ROLES);

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

  // --- SZOLGÁLTATÁS HOZZÁRENDELÉS ---
  const [serviceAssignments, setServiceAssignments] = useState<
    ServiceAssignment[]
  >([]);

  // --- LOGIN / ROLE TAB ---
  const [loginName, setLoginName] = useState("");
  const [plainPassword, setPlainPassword] = useState("");
  const [rolesPicked, setRolesPicked] = useState<string[]>(["employee"]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // teljes mentés állapota
  const [savingWhole, setSavingWhole] = useState(false);

  // ---- Megnyitáskor alapadatok (telephely, szolgáltatások, jogosultságok) betöltése ----
  useEffect(() => {
    if (!isOpen) return;

    // reset form bizonyos részei
    setActiveTab("alap");
    setLoginError(null);
    setLoginSuccess(null);
    setSavingWhole(false);

    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Telephelyek
    fetchJSON<KleoLocation[]>(withBase("locations"), { headers: authHeaders }, [])
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setLocations(arr);
        if (arr.length > 0) {
          setLocationId((prev) => prev || String(arr[0].id));
        }
      })
      .catch((err) => {
        console.error("Telephelyek betöltése hiba:", err);
        setLocations([]);
      });

    // Szolgáltatások (elérhető)
    fetchJSON<ServiceDTO[]>(
      withBase("services/available"),
      { headers: authHeaders },
      []
    )
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setServices(arr);
      })
      .catch((err) => {
        console.error("Szolgáltatások betöltése hiba:", err);
        setServices([]);
      });

    // Jogosultságok DB-ből
    // Várt endpoint: GET /api/roles (withBase("roles"))
    // Ha hibázik vagy üres, visszaesünk a FALLBACK_ROLES listára.
    fetchJSON<any[]>(withBase("roles"), { headers: authHeaders }, [])
      .then((data) => {
        let mapped: RoleOption[] = [];

        if (Array.isArray(data)) {
          mapped = data
            .map((r) => {
              // több lehetséges szerkezetet is támogatunk
              if (typeof r === "string") {
                return { key: r, label: r };
              }
              if (r && typeof r === "object") {
                if (r.key && r.label) {
                  return {
                    key: String(r.key),
                    label: String(r.label),
                  };
                }
                if (r.code && r.name) {
                  return {
                    key: String(r.code),
                    label: String(r.name),
                  };
                }
                if (r.id && r.name) {
                  return {
                    key: String(r.id),
                    label: String(r.name),
                  };
                }
              }
              return null;
            })
            .filter(Boolean) as RoleOption[];
        }

        if (!mapped.length) {
          setAvailableRoles(FALLBACK_ROLES);
        } else {
          setAvailableRoles(mapped);
          // ha eddig csak default volt, aktualizáljuk
          setRolesPicked((prev) =>
            prev && prev.length
              ? prev
              : mapped
                  .filter((r) => r.key === "employee" || r.key === "worker")
                  .map((r) => r.key)
          );
        }
      })
      .catch((err) => {
        console.error("Jogosultságok betöltése hiba, fallback lista használata:", err);
        setAvailableRoles(FALLBACK_ROLES);
      });
  }, [isOpen, token]);

  // validálók
  const isValidTaj = (value: string) => /^[0-9]{9}$/.test(value.trim());
  const isValidTaxId = (value: string) => /^[0-9]{8,11}$/.test(value.trim());

  // kötelező mezők ellenőrzése a teljes mentéshez
  const formValid = () => {
    if (!lastName.trim() || !firstName.trim()) return false;
    if (!taj.trim() || !isValidTaj(taj)) return false;
    if (!taxId.trim() || !isValidTaxId(taxId)) return false;
    if (!locationId) return false;
    return true;
  };

  // Jelszó generálása (pl. 10 karakter)
  const generatePassword = () => {
    const chars =
      "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPlainPassword(pwd);
    setLoginSuccess("Új jelszó generálva. Mentéskor lesz érvényesítve.");
    setLoginError(null);
  };

  // szerepkör kiválasztása / toggle
  const toggleRole = (key: string) => {
    setRolesPicked((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  // szolgáltatás hozzáadása a listához
  const addServiceAssignment = (serviceId: string | number) => {
    const svc = services.find((s) => String(s.id) === String(serviceId));
    if (!svc) return;

    setServiceAssignments((prev) => {
      if (prev.some((p) => String(p.service_id) === String(serviceId))) {
        return prev;
      }
      return [
        ...prev,
        {
          service_id: String(svc.id),
          custom_duration_min: svc.default_duration_min
            ? String(svc.default_duration_min)
            : "",
        },
      ];
    });
  };

  // szolgáltatás törlése a listából
  const removeServiceAssignment = (serviceId: string) => {
    setServiceAssignments((prev) =>
      prev.filter((p) => String(p.service_id) !== String(serviceId))
    );
  };

  // szolgáltatás egyedi perc módosítás
  const updateServiceDuration = (serviceId: string, minutes: string) => {
    setServiceAssignments((prev) =>
      prev.map((p) =>
        String(p.service_id) === String(serviceId)
          ? { ...p, custom_duration_min: minutes }
          : p
      )
    );
  };

  // Teljes mentés gomb
  const handleSaveAll = async () => {
    if (!formValid()) {
      alert("Kérlek töltsd ki a kötelező mezőket (TAJ, adószám, név, telephely).");
      return;
    }

    if (!token) {
      alert("Nincs token – jelentkezz be újra.");
      return;
    }

    setSavingWhole(true);
    setLoginError(null);
    setLoginSuccess(null);

    const payload = {
      last_name: lastName.trim() || null,
      first_name: firstName.trim() || null,
      phone: phone.trim() || null,
      birth_date: birthDate || null,
      taj: taj.trim(),
      tax_id: taxId.trim(),
      qualification: qualification.trim() || null,
      gender: gender || null,
      location_id: locationId || null,
      work_schedule_type: workScheduleType || null,
      employment_type: employmentType || null,
      monthly_wage: monthlyWage ? Number(monthlyWage) : null,
      hourly_wage: hourlyWage ? Number(hourlyWage) : null,
      login_name: loginName.trim() || null,
      plain_password: plainPassword.trim() || null,
      roles: rolesPicked,
      services: serviceAssignments.map((a) => ({
        service_id: a.service_id,
        custom_duration_min: a.custom_duration_min
          ? Number(a.custom_duration_min)
          : null,
      })),
    };

    try {
      const res = await fetch(withBase("employees"), {
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
        alert(
          data?.error || "Hiba történt mentés közben (POST /api/employees)."
        );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,12,8,0.65)] backdrop-blur-sm">
      <div className="w-[min(1100px,95vw)] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white/98 text-[#120c08] border border-[#d5c4a4] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        {/* HEADER */}
        <div className="p-4 border-b border-[#e3d8c3] bg-gradient-to-r from-[#fffaf5] via-[#f9f0e4] to-[#fffaf5] flex items-center justify-between">
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
            Belépés & jogosultság
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* --- ALAP TAB --- */}
          {activeTab === "alap" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Név */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Vezetéknév *
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Keresztnév *
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              {/* Telefon & Születési dátum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Telefon
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Születési dátum
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              {/* TAJ, adószám */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  TAJ szám *
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={taj}
                  onChange={(e) => setTaj(e.target.value)}
                />
                {!isValidTaj(taj) && taj.trim() && (
                  <p className="mt-1 text-xs text-red-500">
                    A TAJ szám 9 számjegyű kell legyen.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Adószám *
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
                {!isValidTaxId(taxId) && taxId.trim() && (
                  <p className="mt-1 text-xs text-red-500">
                    Az adószám 8–11 számjegyű legyen.
                  </p>
                )}
              </div>

              {/* Végzettség, nem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Végzettség
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nem
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">– nincs megadva –</option>
                  <option value="female">Nő</option>
                  <option value="male">Férfi</option>
                  <option value="other">Egyéb / nem szeretné megadni</option>
                </select>
              </div>

              {/* Telephely, munkaidő típus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Telephely *
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">– válassz telephelyet –</option>
                  {locations.map((loc) => (
                    <option key={String(loc.id)} value={String(loc.id)}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Munkaidő típusa
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  placeholder="pl. teljes / részmunkaidő"
                  value={workScheduleType}
                  onChange={(e) => setWorkScheduleType(e.target.value)}
                />
              </div>

              {/* Foglalkoztatási forma, bérezés */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Foglalkoztatási forma
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  placeholder="pl. alkalmazott, vállalkozó"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Havi bér (Ft)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    value={monthlyWage}
                    onChange={(e) => setMonthlyWage(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Órabér (Ft)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- SZOLGÁLTATÁS TAB --- */}
          {activeTab === "szolg" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Szolgáltatás hozzáadása
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addServiceAssignment(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">– válassz szolgáltatást –</option>
                    {services.map((s) => (
                      <option key={String(s.id)} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {serviceAssignments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Egyelőre nincs hozzárendelt szolgáltatás. Válassz ki fent egyet
                  a listából.
                </p>
              ) : (
                <table className="min-w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-md overflow-hidden">
                  <thead className="bg-gray-50 dark:bg-neutral-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                        Szolgáltatás
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                        Alap idő (perc)
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                        Egyedi idő (perc)
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {serviceAssignments.map((a) => {
                      const svc = services.find(
                        (s) => String(s.id) === String(a.service_id)
                      );
                      const baseMin = svc?.default_duration_min ?? null;
                      return (
                        <tr
                          key={String(a.service_id)}
                          className="border-t border-gray-200 dark:border-neutral-700"
                        >
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-100">
                            {svc?.name || `ID: ${a.service_id}`}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                            {baseMin ? `${baseMin} perc` : "n/a"}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              className="w-28 rounded-md border border-gray-300 dark:border-neutral-600 px-2 py-1 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                              value={a.custom_duration_min}
                              onChange={(e) =>
                                updateServiceDuration(
                                  a.service_id,
                                  e.target.value
                                )
                              }
                              placeholder={baseMin ? String(baseMin) : ""}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              className="text-xs text-red-500 hover:text-red-700"
                              onClick={() =>
                                removeServiceAssignment(a.service_id)
                              }
                            >
                              Törlés
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* --- LOGIN / JOGOSULTSÁG TAB --- */}
          {activeTab === "login" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Bejelentkezési név (login)
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="pl. kovacs.anna"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Kezdő jelszó
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                      type="text"
                      value={plainPassword}
                      onChange={(e) => setPlainPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-3 py-2 text-xs rounded-md border border-[#d4a373] text-[#d4a373] hover:bg-[#d4a373]/10"
                    >
                      Jelszó generálása
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    A jelszó mentése csak a{" "}
                    <strong>„Teljes mentés”</strong> gombbal történik meg.
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="text-sm text-red-500">{loginError}</div>
              )}
              {loginSuccess && (
                <div className="text-sm text-green-600">{loginSuccess}</div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Jogosultságok
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role.key}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={rolesPicked.includes(role.key)}
                        onChange={() => toggleRole(role.key)}
                      />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A kiválasztott szerepkörök alapján dől el, mit érhet el a
                  rendszerben (admin, recepciós, stb.). A lista alapvetően az
                  adatbázisból jön (<code>/api/roles</code>), hiba esetén a
                  beépített alapértelmezett listára esik vissza.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            *-gal jelölt mezők kitöltése kötelező.
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRequestClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-600 dark:hover:bg-neutral-700"
              disabled={savingWhole}
            >
              Mégse
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#b69861] to-[#ec008c] text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowedm text-white bg-[#d4a373] hover:bg-[#c58a4f] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={savingWhole}
            >
              {savingWhole ? "Mentés..." : "Teljes mentés"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCreateModal;
