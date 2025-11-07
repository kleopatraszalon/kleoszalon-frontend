// src/pages/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";

/* ---- Típusok ---- */
type LoginStepResp = { success?: boolean; step: "code_required"; message?: string };
type LoginTokenResp = { success?: boolean; token: string; role?: string; location_id?: string | number | null };
type LoginErrorResp = { success?: boolean; error: string };
type LoginResp = LoginStepResp | LoginTokenResp | LoginErrorResp | any;
type LocationOpt = { id: string | number; name: string };

const isLoginStep  = (x: any): x is LoginStepResp  => x && x.step === "code_required";
const hasToken     = (x: any): x is LoginTokenResp => x && typeof x.token === "string";
const isErrorResp  = (x: any): x is LoginErrorResp => x && typeof x.error === "string";

/* ---- segédek ---- */
async function readBody(res: Response): Promise<{ json: any | null; raw: string }> {
  const txt = await res.text();
  try { return { json: JSON.parse(txt), raw: txt }; } catch { return { json: null, raw: txt }; }
}

/** Általános fetch + 404/HTML fallback -> /api/auth/... */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: HeadersInit = { Accept: "application/json", ...(init?.headers || {}) };
  const tryFetch = (p: string) => fetch(withBase(p), { ...init, headers, cache: "no-store" });

  let res = await tryFetch(path);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let looksHtml = ct.includes("text/html");
  if (!looksHtml) {
    try {
      const peek = await res.clone().text();
      looksHtml = /^\s*<!doctype\s+html/i.test(peek);
    } catch {}
  }

  if ((res.status === 404 || looksHtml) && path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
    const alt = path.replace(/^\/api\//, "/api/auth/");
    const retry = await tryFetch(alt);
    if (retry.ok || retry.status !== 404) return retry;
  }
  return res;
}

