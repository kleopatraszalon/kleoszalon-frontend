// src/pages/EmployeeDetails.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
/* ===== Props ===== */
export type EmployeeDetailsProps = {
  employeeId: string;
  onClose: () => void;
};

/* ===== Types ===== */
type UUID = string;
type Json = Record<string, any>;

type Employee = {
  id: UUID | string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  qualification?: string | null;
  monthly_wage?: number | null;
  hourly_wage?: number | null;
  photo_url?: string | null;
  location_id?: UUID | null;
  location_name?: string | null;
  position_name?: string | null;
  notes?: string | null;
  active?: boolean;
  login_name?: string | null;
  role?: string | null;
  roles?: string[] | null;
  color?: string | null;
  extra_json?: Json | null;
};

type ApiError = { error?: string; message?: string };

const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const parseJson = async <T,>(res: Response, fallback: T): Promise<T> => {
  const txt = await res.text();
  try {
    return (txt ? JSON.parse(txt) : {}) as T;
  } catch {
    return fallback;
  }
};

const fmt = (v: any, dash: string = "—") =>
  v === null || v === undefined || v === "" ? dash : String(v);

/* ===== Szerepkörök listája ===== */
const ALL_ROLES = [
  { key: "admin", label: "Admin" },
  { key: "reception", label: "Recepciós" },
  { key: "hairdresser", label: "Fodrász" },
  { key: "nailtech", label: "Műkörmös" },
  { key: "cosmetician", label: "Kozmetikus" },
] as const;

/* ===== Route wrapper (default export) ===== */
const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  if (!id) return <div className="employees-loading">Hiányzó dolgozó ID.</div>;
  return <EmployeeDetailsCard employeeId={id} onClose={() => navigate(-1)} />;
};

export default EmployeeDetailsPage;

