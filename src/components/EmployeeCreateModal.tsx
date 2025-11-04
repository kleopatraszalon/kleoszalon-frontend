import React, { useEffect, useState } from "react";

// EZ A MODAL NEM A react-modal-os EventDetailsModal.
// Ez a teljes, háromfüles létrehozó modal.

type Location = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  default_duration_min: number | null;
  parent_id: string | null;
};

export interface EmployeeCreateModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSaved?: () => void; // <- fontos! ezt hívjuk sikeres mentésnél
}

const EmployeeCreateModal: React.FC<EmployeeCreateModalProps> = ({
  isOpen,
  onRequestClose,
  onSaved,
}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";

  // aktív fül
  const [activeTab, setActiveTab] = useState<"alap" | "szolg" | "login">("alap");

  // dropdown adatok
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // --- ALAP ADATOK ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [taj, setTaj] = useState("");
  const [taxId, setTaxId] = useState("");
  const [qualification, setQualification] = useState("");
  const [gender, setGender] = useState("");
  const [locationId, setLocationId] = useState("");

  const [workScheduleType, setWorkScheduleType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [monthlyWage, setMonthlyWage] = useState("");
  const [hourlyWage, setHourlyWage] = useState("");

  // --- SZOLGÁLTATÁSOK ---
  // { service_id, custom_duration_min }
  const [serviceAssignments, setServiceAssignments] = useState<
    { service_id: string; custom_duration_min: string }[]
  >([]);

  // --- LOGIN / JOGOSULTSÁG ---
  const [loginName, setLoginName] = useState("");
  const [plainPassword, setPlainPassword] = useState("");
  const [rolesSelected, setRolesSelected] = useState<string[]>([]);
  const [savingWhole, setSavingWhole] = useState(false);

  // státuszüzenetek a login tabhoz (opcionális, ha akarod reuse-olni)
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  const AVAILABLE_ROLES = [
    "admin",
    "recepciós",
    "fodrász",
    "műkörmös",
    "kozmetikus",
    "masszőr",
    "szempilla stylist",
    "sminkes",
    "gyantázás",
    "tetováló",
    "tanonc",
  ];

  // telephelyek + szolgáltatások betöltése modal nyitásakor
  useEffect(() => {
    if (!isOpen) return;

    // reset form minden megnyitáskor
    setActiveTab("alap");
    setFirstName("");
    setLastName("");
    setPhone("");
    setBirthDate("");
    setTaj("");
    setTaxId("");
    setQualification("");
    setGender("");
    setLocationId("");
    setWorkScheduleType("");
    setEmploymentType("");
    setMonthlyWage("");
    setHourlyWage("");

    setServiceAssignments([]);

    setLoginName("");
    setPlainPassword("");
    setRolesSelected([]);
    setLoginError("");
    setLoginSuccess("");
    setSavingWhole(false);

    // betöltjük a telephelyeket
    fetch("http://localhost:5000/api/locations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0) {
            setLocationId((prev) => prev || data[0].id);
          }
        }
      })
      .catch((err) => console.error("Telephelyek betöltése hiba:", err));

    // betöltjük a szolgáltatásokat
    fetch("http://localhost:5000/api/services/available", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data);
        }
      })
      .catch((err) => console.error("Szolgáltatások betöltése hiba:", err));
  }, [isOpen, token]);

  // validálók
  const isValidTaj = (value: string) => /^[0-9]{9}$/.test(value.trim());
  const isValidTaxId = (value: string) =>
    /^[0-9]{8,11}$/.test(value.trim());

  // kötelező mezők ellenőrzése a teljes mentéshez
  const formValid = () => {
    if (!lastName.trim()) return false;
    if (!firstName.trim()) return false;
    if (!phone.trim()) return false;
    if (!birthDate.trim()) return false;
    if (taj && !isValidTaj(taj)) return false;
    if (taxId && !isValidTaxId(taxId)) return false;
    if (!locationId) return false;

    if (!loginName.trim()) return false;
    if (!plainPassword.trim()) return false;

    return true;
  };

  // szolgáltatás pipálás
  const toggleServiceForEmployee = (
    serviceId: string,
    defaultDuration: number | null
  ) => {
    const exists = serviceAssignments.find(
      (a) => a.service_id === serviceId
    );
    if (exists) {
      // kivesszük
      setServiceAssignments((prev) =>
        prev.filter((a) => a.service_id !== serviceId)
      );
    } else {
      // betesszük
      setServiceAssignments((prev) => [
        ...prev,
        {
          service_id: serviceId,
          custom_duration_min: defaultDuration
            ? String(defaultDuration)
            : "",
        },
      ]);
    }
  };

  const updateServiceDuration = (serviceId: string, minutes: string) => {
    setServiceAssignments((prev) =>
      prev.map((a) =>
        a.service_id === serviceId
          ? { ...a, custom_duration_min: minutes }
          : a
      )
    );
  };

  // szerepkör pipálás
  const toggleRole = (role: string) => {
    setRolesSelected((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  // jelszó generálás
  function generatePassword() {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setPlainPassword(out);
    setActiveTab("login"); // ugrassuk a login fülre hogy lássa
    setLoginSuccess("Generált jelszó kitöltve, mentsd el!");
  }

  // TELJES FELVÉTEL MENTÉSE (az egész munkatárs egyszerre)
  const handleSaveAll = async () => {
    if (!token) {
      alert("Nincs token, jelentkezz be újra.");
      return;
    }
    if (!formValid()) {
      alert("Hiányzik kötelező adat vagy hibás mező.");
      return;
    }

    setSavingWhole(true);
    setLoginError("");
    setLoginSuccess("");

    // payload, amit a backend /api/employees POST vár
    const payload = {
      first_name: firstName,
      last_name: lastName,
      full_name: `${lastName} ${firstName}`.trim(),
      phone,
      email: null, // jelenleg nincs külön meződ rá az űrlapon
      birth_date: birthDate,
      location_id: locationId,
      active: true,

      // belépés / jogosultság
      login_name: loginName.trim(),
      plain_password: plainPassword.trim(),
      roles: rolesSelected, // pl ["admin","recepciós"]

      // bérezés, extra mezők
      qualification: qualification || null,
      gender: gender || null,
      taj_number: taj || null,
      tax_id: taxId || null,
      work_schedule_type: workScheduleType || null,
      employment_type: employmentType || null,
      monthly_wage: monthlyWage ? Number(monthlyWage) : null,
      hourly_wage: hourlyWage ? Number(hourlyWage) : null,

      // szolgáltatások hozzárendelése
      services: serviceAssignments.map((a) => ({
        service_id: a.service_id,
        duration_min: a.custom_duration_min
          ? Number(a.custom_duration_min)
          : null,
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Mentés sikertelen:", data);
        alert(
          data?.error ||
            "Hiba történt mentés közben a szerveren. (POST /api/employees)"
        );
        setSavingWhole(false);
        return;
      }

      // siker:
      if (onSaved) {
        onSaved();
      }
      onRequestClose();
    } catch (err) {
      console.error("Hálózati hiba új munkatárs mentésekor:", err);
      alert("Hálózati hiba történt mentés közben.");
      setSavingWhole(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Új munkatárs felvétele
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              A * mezők kötelezők
            </div>
          </div>

          <button
            onClick={onRequestClose}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            ✕ Bezárás
          </button>
        </div>

        {/* TABOK */}
        <div className="flex border-b border-gray-200 dark:border-neutral-700 text-sm font-medium">
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
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Vezetéknév *
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              {/* keresztnév */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Keresztnév *
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              {/* telefon */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Telefonszám *
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+36…"
                />
              </div>

              {/* születési dátum */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Születési dátum (ÉÉÉÉ-HH-NN) *
                </label>
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
                    <span className="text-red-500 ml-2 text-[10px]">
                      Hibás TAJ
                    </span>
                  )}
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={taj}
                  onChange={(e) => setTaj(e.target.value)}
                  placeholder="9 számjegy"
                />
              </div>

              {/* adóazonosító jel */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Adóazonosító jel{" "}
                  {taxId && !isValidTaxId(taxId) && (
                    <span className="text-red-500 ml-2 text-[10px]">
                      Hibás adószám
                    </span>
                  )}
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="adóazonosító"
                />
              </div>

              {/* végzettség */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Végzettség
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="pl. Kozmetikus OKJ"
                />
              </div>

              {/* nem */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Nem
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="female">Nő</option>
                  <option value="male">Férfi</option>
                  <option value="other">Egyéb / nem közölt</option>
                </select>
              </div>

              {/* telephely */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Telephely *
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* munkarend */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Munkarend
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={workScheduleType}
                  onChange={(e) => setWorkScheduleType(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="altalanos">Általános munkarend</option>
                  <option value="2_muszak">2 műszak</option>
                  <option value="1_muszak">1 műszak</option>
                  <option value="rugalmas">Rugalmas munkaidő</option>
                  <option value="4_napos">4 napos munkahét</option>
                  <option value="beosztas_szerinti">
                    Beosztás szerinti munkarend
                  </option>
                  <option value="kotetlen">Kötetlen munkaidő</option>
                </select>
              </div>

              {/* foglalkoztatás jellege */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Foglalkoztatás jellege
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">–</option>
                  <option value="teljes">Teljes munkaidő</option>
                  <option value="reszmunka">Részmunkaidő</option>
                  <option value="alkalmi">Alkalmi munka</option>
                  <option value="megv_munkakep">
                    Megváltozott munkaképességű
                  </option>
                  <option value="gyakorlat">Szakmai gyakorlat</option>
                  <option value="vallalkozo">Vállalkozói</option>
                  <option value="diak">Diákmunka</option>
                  <option value="onkentes">Önkéntes munka</option>
                  <option value="alkalmazotti">Alkalmazotti jogviszony</option>
                  <option value="nyugdij_mellett">
                    Nyugdíj mellett végezhető
                  </option>
                  <option value="kisgyermekes">Kisgyermekeseknek</option>
                </select>
              </div>

              {/* havi bér */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Havi bér (Ft)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(e.target.value)}
                />
              </div>

              {/* órabér */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Órabér (Ft)
                </label>
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
                Pipáld ki, mit vállalhat ez a munkatárs. Adj meg egyedi időt
                (percben), ha nem az alapértelmezett idő alatt dolgozik.
              </p>

              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-900">
                {services.map((srv) => {
                  const checked = serviceAssignments.some(
                    (a) => a.service_id === srv.id
                  );
                  const current = serviceAssignments.find(
                    (a) => a.service_id === srv.id
                  );

                  return (
                    <div
                      key={srv.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-700 py-2"
                    >
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-[3px]"
                          checked={checked}
                          onChange={() =>
                            toggleServiceForEmployee(
                              srv.id,
                              srv.default_duration_min
                            )
                          }
                        />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {srv.name}
                          </div>
                          {srv.parent_id && (
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              (alszolgáltatás)
                            </div>
                          )}
                        </div>
                      </label>

                      {checked && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            Idő (perc):
                          </span>
                          <input
                            type="number"
                            min={1}
                            className="w-20 border border-gray-300 dark:border-neutral-600 rounded-lg p-1 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100"
                            value={current?.custom_duration_min ?? ""}
                            onChange={(e) =>
                              updateServiceDuration(
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
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Bejelentkezési név (felhasználónév / e-mail) *
                </label>
                <input
                  className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="pl. anna.kovacs@szalon.hu"
                />
              </div>

              {/* jelszó + generálás */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Jelszó *
                </label>

                <div className="flex gap-2 flex-wrap">
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

                {loginError && (
                  <div className="text-xs text-red-500 mt-1">
                    {loginError}
                  </div>
                )}
                {loginSuccess && (
                  <div className="text-xs text-green-600 mt-1">
                    {loginSuccess}
                  </div>
                )}

                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  A generált jelszó mentéskor titkosítva kerül az adatbázisba.
                </div>
              </div>

              {/* jogosultságok */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Jogosultsági szint(ek)
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex items-start gap-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg p-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-[2px]"
                        checked={rolesSelected.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      <span className="text-gray-800 dark:text-gray-100">
                        {role}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                  Az „admin” megkapja a teljes hozzáférést. A többiek csak a nekik
                  engedélyezett modulokat látják (pl. recepciós: naptár, pénztár).
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
