import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeCreateModal from "../components/EmployeeCreateModal";
import EventDetailsModal from "../components/EventDetailsModal";

type Employee = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  birth_date?: string;
  qualification?: string;
  monthly_wage?: number | null;
  hourly_wage?: number | null;
  photo_url?: string;
  location_id?: string | null;
  location_name?: string | null;
  active?: boolean;
  position_name?: string;
  login_name?: string;
};

type EventType = {
  title?: string;
  start?: string | Date;
  end?: string | Date;
  notes?: string;
};

/** Életkor számítása születési dátumból (YYYY-MM-DD) */
function calcAge(birth_date?: string): number | null {
  if (!birth_date) return null;
  const d = new Date(birth_date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

const EmployeesList: React.FC = () => {
  // összes munkatárs a szervertől
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  // mutassuk-e az inaktívakat is
  const [includeInactive, setIncludeInactive] = useState(false);

  // szűrők
  const [search, setSearch] = useState("");
  const [filterQualification, setFilterQualification] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [minWage, setMinWage] = useState("");

  // modál állapotok
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

  // UI state
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  // ---- Dolgozók betöltése szerverről ----
  const loadEmployees = async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";

    if (!token) {
      setAuthError("Nincs token – jelentkezz be először.");
      setAllEmployees([]);
      return;
    }

    const url = includeInactive ? "/api/employees?include_inactive=1" : "/api/employees";

    try {
      setLoading(true);
      setAuthError("");

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      let data: unknown = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (response.status === 401 || response.status === 403) {
        setAuthError("Nincs jogosultság vagy lejárt a bejelentkezés.");
        setAllEmployees([]);
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP hiba! státusz: ${response.status}`);
      }
      if (!Array.isArray(data)) {
        throw new Error("Nem tömb érkezett /api/employees-ről.");
      }

      setAllEmployees(data as Employee[]);
    } catch (err) {
      console.error("Dolgozók betöltése hiba:", err);
      setAuthError("Dolgozók betöltése nem sikerült. Ellenőrizd a hálózatot vagy a szervert.");
      setAllEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Betöltés induláskor és amikor kapcsolgatjuk az "inaktívakat is" gombot
  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  // ---- Szűrt lista a keresés / feltételek alapján ----
  const filtered = useMemo(() => {
    return allEmployees.filter((emp) => {
      const displayName =
        emp.full_name || `${emp.last_name || ""} ${emp.first_name || ""}`.trim() || "";
      const nameLower = displayName.toLowerCase();
      const qualificationText = (emp.qualification || "").toLowerCase();

      const ageVal = calcAge(emp.birth_date);
      const wageVal = emp.monthly_wage ?? 0;

      // névre keresés
      if (search.trim() && !nameLower.includes(search.trim().toLowerCase())) {
        return false;
      }

      // végzettség
      if (
        filterQualification.trim() &&
        !qualificationText.includes(filterQualification.trim().toLowerCase())
      ) {
        return false;
      }

      // min életkor
      if (minAge && ageVal !== null && ageVal < Number(minAge)) return false;

      // max életkor
      if (maxAge && ageVal !== null && ageVal > Number(maxAge)) return false;

      // min bér
      if (minWage && wageVal < Number(minWage)) return false;

      return true;
    });
  }, [allEmployees, search, filterQualification, minAge, maxAge, minWage]);

  // ---- Dolgozóra kattintás -> megnyitjuk a részletező modált ----
  const handleEmployeeClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSelectedEvent({
      title:
        emp.full_name ||
        `${emp.last_name || ""} ${emp.first_name || ""}`.trim() ||
        String(emp.id),
      notes: JSON.stringify(
        {
          id: emp.id,
          location: emp.location_name ?? emp.location_id ?? "—",
          birth_date: emp.birth_date ?? "—",
          age: calcAge(emp.birth_date) ?? "—",
          qualification: emp.qualification ?? "—",
          monthly_wage: emp.monthly_wage ?? "—",
          position_name: emp.position_name ?? "—",
          login_name: emp.login_name ?? "—",
          active: emp.active ? "aktív" : "inaktív",
        },
        null,
        2
      ),
    });
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 flex flex-col gap-4">
        {/* Fejléc + gombok */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Munkatársak</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dolgozók listája, szűrés és keresés. Kattints egy dolgozóra a részletekhez.
            </p>

            {authError && (
              <p className="mt-2 text-xs text-red-500 font-medium">{authError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
              onClick={() => setShowCreateModal(true)}
            >
              + Új munkatárs felvétele
            </button>

            <button
              className={`text-sm font-medium px-4 py-2 rounded-lg border shadow ${
                includeInactive
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-300 dark:text-neutral-900"
                  : "bg-white border-gray-300 text-gray-700 dark:bg-neutral-800 dark:border-neutral-600 dark:text-gray-200"
              }`}
              onClick={() => setIncludeInactive((prev) => !prev)}
            >
              {includeInactive ? "Csak aktívak mutatása" : "Inaktív dolgozók is"}
            </button>
          </div>
        </div>

        {/* Szűrők */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-4 flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* név kereső */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Keresés névre
              </label>
              <input
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="pl. Kovács Anna"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* végzettség szűrő */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Végzettség
              </label>
              <input
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="pl. Kozmetikus OKJ"
                value={filterQualification}
                onChange={(e) => setFilterQualification(e.target.value)}
              />
            </div>

            {/* min. havi bér */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Min. havibér (Ft)
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="pl. 300000"
                value={minWage}
                onChange={(e) => setMinWage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* min életkor */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Min. életkor
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="pl. 20"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </div>

            {/* max életkor */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Max. életkor
              </label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 dark:border-neutral-600 rounded-lg p-2 bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="pl. 55"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>

            {/* találatszám */}
            <div className="flex items-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} találat</div>
            </div>
          </div>
        </div>

        {/* Lista / betöltés közben spinner */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="w-10 h-10 border-4 border-gray-300 dark:border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Név</th>
                  <th className="px-4 py-2 font-medium">Telephely</th>
                  <th className="px-4 py-2 font-medium">Születési dátum</th>
                  <th className="px-4 py-2 font-medium">Életkor</th>
                  <th className="px-4 py-2 font-medium">Végzettség</th>
                  <th className="px-4 py-2 font-medium">Havibér (Ft)</th>
                  <th className="px-4 py-2 font-medium">Aktív?</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const ageVal = calcAge(emp.birth_date);
                  const displayName =
                    emp.full_name ||
                    `${emp.last_name || ""} ${emp.first_name || ""}`.trim() ||
                    "Névtelen";

                  return (
                    <tr
                      key={String(emp.id)}
                      className="border-t border-gray-200 dark:border-neutral-700 hover:bg-gray-50 hover:dark:bg-neutral-700/30 cursor-pointer"
                      onClick={() => handleEmployeeClick(emp)}
                    >
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100 font-medium flex items-center gap-2">
                        {emp.photo_url && (
                          <img
                            src={emp.photo_url}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-neutral-600"
                          />
                        )}
                        <span className="text-blue-600 dark:text-blue-400 underline">
                          {displayName}
                        </span>
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {emp.location_name ?? emp.location_id ?? "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {emp.birth_date ?? "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {ageVal !== null ? `${ageVal} év` : "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {emp.qualification ?? "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {emp.monthly_wage ? `${emp.monthly_wage} Ft` : "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {emp.active ? "✔ aktív" : "✖ inaktív"}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm"
                      colSpan={7}
                    >
                      Nincs találat a megadott szűrőkre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Új munkatárs felvétele modal */}
      <EmployeeCreateModal
        isOpen={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
        onSaved={() => {
          setShowCreateModal(false);
          loadEmployees();
        }}
      />

      {/* Dolgozó részletei modal */}
      <EventDetailsModal
        isOpen={isDetailsOpen}
        onRequestClose={() => setIsDetailsOpen(false)}
        event={selectedEvent}
        employee={
          selectedEmployee
            ? {
                ...selectedEmployee,
                id: String(selectedEmployee.id),
                // null -> undefined: a modal típusa általában string | undefined
                location_name: selectedEmployee.location_name ?? undefined,
              }
            : undefined
        }
        onEmployeeStatusChanged={({ id, active }) => {
          setAllEmployees((prev) =>
            prev.map((e) => (String(e.id) === id ? { ...e, active } : e))
          );
        }}
        /* Ha a modal támogatja:
        onEmployeeCredentialsChanged={({ id, login_name }) => {
          setAllEmployees(prev =>
            prev.map(e => (String(e.id) === id ? { ...e, login_name } : e))
          );
        }}
        */
      />
    </div>
  );
};

export default EmployeesList;