/** 🔑 Token kinyerése JSON-ból vagy headerekből */
function extractToken(res: Response, json: any): string | null {
  const pick = (v: any) => (typeof v === "string" ? v : null);
  let t =
    pick(json?.token) ||
    pick(json?.jwt) ||
    pick(json?.access_token) ||
    pick(json?.data?.token) ||
    pick(json?.result?.token) ||
    null;

  if (t && /^Bearer\s+/i.test(t)) t = t.replace(/^Bearer\s+/i, "");
  if (t && t.length > 10) return t;

  const hdr = res.headers.get("authorization") || res.headers.get("x-auth-token");
  if (hdr && /^Bearer\s+/i.test(hdr)) return hdr.replace(/^Bearer\s+/i, "");
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const HOME_PATH = "/";

  const [tab, setTab] = useState<"customer" | "employee">("customer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "code">("login");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Telephelyek
  const [locs, setLocs] = useState<LocationOpt[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");

  const isMobile = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 480px)").matches : false),
    []
  );

  // ha már van token → home
  useEffect(() => {
    try {
      const t = localStorage.getItem("kleo_token") || localStorage.getItem("token");
      if (t) navigate(HOME_PATH, { replace: true });
    } catch {}
  }, [navigate, step, code]);

  // Kód sheet: háttér scroll tilt
  useEffect(() => {
    if (step === "code") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [step]);

  // --- Telephelyek lekérése (több végpont + védett JSON ellenőrzés) ---
  const fetchLocations = async () => {
    setLocLoading(true); setLocError("");
    try {
      const candidates = [
        "/api/locations?active=1",
        "/api/public/locations?active=1",
        "/api/locations",
        "/api/public/locations",
      ];
      let res: Response | null = null;
      let body: { json: any | null; raw: string } | null = null;

      for (const url of candidates) {
        res = await apiFetch(url);
        body = await readBody(res);
        if (res.ok && (Array.isArray(body.json) || Array.isArray(body.json?.data))) break;
      }

      if (!res || !res.ok) {
        setLocError(`Hiba (HTTP ${res?.status ?? 0}) a telephely lekérésnél.`);
        setLocs([]); return;
      }

      const arr = Array.isArray(body!.json) ? body!.json : (Array.isArray(body!.json?.data) ? body!.json.data : []);
      if (!Array.isArray(arr)) {
        console.warn("Telephely válasz nem tömb:", body);
        setLocError("A kiszolgáló váratlan választ adott.");
        setLocs([]); return;
      }

      const options: LocationOpt[] = arr
        .map((r: any) => ({ id: r.id ?? r.location_id ?? "", name: r.name ?? r.location_name ?? "" }))
        .filter((x) => x.id && x.name);

      setLocs(options);
      if (options.length && !locationId) setLocationId(String(options[0].id));
    } catch (e) {
      console.error("Telephely fetch error:", e);
      setLocError("Telephelyek betöltése sikertelen.");
      setLocs([]);
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "customer") fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function persistAuth({ token, role, location_id }:
    { token: string; role?: string; location_id?: string | number | null }) {
    try {
      const t = String(token);
      localStorage.setItem("kleo_token", t);
      localStorage.setItem("token", t);
      if (role) localStorage.setItem("kleo_role", role);
      const loc =
        tab === "customer"
          ? locationId || (location_id != null ? String(location_id) : "")
          : location_id != null ? String(location_id) : "";
      if (loc) localStorage.setItem("kleo_location_id", loc);
    } catch {}
  }

  function goHome() {
    setStep("login"); setCode(""); setMsg(""); setErr("");
    try { navigate(HOME_PATH, { replace: true }); } catch {}
    try { window.history.pushState({}, "", HOME_PATH); } catch {}
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== HOME_PATH) {
        window.location.assign(HOME_PATH);
      }
    }, 50);
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      const uname = username.trim();
      const payload = {
        mode: tab,
        email: uname,
        login_name: uname,
        password,
        location_id: tab === "customer" ? (locationId || null) : null,
      };

      let res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // ha HTML/404 jött, auth fallback már az apiFetch-ben megtörtént

      const { json, raw } = await readBody(res);
      if (!res.ok) {
        if (json && isErrorResp(json)) setErr(json.error || "Sikertelen belépés");
        else setErr(`HTTP ${res.status} – váratlan szerver válasz: ${raw?.slice(0, 120) || res.statusText}`);
        return;
      }

      const data: LoginResp = json ?? {};
      if (isLoginStep(data)) {
        setMsg(data.message || "A belépési kódot elküldtük.");
        setCode(""); setStep("code");
      } else {
        const tok = extractToken(res, data);
        if (tok) { persistAuth({ token: tok, role: data?.role, location_id: data?.location_id ?? null }); goHome(); }
        else if (hasToken(data)) { persistAuth({ token: data.token, role: data.role, location_id: data.location_id ?? null }); goHome(); }
        else if (isErrorResp(data)) setErr(data.error || "Sikertelen belépés");
        else setErr("Ismeretlen válasz a szervertől.");
      }
    } catch {
      setErr("Hálózati hiba");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    const c = String(code).trim();
    if (!/^\d{6}$/.test(c)) { setLoading(false); setErr("6 számjegyű kód szükséges"); return; }
    try {
      const uname = username.trim();
      const payload = {
        email: uname.toLowerCase(),
        login_name: uname,
        mode: tab,
        location_id: tab === "customer" ? (locationId || null) : null,
        code: c,
      };

      const res = await apiFetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { json, raw } = await readBody(res);
      if (!res.ok) {
        if (json && isErrorResp(json)) setErr(json.error || "Érvénytelen kód");
        else setErr(`HTTP ${res.status} – váratlan szerver válasz: ${raw?.slice(0, 120) || res.statusText}`);
        return;
      }

      const tok = extractToken(res, json) || json?.token;
      if (tok) { persistAuth({ token: tok, role: json?.role, location_id: json?.location_id ?? null }); goHome(); }
      else if (hasToken(json)) { persistAuth({ token: json.token, role: json.role, location_id: json.location_id ?? null }); goHome(); }
      else if (isErrorResp(json)) setErr(json.error || "Érvénytelen kód");
      else setErr("Sikeres ellenőrzés, de hiányzik a token a válaszból.");
    } catch {
      setErr("Hálózati hiba");
    } finally {
      setLoading(false);
    }
  };

  const disableSubmit =
    loading ||
    (tab === "customer" && (!locationId || locs.length === 0));

  return (
    <div className="kleo-login">
      {/* scoped CSS – szebb gombok, tabok, fókusz */}
      <style>{`
        .kleo-login { min-height: 100vh; width:100%; display:grid; place-items:center; background:#fbf4ed; padding:${isMobile ? "12px" : "32px"}; }
        .kleo-card { width:100%; max-width:560px; border-radius:18px; padding:${isMobile ? "16px" : "28px"};
          background-image: linear-gradient(rgba(255,255,255,.95), rgba(255,255,255,.95)), url(${bg});
          background-size:cover; background-position:center; box-shadow:0 24px 60px rgba(0,0,0,.18); }
        .kleo-logo { height:${isMobile ? "66px" : "80px"}; }
        .tabs { display:flex; gap:0; margin-bottom:16px; }
        .tab-btn { flex:1; text-align:center; padding:${isMobile ? "12px 6px" : "12px 8px"}; font-weight:700; cursor:pointer;
          border:none; background:transparent; border-bottom:3px solid transparent; color:#777; transition:all .2s; }
        .tab-btn.active { border-bottom-color:#d9a77d; color:#2d2d2d; }
        .label { display:block; font-size:13px; margin-bottom:6px; color:#4b5563; }
        .input, .select { width:100%; padding:${isMobile ? "14px 16px" : "12px 14px"}; border-radius:12px; border:1px solid #e5e7eb;
          background:#edf4ff; font-size:${isMobile ? "16px" : "15px"}; outline:none; transition:border-color .2s, box-shadow .2s; }
        .input:focus, .select:focus { border-color:#c89d73; box-shadow:0 0 0 3px rgba(200,157,115,.25); background:#fff; }
        .btn-primary { width:100%; padding:${isMobile ? "14px 18px" : "12px 16px"}; border:none; border-radius:12px;
          background:linear-gradient(180deg,#d7b08a,#c89d73); color:#fff; font-size:${isMobile ? "17px" : "16px"}; font-weight:700; cursor:pointer;
          box-shadow:0 8px 18px rgba(200,157,115,.35); transition:transform .05s ease, filter .2s ease, box-shadow .2s;}
        .btn-primary:hover { filter:brightness(1.05); box-shadow:0 10px 22px rgba(200,157,115,.4);}
        .btn-primary:active { transform:translateY(1px); }
        .btn-primary:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
        .linkbtn { background:transparent; border:none; color:#916941; text-decoration:underline; cursor:pointer; padding:8px; font-size:14px; }
        /* OTP SHEET */
        .sheet { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:${isMobile ? "flex-end" : "center"};
          justify-content:center; padding:${isMobile ? "0" : "16px"}; z-index:50; }
        .sheet-card { width:100%; max-width:${isMobile ? "100%" : "420px"}; border-radius:${isMobile ? "16px 16px 0 0" : "16px"};
          background:#fff; box-shadow:0 24px 60px rgba(0,0,0,.25); padding:${isMobile ? "16px" : "20px"}; }
        .otp { text-align:center; letter-spacing:4px; font-weight:700; font-size:${isMobile ? "22px" : "20px"}; }
        .grab { width:40px; height:4px; border-radius:999px; background:#ddd; margin:6px auto 12px; ${isMobile ? "display:block" : "display:none"} }
        .error { color:crimson; font-size:13px; margin-top:8px; }
      `}</style>

      <div className="kleo-card">
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <img src={logo} alt="KLEOPÁTRA SZÉPSÉGSZALONOK" className="kleo-logo" />
          <h1 style={{ margin: "12px 0 0 0", fontSize: isMobile ? 24 : 28 }}>Kleoszalon Belépés</h1>
        </div>

        <div className="tabs">
          <button type="button" className={`tab-btn ${tab === "customer" ? "active" : ""}`} onClick={() => { setTab("customer"); setStep("login"); }}>
            Ügyfél belépés
          </button>
          <button type="button" className={`tab-btn ${tab === "employee" ? "active" : ""}`} onClick={() => { setTab("employee"); setStep("login"); }}>
            Munkatársi belépés
          </button>
        </div>

        {step === "login" && (
          <form onSubmit={handleLogin}>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span className="label">{tab === "employee" ? "Felhasználónév" : "E-mail vagy felhasználónév"}</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={tab === "employee" ? "pl. admin" : "pl. you@example.com vagy admin"}
                className="input"
                autoComplete="username"
              />
            </label>

            <label style={{ display: "block", marginBottom: 10 }}>
              <span className="label">Jelszó</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
              />
            </label>

            {tab === "customer" && (
              <div style={{ marginBottom: 10 }}>
                <label className="label">Telephely</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    disabled={locLoading}
                    className="select"
                  >
                    {locLoading && <option>Telephelyek betöltése…</option>}
                    {!locLoading && locs.length === 0 && <option value="">Nem érhető el telephely</option>}
                    {!locLoading && locs.map((l) => (
                      <option key={String(l.id)} value={String(l.id)}>{l.name}</option>
                    ))}
                  </select>
                  <button type="button" className="linkbtn" onClick={fetchLocations}>
                    Újratöltés
                  </button>
                </div>
                {locError && <div className="error">{locError}</div>}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0 8px 0" }}>
              <span />
              <button type="button" className="linkbtn" onClick={() => navigate("/forgot-password")}>
                Elfelejtett jelszó?
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={disableSubmit}>
              {loading ? "Belépés…" : "Belépés"}
            </button>

            {err && <p className="error" style={{ marginTop: 10 }} aria-live="polite">{err}</p>}
          </form>
        )}
      </div>

      {/* ===== OTP SHEET ===== */}
      {step === "code" && (
        <div className="sheet" aria-hidden={step !== "code"}>
          <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Belépési kód ellenőrzése">
            <div className="grab" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20 }}>Kód megadása</h2>
              <button
                aria-label="Bezárás"
                onClick={() => { setStep("login"); setCode(""); setMsg(""); setErr(""); }}
                className="linkbtn"
                style={{ textDecoration: "none", fontSize: 22, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <p style={{ marginTop: 0, marginBottom: 12, color: "#555", fontSize: 14 }}>
              Küldtünk egy 6 számjegyű kódot. Írd be alább. {msg && <span style={{ color: "green" }}>({msg})</span>}
            </p>

            <form noValidate onSubmit={handleVerify}>
              <input
                autoFocus
                value={code}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(onlyDigits);
                }}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="input otp"
              />

              <button type="submit" className="btn-primary" style={{ marginTop: 12 }} disabled={loading || code.length !== 6}>
                {loading ? "Ellenőrzés…" : "Kód ellenőrzése"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setStep("login"); setCode(""); setMsg(""); setErr(""); }}
                  className="linkbtn"
                  style={{ marginLeft: 0 }}
                >
                  Vissza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
