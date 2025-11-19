import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeNewModal from "../components/EmployeeNewModal";
import withBase from "../utils/apiBase";
import Modal from "react-modal";
// A kártya komponens NÉV SZERINTI exportja ugyanebből a mappából
import { EmployeeDetailsCard } from "./EmployeeDetails";

Modal.setAppElement("#root");

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

  // Új dolgozó modal
  const [showNewModal, setShowNewModal] = useState(false);

  // Részletek modal (új réteg!)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | number | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");

  // Dolgozók betöltése backendről
  const loadEmployees = async () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("kleo_token") ||
      "";

    if (!token) {
      setAuthError("Nincs token – jelentkezz be először.");
      setAllEmployees([]);
      return;
    }

    const path = includeInactive ? "employees?include_inactive=1" : "employees";

    try {
      setLoading(true);
      setAuthError("");

      const response = await fetch(withBase(path), {
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
        throw new Error("Nem tömb érkezett az /employees végpontról.");
      }

      setAllEmployees(data as Employee[]);
    } catch (err) {
      console.error("Dolgozók betöltése hiba:", err);
      setAuthError(
        "Dolgozók betöltése nem sikerült. Ellenőrizd a hálózatot vagy a szervert."
      );
      setAllEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // induláskor + inaktív kapcsolgatáskor újratöltjük
  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  // Szűrt lista a keresés / feltételek alapján
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

  // Dolgozóra kattintás -> RÉSZLETEK MODAL (nem új oldal!)
  const handleEmployeeClick = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedEmployeeId(null);
  };

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar />

      <main className="calendar-container">
        {/* Fejléc + gombok */}
        <div className="employees-header">
          <div>
            <h2 className="employees-title">Munkatársak</h2>
            <p className="employees-subtitle">
              Dolgozók listája, szűrés és új munkatárs felvétele.
            </p>
            {authError && <div className="employees-error">{authError}</div>}
          </div>

          <div className="employees-header-buttons">
            <button
              type="button"
              className="employees-primary-btn"
              onClick={() => setShowNewModal(true)}
            >
              + Új munkatárs
            </button>

            <button
              type="button"
              className={
                "employees-secondary-btn" +
                (includeInactive ? " employees-secondary-btn--active" : "")
              }
              onClick={() => setIncludeInactive((prev) => !prev)}
            >
              {includeInactive ? "Csak aktívak mutatása" : "Inaktív dolgozók is"}
            </button>
          </div>
        </div>

        {/* Szűrők */}
        <div className="employees-filters">
          <div className="employees-filters-row">
            <div className="employees-filter-field">
              <label className="employees-filter-label">Keresés névre</label>
              <input
                className="employees-filter-input"
                placeholder="pl. Kovács Anna"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">Végzettség</label>
              <input
                className="employees-filter-input"
                placeholder="pl. kozmetikus"
                value={filterQualification}
                onChange={(e) => setFilterQualification(e.target.value)}
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">Min. havibér (Ft)</label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                placeholder="pl. 300000"
                value={minWage}
                onChange={(e) => setMinWage(e.target.value)}
              />
            </div>
          </div>

          <div className="employees-filters-row">
            <div className="employees-filter-field">
              <label className="employees-filter-label">Min. életkor</label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                placeholder="pl. 20"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">Max. életkor</label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                placeholder="pl. 55"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>

            <div className="employees-filter-summary">{filtered.length} találat</div>
          </div>
        </div>

        {/* Lista / betöltés közben */}
        {loading ? (
          <div className="employees-loading">Dolgozók betöltése...</div>
        ) : (
          <div className="employees-list-card">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Név</th>
                  <th>Telephely</th>
                  <th>Születési dátum</th>
                  <th>Életkor</th>
                  <th>Végzettség</th>
                  <th>Havibér (Ft)</th>
                  <th>Aktív?</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const ageVal = calcAge(emp.birth_date);
                  const displayName =
                    emp.full_name || `${emp.last_name || ""} ${emp.first_name || ""}`.trim() || "Névtelen";

                  return (
                    <tr
                      key={String(emp.id)}
                      className="employees-row"
                      onClick={() => handleEmployeeClick(emp)}
                    >
                      <td>
                        <div className="employees-name-cell">
                          {emp.photo_url && (
                            <img
                              src={emp.photo_url}
                              alt={displayName}
                              className="employees-avatar"
                            />
                          )}
                          <span className="employees-name-link">{displayName}</span>
                        </div>
                      </td>
                      <td>{emp.location_name ?? emp.location_id ?? "—"}</td>
                      <td>{emp.birth_date ?? "—"}</td>
                      <td>{ageVal !== null ? `${ageVal} év` : "—"}</td>
                      <td>{emp.qualification ?? "—"}</td>
                      <td>
                        {emp.monthly_wage ? `${emp.monthly_wage.toLocaleString()} Ft` : "—"}
                      </td>
                      <td>
                        {emp.active ? (
                          <span className="employees-badge employees-badge--active">aktív</span>
                        ) : (
                          <span className="employees-badge employees-badge--inactive">inaktív</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="employees-loading">
                      Nincs találat a megadott szűrőkre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Új dolgozó modal (EmployeeNewModal.tsx) */}
        <EmployeeNewModal
          isOpen={showNewModal}
          onRequestClose={() => setShowNewModal(false)}
          onEmployeeCreated={(newEmp) => {
            setShowNewModal(false);
            if (newEmp) {
              setAllEmployees((prev) => [newEmp, ...prev]);
            } else {
              // ha a backend nem küldi vissza az új rekordot, újratöltjük a listát
              loadEmployees();
            }
          }}
        />

      </main>

      {/* 🔍 Munkatárs részletei – Modal */}
      <Modal
        isOpen={detailsOpen}
        onRequestClose={closeDetails}
        contentLabel="Munkatárs részletei"
        style={{
          content: {
            inset: "auto",
            maxWidth: "900px",
            width: "100%",
            margin: "40px auto",
            borderRadius: "16px",
            padding: "0",
            backgroundColor: "transparent",
            border: "none",
          },
          overlay: {
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 50,
          },
        }}
      >
        {selectedEmployeeId && (
          <div className="p-4">
            <EmployeeDetailsCard
              employeeId={String(selectedEmployeeId)}
              onClose={closeDetails}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeesList;
