// src/pages/EmployeeDetails.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import "./Home.css";

/* ===== Props ===== */
export type EmployeeDetailsProps = {
  employeeId: string;
  onClose: () => void;
};

/* ===== Types ===== */
type UUID = string;
type Json = Record<string, any>;
type ApiError = { error?: string; message?: string } | any;

type Employee = {
  id: UUID;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean | null;
  role?: string | null;
  roles?: string[] | null;
  color?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  login_name?: string | null;

  location_id?: UUID | null;
  location_name?: string | null;

  mother_name?: string | null;
  birth_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  birth_country?: string | null;
  birth_region?: string | null;
  birth_city?: string | null;
  nationality?: string | null;

  taj_number?: string | null;
  tax_id?: string | null;

  qualification?: string | null;
  work_schedule_type?: string | null;
  employment_type?: string | null;
  hourly_rate?: number | null;
  hourly_wage?: number | null;
  monthly_wage?: number | null;

  notes?: string | null;
  review_notes?: string | null;
  traits?: Json | null;
};

/* ===== Utils ===== */
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
  try { return (txt ? JSON.parse(txt) : {}) as T; } catch { return fallback; }
};

const fmt = (v: any, dash: string = "—") =>
  v === null || v === undefined || v === "" ? dash : String(v);

/* ===== Small UI ===== */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="employees-filter-field" style={{minWidth:0}}>
    <div className="employees-filter-label" style={{fontSize:12, lineHeight:1.1}}>{label}</div>
    <div className="employee-details-value" style={{fontSize:13, lineHeight:1.15}}>{value}</div>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; }> = ({ label, value, onChange, type="text" }) => (
  <label className="employees-filter-field" style={{width:"100%", minWidth:0}}>
    <span className="employees-filter-label" style={{fontSize:12}}>{label}</span>
    <input
      className="employees-filter-input"
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      style={{height:30, padding:"4px 8px"}}
    />
  </label>
);

const TextArea: React.FC<{ label: string; value: string; onChange: (v: string) => void; rows?: number; }> = ({ label, value, onChange, rows=3 }) => (
  <label className="employees-filter-field" style={{width:"100%", minWidth:0}}>
    <span className="employees-filter-label" style={{fontSize:12}}>{label}</span>
    <textarea
      className="employees-filter-input"
      rows={rows}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      style={{padding:"4px 8px"}}
    />
  </label>
);

