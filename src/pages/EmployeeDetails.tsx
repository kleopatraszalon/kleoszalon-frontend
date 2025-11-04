import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  hourly_rate?: number | null; // a tábládban van ilyen is

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

const EmployeeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("kleo_token");

  const [emp, setEmp] = useState<EmployeeFull | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:5000/api/employees/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded shadow text-center text-red-600 font-semibold">
          {error}
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 underline text-sm"
          >
            Vissza
          </button>
        </div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
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
    <div className="p-4 md:p-6 bg-[#f5f6f7] min-h-screen flex flex-col gap-4">

      {/* Fejléc blokk */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {emp.photo_url && (
            <img
              src={emp.photo_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border border-gray-300"
              style={emp.color ? { borderColor: emp.color } : {}}
            />
          )}
          <div>
            <div className="text-xl font-semibold text-gray-800">{displayName}</div>

            <div className="text-sm text-gray-500">
              {emp.qualification || "—"} • {emp.work_schedule_type || "nincs munkarend megadva"}
            </div>

            <div className="text-xs text-gray-400">
              {emp.location_name
                ? `Telephely: ${emp.location_name}`
                : emp.location_id
                ? `Telephely: ${emp.location_id}`
                : "Telephely nincs megadva"}
            </div>

            {emp.role && (
              <div className="text-xs text-gray-400">
                Szerepkör: {emp.role} {emp.active === false ? "(inaktív)" : ""}
              </div>
            )}

            {emp.created_at && (
              <div className="text-[11px] text-gray-400">
                Rögzítve: {emp.created_at}
              </div>
            )}
          </div>
        </div>

        <button
          className="bg-gray-800 hover:bg-black text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
          onClick={() => navigate(`/employees/${emp.id}/edit`)}
        >
          Szerkesztés
        </button>
      </div>

      {/* Személyes adatok */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h2 className="text-gray-800 font-semibold text-base mb-2">Személyes adatok</h2>
          <div className="text-gray-700 space-y-1">
            <div><span className="text-gray-500 text-xs">Anyja neve:</span> {emp.mother_name || "—"}</div>
            <div><span className="text-gray-500 text-xs">Születési név:</span> {emp.birth_name || "—"}</div>
            <div><span className="text-gray-500 text-xs">Nem:</span> {emp.gender || "—"}</div>
            <div>
              <span className="text-gray-500 text-xs">Születési dátum:</span>{" "}
              {emp.birth_date || "—"}{" "}
              {ageVal !== null ? `(${ageVal} év)` : ""}
            </div>
            <div><span className="text-gray-500 text-xs">Születési hely:</span>{" "}
              {[emp.birth_country, emp.birth_region, emp.birth_city].filter(Boolean).join(", ") || "—"}
            </div>
            <div><span className="text-gray-500 text-xs">Nemzetiség:</span> {emp.nationality || "—"}</div>
          </div>
        </div>

        <div>
          <h2 className="text-gray-800 font-semibold text-base mb-2">Azonosítók</h2>
          <div className="text-gray-700 space-y-1">
            <div><span className="text-gray-500 text-xs">TAJ szám:</span> {emp.taj_number || "—"}</div>
            <div><span className="text-gray-500 text-xs">Adóazonosító jel:</span> {emp.tax_id || "—"}</div>
          </div>

          {emp.bio && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Rövid bemutatkozás
              </h3>
              <div className="text-gray-700 text-sm bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-line">
                {emp.bio}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Foglalkoztatás és bér adatok */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h2 className="text-gray-800 font-semibold text-base mb-2">Foglalkoztatás</h2>
          <div className="text-gray-700 space-y-1">
            <div><span className="text-gray-500 text-xs">Foglalkoztatás jellege:</span> {emp.employment_type || "—"}</div>
            <div><span className="text-gray-500 text-xs">Munkarend:</span> {emp.work_schedule_type || "—"}</div>
            <div><span className="text-gray-500 text-xs">Órabér:</span> {emp.hourly_wage ? emp.hourly_wage + " Ft/óra" : emp.hourly_rate ? emp.hourly_rate + " Ft/óra" : "—"}</div>
            <div><span className="text-gray-500 text-xs">Havibér:</span> {emp.monthly_wage ? emp.monthly_wage + " Ft/hó" : "—"}</div>
          </div>
        </div>

        <div>
          <h2 className="text-gray-800 font-semibold text-base mb-2">Belső megjegyzések</h2>
          <div className="text-gray-700 space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Megjegyzés (belső HR)</div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm whitespace-pre-line min-h-[60px]">
                {emp.notes || "—"}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Vélemény / értékelés</div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm whitespace-pre-line min-h-[60px]">
                {emp.review_notes || "—"}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Alap tulajdonságok</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {Array.isArray(emp.traits)
                  ? emp.traits.map((t: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-gray-100 border text-xs text-gray-700"
                      >
                        {String(t)}
                      </span>
                    ))
                  : emp.traits && typeof emp.traits === "object"
                  ? Object.values(emp.traits).map((t: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-gray-100 border text-xs text-gray-700"
                      >
                        {String(t)}
                      </span>
                    ))
                  : <span className="text-gray-400 text-xs">—</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vissza */}
      <div className="text-center">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 underline text-sm"
        >
          Vissza a listához
        </button>
      </div>
    </div>
  );
};

export default EmployeeDetails;
