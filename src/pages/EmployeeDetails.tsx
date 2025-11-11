import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Home.css";
import withBase from "../utils/apiBase";

type EmployeeFull = {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;

  gender?: string;
  mother_name?: string;
  birth_name?: string;

  birth_date?: string;
  birth_country?: string;
  birth_region?: string;
  birth_city?: string;
  nationality?: string;

  location_id?: string | null;
  location_name?: string | null;

  taj_number?: string;
  tax_id?: string;

  qualification?: string;
  work_schedule_type?: string;
  employment_type?: string;

  hourly_wage?: number | null;
  monthly_wage?: number | null;
  hourly_rate?: number | null;

  notes?: string;
  review_notes?: string;
  traits?: any;

  photo_url?: string;
  bio?: string;
  color?: string;
  role?: string;
  active?: boolean;
  created_at?: string;
};

interface EmployeeDetailsProps {
  employeeId?: string;
  onClose?: () => void;
}

function calcAge(birth_date?: string): number | null {
  if (!birth_date) return null;
  const d = new Date(birth_date);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate());
  if (!hadBirthdayThisYear) age = age - 1;
  return age;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  employeeId,
  onClose,
}) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
 const token =
  localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";

  const [emp, setEmp] = useState<EmployeeFull | null>(null);
  const [error, setError] = useState("");

  // ha modalból jön, akkor a propból vesszük az ID-t, különben az URL-ből
  const id = employeeId ?? routeId;

  useEffect(() => {
    if (!id) return;

    fetch(withBase(`employees/${id}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
   })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setEmp(data);
        } else {
          setError("Nem található a munkatárs vagy nincs jogosultságod.");
        }
      })
      .catch((err) => {
        console.error("Dolgozó betöltési hiba:", err);
        setError("Hiba történt a munkatárs betöltésekor.");
      });
  }, [id, token]);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (error) {
    return (
      <div className="employee-details-card">
        <div className="employee-details-error">{error}</div>
        <div className="employee-details-footer">
          <button onClick={handleBack} className="employee-details-back">
            Vissza
          </button>
        </div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="employee-details-loading">
        Betöltés…
      </div>
    );
  }

  const displayName =
    emp.full_name ||
    `${emp.last_name || ""} ${emp.first_name || ""}`.trim() ||
    "Névtelen";

  const ageVal = calcAge(emp.birth_date);

  return (
    <div className="employee-details-card">
      {/* Fejléc blokk */}
      <div className="employee-details-header">
        <div className="employee-details-header-left">
          {emp.photo_url && (
            <img
              src={emp.photo_url}
              alt={displayName}
              className="employee-details-avatar"
              style={emp.color ? { borderColor: emp.color } : {}}
            />
          )}
          <div>
            <div className="employee-details-name">{displayName}</div>

            <div className="employee-details-mainline">
              {emp.qualification || "—"} •{" "}
              {emp.work_schedule_type || "nincs munkarend megadva"}
            </div>

            <div className="employee-details-subline">
              {emp.location_name
                ? `Telephely: ${emp.location_name}`
                : emp.location_id
                ? `Telephely: ${emp.location_id}`
                : "Telephely nincs megadva"}
            </div>

            {emp.role && (
              <div className="employee-details-subline">
                Szerepkör: {emp.role}{" "}
                {emp.active === false ? "(inaktív)" : ""}
              </div>
            )}

            {emp.created_at && (
              <div className="employee-details-created">
                Rögzítve: {emp.created_at}
              </div>
            )}
          </div>
        </div>

        <div className="employee-details-header-right">
          <button
            className="employee-details-edit-btn"
            onClick={() => navigate(`/employees/${emp.id}/edit`)}
          >
            Szerkesztés
          </button>
        </div>
      </div>

      {/* Tartalom blokkok */}
      <div className="employee-details-body">
        {/* Személyes adatok */}
        <div className="employee-details-section">
          <h2 className="employee-details-section-title">
            Személyes adatok
          </h2>
          <div className="employee-details-section-grid">
            <div className="employee-details-field">
              <span className="employee-details-label">Anyja neve:</span>
              <span>{emp.mother_name || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Születési név:</span>
              <span>{emp.birth_name || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Nem:</span>
              <span>{emp.gender || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Születési dátum:</span>
              <span>
                {emp.birth_date || "—"}{" "}
                {ageVal !== null ? `(${ageVal} év)` : ""}
              </span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Születési hely:</span>
              <span>
                {[
                  emp.birth_country,
                  emp.birth_region,
                  emp.birth_city,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Nemzetiség:</span>
              <span>{emp.nationality || "—"}</span>
            </div>
          </div>
        </div>

        {/* Azonosítók + bemutatkozás */}
        <div className="employee-details-section">
          <h2 className="employee-details-section-title">
            Azonosítók
          </h2>
          <div className="employee-details-section-grid">
            <div className="employee-details-field">
              <span className="employee-details-label">TAJ szám:</span>
              <span>{emp.taj_number || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">
                Adóazonosító jel:
              </span>
              <span>{emp.tax_id || "—"}</span>
            </div>
          </div>

          {emp.bio && (
            <div className="employee-details-subsection">
              <h3 className="employee-details-subtitle">
                Rövid bemutatkozás
              </h3>
              <div className="employee-details-note-box">
                {emp.bio}
              </div>
            </div>
          )}
        </div>

        {/* Foglalkoztatás */}
        <div className="employee-details-section">
          <h2 className="employee-details-section-title">
            Foglalkoztatás
          </h2>
          <div className="employee-details-section-grid">
            <div className="employee-details-field">
              <span className="employee-details-label">
                Foglalkoztatás jellege:
              </span>
              <span>{emp.employment_type || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Munkarend:</span>
              <span>{emp.work_schedule_type || "—"}</span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Órabér:</span>
              <span>
                {emp.hourly_wage
                  ? `${emp.hourly_wage} Ft/óra`
                  : emp.hourly_rate
                  ? `${emp.hourly_rate} Ft/óra`
                  : "—"}
              </span>
            </div>
            <div className="employee-details-field">
              <span className="employee-details-label">Havibér:</span>
              <span>
                {emp.monthly_wage
                  ? `${emp.monthly_wage} Ft/hó`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Belső megjegyzések, értékelés, tulajdonságok */}
        <div className="employee-details-section">
          <h2 className="employee-details-section-title">
            Belső megjegyzések
          </h2>
          <div className="employee-details-notes-grid">
            <div className="employee-details-note-column">
              <div className="employee-details-subtitle">
                Megjegyzés (belső HR)
              </div>
              <div className="employee-details-note-box">
                {emp.notes || "—"}
              </div>
            </div>

            <div className="employee-details-note-column">
              <div className="employee-details-subtitle">
                Vélemény / értékelés
              </div>
              <div className="employee-details-note-box">
                {emp.review_notes || "—"}
              </div>
            </div>
          </div>

          <div className="employee-details-subsection">
            <div className="employee-details-subtitle">
              Alap tulajdonságok
            </div>
            <div className="employee-details-traits">
              {Array.isArray(emp.traits) ? (
                emp.traits.map((t: any, i: number) => (
                  <span key={i} className="employee-details-trait-pill">
                    {String(t)}
                  </span>
                ))
              ) : emp.traits && typeof emp.traits === "object" ? (
                Object.values(emp.traits).map((t: any, i: number) => (
                  <span key={i} className="employee-details-trait-pill">
                    {String(t)}
                  </span>
                ))
              ) : (
                <span className="employee-details-empty">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vissza */}
      <div className="employee-details-footer">
        <button onClick={handleBack} className="employee-details-back">
          Vissza a listához
        </button>
      </div>
    </div>
  );
};

export default EmployeeDetails;