const ALL_ROLES = [
  { key: "admin",       label: "Admin" },
  { key: "reception",   label: "Recepciós" },
  { key: "hairdresser", label: "Fodrász" },
  { key: "nailtech",    label: "Műkörmös" },
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

/* ===== OverlayShell — felül kicsi, szögletes gombsor; scroll NINCS (auto-scale) ===== */
const OverlayShell: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  topActions?: { label: string; onClick: () => void; primary?: boolean }[];
}> = ({ title, subtitle, onClose, children, wide, topActions }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevBody; document.documentElement.style.overflow = prevHtml; };
  }, []);

  useEffect(() => {
    const PAD_V = 20, PAD_H = 20;
    const fit = () => {
      const el = cardRef.current;
      if (!el) { setScale(1); return; }
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
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  const btn: React.CSSProperties = {
    borderRadius: 0,
    padding: "6px 10px",
    height: 30,
    lineHeight: "18px",
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#f3f3f3",
    color: "#111",
    cursor: "pointer",
    whiteSpace: "nowrap"
  };
  const btnPrimary: React.CSSProperties = { ...btn, background: "var(--kleo-accent-bg, #d7b46a)" };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      style={{ background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:12, overflow:"hidden" }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="employees-list-card"
        style={{ width:"100%", maxWidth: wide ? 1200 : 1000, transform:`scale(${scale})`, overflow:"visible", borderRadius:10, boxShadow:"0 18px 50px rgba(0,0,0,.25)", background:"#fff" }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div className="employees-header" style={{borderBottom:"1px solid rgba(0,0,0,0.06)", padding:"10px 12px", display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center"}}>
          <div style={{minWidth:0}}>
            <h4 className="employees-title" style={{margin:0, fontSize:18, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{title}</h4>
            {subtitle && <div className="employees-subtitle" style={{fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{subtitle}</div>}
          </div>
          {!!topActions?.length && (
            <div style={{display:"flex", gap:8, alignItems:"center", justifyContent:"flex-end", flexWrap:"nowrap"}}>
              {topActions.map((a, i) => (
                <button key={i} onClick={a.onClick} style={a.primary ? btnPrimary : btn}>{a.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="employees-filters" style={{ padding:12 }}>{children}</div>
      </div>
    </div>
  );
};

/* ===== Main: részletek = szerkesztés (beépített mentés + fotófeltöltés) ===== */
export const EmployeeDetailsCard: React.FC<EmployeeDetailsProps> = ({ employeeId, onClose }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [showSecurity, setShowSecurity] = useState(false);

  const [form, setForm] = useState<Employee | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = useMemo(getToken, []);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (!employeeId) return;

    let ignore = false;
    const run = async () => {
      setLoading(true); setErrMsg("");
      try {
        const res = await fetch(withBase(`employees/${employeeId}`), {
          headers: { ...authHeaders() }, credentials: "include",
        });
        if (res.status === 401) {
          localStorage.removeItem("kleo_token");
          localStorage.removeItem("kleo_user");
          navigate("/login"); return;
        }
        const data = await parseJson<Employee | ApiError>(res, {} as any);
        if (!res.ok) throw new Error((data as ApiError)?.error || "Betöltési hiba");
        if (!ignore) {
          const e = data as Employee;
          setEmp(e);
          setForm({ ...e });
          setDirty(false);
        }
      } catch (e: any) {
        if (!ignore) setErrMsg(e?.message || "Nem sikerült betölteni a dolgozót.");
      } finally { if (!ignore) setLoading(false); }
    };
    run();
    return () => { ignore = true; };
  }, [employeeId, token, navigate]);

  const displayRoles = useMemo(() => {
    if (!emp) return [];
    if (Array.isArray(emp.roles) && emp.roles.length) return emp.roles;
    if (emp.role) return [emp.role];
    return [];
  }, [emp]);

  const openSecurity = () => { setShowSecurity(true); };

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
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await parseJson<Employee | ApiError>(res, {} as any);
      if (!res.ok) throw new Error((data as ApiError)?.error || "Mentési hiba");
      setEmp(data as Employee);
      setForm(data as Employee);
      setDirty(false);
    } catch (e: any) {
      setErrMsg(e?.message || "Nem sikerült menteni.");
    }
  };

  const choosePhoto = () => fileInputRef.current?.click();

  const handlePhotoSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    // Előnézet
    const localUrl = URL.createObjectURL(file);
    onChange("photo_url", localUrl);

    // Feltöltés backendre (szerver írhat az assets/employees_photo mappába)
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(withBase(`employees/${form.id}/photo`), {
        method: "POST",
        headers: { ...authHeaders() }, // NINCS Content-Type: browser állítja
        body: fd,
        credentials: "include",
      });
      const data = await parseJson<{ photo_url?: string } & ApiError>(res, {});
      if (!res.ok) throw new Error(data?.error || "Fájl feltöltési hiba");
      if (data.photo_url) {
        onChange("photo_url", data.photo_url); // végleges URL a szervertől
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
  if (!emp || !form) return <div className="employees-loading">Nincs ilyen dolgozó.</div>;

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
      title={form.full_name}
      subtitle={form.location_name ? `Telephely: ${form.location_name}` : "Nincs telephely"}
      onClose={onClose}
      topActions={topActions as any}
      wide
    >
      {/* FEJLÉC – Avatar + státusz + login + fotó feltöltése */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
        <div style={{display:"flex", alignItems:"center", gap:12, minWidth:0}}>
          <div style={{ position:"relative", width:56, height:56, borderRadius:9999, overflow:"hidden", background:"#f4f4f5" }}>
            {form.photo_url
              ? <img src={form.photo_url} alt={form.full_name} style={{width:"100%", height:"100%", objectFit:"cover"}} />
              : <div style={{display:"grid",placeItems:"center",width:"100%",height:"100%", background: form.color || "#8b5cf6", color:"#fff", fontWeight:700}}>
                  {form.full_name?.charAt(0)?.toUpperCase() || "D"}
                </div>
            }
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
            {form.active ? (
              <span className="employees-badge employees-badge--active">aktív</span>
            ) : (
              <span className="employees-badge employees-badge--inactive">inaktív</span>
            )}
            {form.login_name && <span className="employees-badge">login: {form.login_name}</span>}
          </div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{display:"none"}} />
          <button className="employees-secondary-btn" style={{borderRadius:0, height:30, padding:"6px 10px"}} onClick={choosePhoto} disabled={uploading}>
            {uploading ? "Feltöltés…" : "Kép feltöltése"}
          </button>
        </div>
      </div>

      {/* KÉT OSZLOP – sűrítve, hogy scroll nélkül beférjen */}
      <div style={{ display:"grid", gridTemplateColumns:"1.15fr 1fr", columnGap:12, rowGap:12 }}>
        {/* BAL blokk */}
        <div style={{display:"grid", gap:12}}>
          <Section title="Kapcsolat">
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="E-mail" value={form.email ?? ""} onChange={(v)=>onChange("email", v)} />
              <Field label="Telefon" value={form.phone ?? ""} onChange={(v)=>onChange("phone", v)} />
            </div>
          </Section>

          <Section title="Személyes adatok">
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Anyja neve" value={form.mother_name ?? ""} onChange={(v)=>onChange("mother_name", v)} />
              <Field label="Születési név" value={form.birth_name ?? ""} onChange={(v)=>onChange("birth_name", v)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Nem" value={form.gender ?? ""} onChange={(v)=>onChange("gender", v)} />
              <Field label="Születési dátum" type="date" value={form.birth_date ?? ""} onChange={(v)=>onChange("birth_date", v)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Születési ország" value={form.birth_country ?? ""} onChange={(v)=>onChange("birth_country", v)} />
              <Field label="Megye / Régió" value={form.birth_region ?? ""} onChange={(v)=>onChange("birth_region", v)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Város" value={form.birth_city ?? ""} onChange={(v)=>onChange("birth_city", v)} />
              <Field label="Nemzetiség" value={form.nationality ?? ""} onChange={(v)=>onChange("nationality", v)} />
            </div>
          </Section>

          <Section title="Azonosítók">
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="TAJ szám" value={form.taj_number ?? ""} onChange={(v)=>onChange("taj_number", v)} />
              <Field label="Adóazonosító jel" value={form.tax_id ?? ""} onChange={(v)=>onChange("tax_id", v)} />
            </div>
          </Section>
        </div>

        {/* JOBB blokk */}
        <div style={{display:"grid", gap:12}}>
          <Section title="Foglalkoztatás">
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Foglalkoztatás jellege" value={form.employment_type ?? ""} onChange={(v)=>onChange("employment_type", v)} />
              <Field label="Munkarend" value={form.work_schedule_type ?? ""} onChange={(v)=>onChange("work_schedule_type", v)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Órabér" value={String(form.hourly_wage ?? form.hourly_rate ?? "")} onChange={(v)=>onChange("hourly_wage", v ? Number(v) : null)} />
              <Field label="Havibér" value={String(form.monthly_wage ?? "")} onChange={(v)=>onChange("monthly_wage", v ? Number(v) : null)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Végzettség" value={form.qualification ?? ""} onChange={(v)=>onChange("qualification", v)} />
              <label className="employees-filter-field" style={{display:"flex",alignItems:"center",gap:6}}>
                <span className="employees-filter-label" style={{fontSize:12}}>Aktív</span>
                <input type="checkbox" checked={!!form.active} onChange={(e)=>onChange("active", e.target.checked)} />
              </label>
            </div>
          </Section>

          <Section title="Belső megjegyzések">
            <div className="employees-filters-row" style={{gap:10}}>
              <TextArea label="Megjegyzés (belső HR)" value={form.notes ?? ""} onChange={(v)=>onChange("notes", v)} />
              <TextArea label="Vélemény / értékelés" value={form.review_notes ?? ""} onChange={(v)=>onChange("review_notes", v)} />
            </div>
          </Section>

          <Section title="Alap tulajdonságok">
            <div className="employees-filters-row" style={{gap:10}}>
              <Field label="Szín (hex)" value={form.color ?? ""} onChange={(v)=>onChange("color", v)} />
              <Field label="Login név" value={form.login_name ?? ""} onChange={(v)=>onChange("login_name", v)} />
            </div>
            <div className="employees-filters-row" style={{gap:10}}>
              <TextArea label="Bio" value={form.bio ?? ""} onChange={(v)=>onChange("bio", v)} />
              <label className="employees-filter-field" style={{width:"100%"}}>
                <span className="employees-filter-label" style={{fontSize:12}}>Szerepkörök (csak olvasható)</span>
                <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
                  {(displayRoles.length ? displayRoles : ["—"]).map((r, i) => <span key={i} className="employees-badge" style={{borderRadius:0}}>{r}</span>)}
                </div>
              </label>
            </div>
          </Section>
        </div>
      </div>

      {dirty && <div className="employees-filter-summary" style={{marginTop:6}}>Vannak el nem mentett módosítások.</div>}
      {errMsg && <div className="employees-error" style={{marginTop:6}}>{errMsg}</div>}
    </OverlayShell>
  );
};

/* ===== Section helpers ===== */
const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="employee-details-section" style={{padding:10, borderRadius:8}}>
    <div className="employee-details-section-title" style={{fontSize:14, marginBottom:6}}>{title}</div>
    {children}
  </div>
);

/* ===== Security Modal (külön overlay, a részletek ilyenkor eltűnnek) ===== */
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
    employee.roles && employee.roles.length ? employee.roles : (employee.role ? [employee.role] : [])
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const generatePass = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let s = ""; for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setPlainPassword(s);
  };

  const save = async () => {
    setSaving(true); setErr(""); setOk("");
    const payload: any = { login_name: loginName.trim(), roles, active };
    if (plainPassword.trim()) payload.plain_password = plainPassword.trim();

    const tryOne = async (path: string) => {
      const res = await fetch(withBase(path), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await parseJson<any>(res, {});
      return { res, data };
    };

    try {
      let { res, data } = await tryOne(`employees/${employee.id}/credentials`);
      if (!res.ok && (res.status === 404 || res.status === 400)) ({ res, data } = await tryOne(`employees/${employee.id}`));
      if (!res.ok) throw new Error(data?.error || "Mentési hiba");
      setOk("Beállítások elmentve.");
      onSaved({ login_name: loginName.trim(), active, roles, role: roles[0] || undefined });
    } catch (e: any) {
      setErr(e?.message || "Nem sikerült menteni.");
    } finally { setSaving(false); }
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
      <div className="employees-filters-row" style={{gap:10}}>
        <div className="employees-filter-field" style={{width: "100%"}}>
          <span className="employees-filter-label" style={{fontSize:12}}>Felhasználó</span>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:40,height:40,borderRadius:9999,overflow:"hidden"}}>
              {employee.photo_url
                ? <img src={employee.photo_url} alt="u" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <div style={{display:"grid",placeItems:"center",width:"100%",height:"100%", background: employee.color || "#8b5cf6", color:"#fff"}}>
                    {(employee.full_name || "D").charAt(0).toUpperCase()}
                  </div>
              }
            </div>
            <div className="employee-details-value" style={{fontWeight:600, fontSize:13}}>{employee.full_name}</div>
            {active ? (
              <span className="employees-badge employees-badge--active">aktív</span>
            ) : (
              <span className="employees-badge employees-badge--inactive">inaktív</span>
            )}
          </div>
        </div>

        <label className="employees-filter-field" style={{display:"flex",alignItems:"center",gap:6}}>
          <span className="employees-filter-label" style={{fontSize:12}}>Aktív</span>
          <input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} />
        </label>
      </div>

      <div className="employees-filters-row" style={{gap:10}}>
        <Field label="Login név" value={loginName} onChange={setLoginName} />
        <label className="employees-filter-field" style={{width:"100%"}}>
          <span className="employees-filter-label" style={{fontSize:12}}>Új jelszó (opcionális)</span>
          <div style={{display:"flex", gap:6}}>
            <input className="employees-filter-input" value={plainPassword} onChange={(e) => setPlainPassword(e.target.value)} placeholder="●●●●●●●●●●" style={{height:30, padding:"4px 8px"}}/>
            <button type="button" onClick={generatePass} className="employees-secondary-btn" style={{borderRadius:0, height:30, padding:"6px 10px"}}>Generál</button>
          </div>
          <div className="employees-filter-summary" style={{fontSize:11}}>Csak akkor küldjük a szervernek, ha kitöltöd.</div>
        </label>
      </div>

      <div className="employees-filter-field" style={{width:"100%"}}>
        <div className="employees-filter-label" style={{fontSize:12}}>Szerepkörök</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
          {ALL_ROLES.map((r) => (
            <label key={r.key} className="employees-badge" style={{cursor:"pointer", borderRadius:0}}>
              <input type="checkbox" checked={roles.includes(r.key)} onChange={()=>toggleRole(r.key)} style={{marginRight:6}} />
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