/* ===== OverlayShell ===== */
const OverlayShell: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  topActions?: { label: string; onClick: () => void; primary?: boolean }[];
}> = ({ title, subtitle, onClose, children, wide, topActions }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // body scroll tiltás
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  // auto-scale
  useEffect(() => {
    const PAD_V = 20,
      PAD_H = 20;
    const fit = () => {
      const el = cardRef.current;
      if (!el) {
        setScale(1);
        return;
      }
      el.style.transform = "scale(1)";
      const vw = window.innerWidth - PAD_H * 2;
      const vh = window.innerHeight - PAD_V * 2;
      const rect = el.getBoundingClientRect();
      const sx = vw / rect.width;
      const sy = vh / rect.height;
      const s = Math.min(1, sx, sy);
      setScale(s);
      el.style.transformOrigin = "top center";
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  const btn: React.CSSProperties = {
    borderRadius: 0,
    padding: "6px 10px",
    height: 30,
    lineHeight: "18px",
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: "var(--kleo-accent-bg, #8b5cf6)",
    color: "#fff",
    borderColor: "var(--kleo-accent-bg, #8b5cf6)",
  };

  return (
    <div
      className="employees-overlay"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 12,
        overflow: "hidden",
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="employees-list-card"
        style={{
          width: "100%",
          maxWidth: wide ? 1200 : 1000,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          background: "#fff",
          borderRadius: 0,
          boxShadow: "0 18px 50px rgba(0,0,0,.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="employees-header"
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h4
              className="employees-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h4>
            {subtitle && (
              <div
                className="employees-subtitle"
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {!!topActions?.length && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "nowrap",
              }}
            >
              {topActions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.onClick}
                  style={a.primary ? btnPrimary : btn}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="employees-filters" style={{ padding: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ===== Main: részletek ===== */
export const EmployeeDetailsCard: React.FC<EmployeeDetailsProps> = ({
  employeeId,
  onClose,
}) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [showSecurity, setShowSecurity] = useState(false);

  const [form, setForm] = useState<Employee | null>(null);
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

  // dolgozó betöltése
  useEffect(() => {
    if (!employeeId || !token) return;
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const res = await fetch(withBase(`employees/${employeeId}`), {
          headers: { ...authHeaders() },
          credentials: "include",
        });
        if (res.status === 401) {
          localStorage.removeItem("kleo_token");
          localStorage.removeItem("kleo_user");
          navigate("/login");
          return;
        }
        const data = await parseJson<Employee | ApiError>(res, {} as any);
        if (!res.ok)
          throw new Error(
            (data as ApiError)?.error || "Betöltési hiba"
          );
        if (!ignore) {
          const e = data as Employee;
          setEmp(e);
          setForm({ ...e });
          setDirty(false);
        }
      } catch (e: any) {
        if (!ignore)
          setErrMsg(e?.message || "Nem sikerült betölteni a dolgozót.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [employeeId, token, navigate]);

  const openSecurity = () => {
    setShowSecurity(true);
  };

  const onChange = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    setForm((s) => {
      const next = { ...(s as Employee), [key]: value };
      setDirty(true);
      return next;
    });
  };

  const saveAll = async () => {
    if (!form) return;
    setErrMsg("");

    try {
      const res = await fetch(withBase(`employees/${form.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await parseJson<Employee | ApiError>(res, {} as any);
      if (!res.ok)
        throw new Error(
          (data as ApiError)?.error || "Mentési hiba"
        );
      setEmp(data as Employee);
      setForm(data as Employee);
      setDirty(false);
    } catch (e: any) {
      setErrMsg(e?.message || "Nem sikerült menteni.");
    }
  };

  const choosePhoto = () => fileInputRef.current?.click();

  const handlePhotoSelected: React.ChangeEventHandler<
    HTMLInputElement
  > = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    // Előnézet
    const localUrl = URL.createObjectURL(file);
    onChange("photo_url", localUrl);

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(withBase(`employees/${form.id}/photo`), {
        method: "POST",
        headers: { ...authHeaders() }, // browser állítja a Content-Type-ot
        body: fd,
        credentials: "include",
      });
      const data = await parseJson<{ photo_url?: string } & ApiError>(
        res,
        {}
      );
      if (!res.ok)
        throw new Error(
          data?.error || "Fájl feltöltési hiba"
        );
      if (data.photo_url) {
        onChange("photo_url", data.photo_url);
        setDirty(true);
      }
    } catch (err: any) {
      setErrMsg(err?.message || "Kép feltöltése nem sikerült.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="employees-loading">Betöltés…</div>;
  if (errMsg) return <div className="employees-error">{errMsg}</div>;
  if (!emp || !form)
    return <div className="employees-loading">Nincs ilyen dolgozó.</div>;

  if (showSecurity) {
    return (
      <SecurityModal
        employee={emp}
        onClose={() => setShowSecurity(false)}
        onBack={() => setShowSecurity(false)}
        onSaved={(patch) => {
          setEmp((p) => (p ? ({ ...p, ...patch } as Employee) : p));
          setForm((p) => (p ? ({ ...p, ...patch } as Employee) : p));
        }}
      />
    );
  }

  const topActions = [
    { label: "← Vissza", onClick: onClose },
    { label: "Mentés", onClick: saveAll, primary: true },
    { label: "Jogosultságok", onClick: openSecurity },
    { label: "Kilépés", onClick: onClose },
  ] as const;

  return (
    <OverlayShell
      title={form.full_name || "Ismeretlen dolgozó"}
      subtitle={
        form.location_name
          ? `Telephely: ${form.location_name}`
          : "Nincs telephely"
      }
      onClose={onClose}
      topActions={topActions as any}
      wide
    >
      {/* FEJLÉC – Avatar + státusz + login + fotó feltöltése */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 56,
              height: 56,
              borderRadius: 9999,
              overflow: "hidden",
              background: "#f4f4f5",
            }}
          >
            {form.photo_url ? (
              <img
                src={form.photo_url}
                alt={form.full_name || "Dolgozó"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "100%",
                  background: form.color || "#8b5cf6",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {form.full_name?.charAt(0)?.toUpperCase() || "D"}
              </div>
            )}
            {uploading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontSize: 11,
                }}
              >
                Feltöltés…
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {form.full_name}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {fmt(form.position_name)}
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              {form.login_name ? `Login: ${form.login_name}` : "Nincs belépés"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div>
            Állapot:{" "}
            <span
              className="employees-badge"
              style={{
                background: form.active ? "#dcfce7" : "#fee2e2",
                color: form.active ? "#166534" : "#b91c1c",
              }}
            >
              {form.active ? "Aktív" : "Inaktív"}
            </span>
          </div>
          <button
            type="button"
            onClick={choosePhoto}
            className="employees-filter-input"
            style={{
              marginTop: 6,
              padding: "4px 8px",
              height: 30,
              cursor: "pointer",
            }}
          >
            Fotó módosítása…
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handlePhotoSelected}
          />
        </div>
      </div>

      {/* Form mezők */}
      <div
        className="employees-filters-row"
        style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Vezetéknév</label>
            <input
              className="employees-filter-input"
              value={form.last_name || ""}
              onChange={(e) => onChange("last_name", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Keresztnév</label>
            <input
              className="employees-filter-input"
              value={form.first_name || ""}
              onChange={(e) => onChange("first_name", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Email</label>
            <input
              className="employees-filter-input"
              value={form.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Telefon</label>
            <input
              className="employees-filter-input"
              value={form.phone || ""}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Születési dátum</label>
            <input
              type="date"
              className="employees-filter-input"
              value={form.birth_date || ""}
              onChange={(e) => onChange("birth_date", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Végzettség</label>
            <input
              className="employees-filter-input"
              value={form.qualification || ""}
              onChange={(e) => onChange("qualification", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Telephely</label>
            <input
              className="employees-filter-input"
              value={form.location_name || ""}
              onChange={(e) => onChange("location_name", e.target.value)}
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Pozíció</label>
            <input
              className="employees-filter-input"
              value={form.position_name || ""}
              onChange={(e) => onChange("position_name", e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Havi bér</label>
            <input
              type="number"
              className="employees-filter-input"
              value={form.monthly_wage ?? ""}
              onChange={(e) =>
                onChange(
                  "monthly_wage",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Órabér</label>
            <input
              type="number"
              className="employees-filter-input"
              value={form.hourly_wage ?? ""}
              onChange={(e) =>
                onChange(
                  "hourly_wage",
                  e.target.value ? Number(e.target.value) : null
                )
              }
            />
          </div>
          <div className="employees-filter-field">
            <label className="employees-filter-label">Megjegyzés</label>
            <textarea
              className="employees-filter-input"
              rows={4}
              value={form.notes || ""}
              onChange={(e) => onChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      {dirty && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#b45309",
          }}
        >
          Vannak nem mentett módosítások.
        </div>
      )}
    </OverlayShell>
  );
};

/* ===== SecurityModal ===== */
const SecurityModal: React.FC<{
  employee: Employee;
  onClose: () => void;
  onSaved: (patch: Partial<Employee>) => void;
  onBack: () => void;
}> = ({ employee, onClose, onSaved, onBack }) => {
  const [loginName, setLoginName] = useState(employee.login_name || "");
  const [plainPassword, setPlainPassword] = useState("");
  const [active, setActive] = useState<boolean>(employee.active ?? true);
  const [roles, setRoles] = useState<string[]>(
    employee.roles && employee.roles.length
      ? employee.roles
      : employee.role
      ? [employee.role]
      : []
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const toggleRole = (r: string) =>
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );

  const generatePass = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let s = "";
    for (let i = 0; i < 10; i++)
      s += chars[Math.floor(Math.random() * chars.length)];
    setPlainPassword(s);
  };

  const resetPass = () => setPlainPassword("");

  const save = async () => {
    setSaving(true);
    setErr("");
    setOk("");
    const payload: any = {
      login_name: loginName.trim(),
      roles,
      active,
    };
    if (plainPassword.trim()) payload.plain_password = plainPassword.trim();

    const tryOne = async (path: string) => {
      const res = await fetch(withBase(path), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await parseJson<any>(res, {});
      return { res, data };
    };

    try {
      let { res, data } = await tryOne(
        `employees/${employee.id}/credentials`
      );
      if (!res.ok && (res.status === 404 || res.status === 400)) {
        ({ res, data } = await tryOne(`employees/${employee.id}`));
      }
      if (!res.ok) throw new Error(data?.error || "Mentési hiba");
      setOk("Beállítások elmentve.");
      onSaved({
        login_name: loginName.trim(),
        active,
        roles,
        role: roles[0] || undefined,
      });
    } catch (e: any) {
      setErr(e?.message || "Nem sikerült menteni.");
    } finally {
      setSaving(false);
    }
  };

  const topActions = [
    { label: "← Vissza", onClick: onBack },
    { label: saving ? "Mentés…" : "Mentés", onClick: save, primary: true },
    { label: "Kilépés", onClick: onClose },
  ] as const;

  return (
    <OverlayShell
      title="Jogosultságok & belépés"
      subtitle={employee.email || "—"}
      onClose={onClose}
      topActions={topActions as any}
    >
      <div className="employees-filters-row" style={{ gap: 10 }}>
        <div
          className="employees-filter-field"
          style={{ width: "100%" }}
        >
          <span
            className="employees-filter-label"
            style={{ fontSize: 12 }}
          >
            Felhasználó
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                overflow: "hidden",
              }}
            >
              {employee.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt="u"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: "100%",
                    height: "100%",
                    background: employee.color || "#8b5cf6",
                    color: "#fff",
                  }}
                >
                  {employee.full_name?.charAt(0)?.toUpperCase() || "D"}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {employee.full_name}
              </div>
              <div
                style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}
              >
                {employee.position_name || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="employees-filters-row" style={{ gap: 10 }}>
        <div className="employees-filter-field" style={{ flex: 1 }}>
          <label className="employees-filter-label">Felhasználónév</label>
          <input
            className="employees-filter-input"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
          />
        </div>
        <div className="employees-filter-field" style={{ flex: 1 }}>
          <label className="employees-filter-label">Új jelszó</label>
          <input
            className="employees-filter-input"
            value={plainPassword}
            onChange={(e) => setPlainPassword(e.target.value)}
            placeholder="●●●●●●●●●●"
            style={{ height: 30, padding: "4px 8px" }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <button
              type="button"
              className="employees-filter-input"
              style={{ cursor: "pointer", height: 26, fontSize: 11 }}
              onClick={generatePass}
            >
              Jelszó generálása
            </button>
            <button
              type="button"
              className="employees-filter-input"
              style={{ cursor: "pointer", height: 26, fontSize: 11 }}
              onClick={resetPass}
            >
              Törlés
            </button>
          </div>
        </div>
        <div className="employees-filter-field">
          <label className="employees-filter-label">Aktív</label>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
        </div>
      </div>

      <div className="employees-filter-field">
        <label className="employees-filter-label">Szerepkörök</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ALL_ROLES.map((r) => (
            <label
              key={r.key}
              className="employees-badge"
              style={{ cursor: "pointer", borderRadius: 0 }}
            >
              <input
                type="checkbox"
                checked={roles.includes(r.key)}
                onChange={() => toggleRole(r.key)}
                style={{ marginRight: 6 }}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      {err && <div className="employees-error">{err}</div>}
      {ok && <div className="employees-success">{ok}</div>}
    </OverlayShell>
  );
};
