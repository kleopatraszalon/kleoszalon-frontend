import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png"; // LOGÓ

// ===== API base (ha nincs megadva, ugyanarra a domainre lövünk) =====
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") || "";

type LoginStepResp = { success: true; step: "code_required"; message?: string };
type LoginTokenResp = {
  success: true;
  token: string;
  role?: string;
  location_id?: string | number | null;
};
type LoginErrorResp = { success: false; error: string };
type LoginResp = LoginStepResp | LoginTokenResp | LoginErrorResp;
type VerifyResp = LoginTokenResp | LoginErrorResp;
type LocationOpt = { id: string | number; name: string };

const isLoginStep = (x: any): x is LoginStepResp =>
  x && x.success === true && x.step === "code_required";
const isLoginToken = (x: any): x is LoginTokenResp =>
  x && x.success === true && typeof x.token === "string";
const isErrorResp = (x: any): x is LoginErrorResp => x && x.success === false;

async function readBody(res: Response): Promise<{ json: any | null; raw: string }> {
  const txt = await res.text();
  try {
    return { json: JSON.parse(txt), raw: txt };
  } catch {
    return { json: null, raw: txt };
  }
}

export default function Login() {
  const navigate = useNavigate();

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
  const [locationId, setLocationId] = useState<string>("");

  useEffect(() => {
    if (tab !== "customer") return;
    (async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/locations?active=1`, {
          headers: { Accept: "application/json" },
        });
        const { json } = await readBody(res);
        const arr = Array.isArray(json) ? json : [];
        const options: LocationOpt[] = arr
          .map((r: any) => ({
            id: r.id ?? r.location_id ?? "",
            name: r.name ?? r.location_name ?? "",
          }))
          .filter((x) => x.id && x.name);
        setLocs(options);
        if (options.length && !locationId) setLocationId(String(options[0].id));
      } finally {
        setLocLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function persistAuth({
    token,
    role,
    location_id,
  }: {
    token: string;
    role?: string;
    location_id?: string | number | null;
  }) {
    localStorage.setItem("token", token);
    localStorage.setItem("kleo_token", token);
    if (role) localStorage.setItem("kleo_role", role);
    const loc =
      tab === "customer"
        ? locationId || (location_id != null ? String(location_id) : "")
        : location_id != null
        ? String(location_id)
        : "";
    if (loc) localStorage.setItem("kleo_location_id", loc);
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const payload = {
        mode: tab,
        email: username,
        login_name: username,
        password,
        location_id: tab === "customer" ? (locationId || null) : null,
      };

      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const { json, raw } = await readBody(res);

      if (!res.ok) {
        if (json && isErrorResp(json)) {
          setErr(json.error || "Sikertelen belépés");
        } else {
          setErr(`HTTP ${res.status} – váratlan szerver válasz: ${raw?.slice(0, 120) || res.statusText}`);
        }
        return;
      }

      const data: LoginResp = json ?? { success: false, error: "Ismeretlen válasz" };

      if (isLoginStep(data)) {
        setMsg(data.message || "A belépési kódot elküldtük az e-mail címedre.");
        setStep("code");
      } else if (isLoginToken(data)) {
        persistAuth({ token: data.token, role: data.role, location_id: data.location_id ?? null });
        navigate("/");
      } else if (isErrorResp(data)) {
        setErr(data.error || "Sikertelen belépés");
      } else {
        setErr("Ismeretlen válasz a szervertől.");
      }
    } catch {
      setErr("Hálózati hiba");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: username, code }),
      });

      const { json, raw } = await readBody(res);

      if (!res.ok) {
        if (json && isErrorResp(json)) {
          setErr(json.error || "Érvénytelen kód");
        } else {
          setErr(`HTTP ${res.status} – váratlan szerver válasz: ${raw?.slice(0, 120) || res.statusText}`);
        }
        return;
      }

      const data: VerifyResp = json ?? { success: false, error: "Ismeretlen válasz" };

      if (isLoginToken(data)) {
        persistAuth({ token: data.token, role: data.role, location_id: data.location_id ?? null });
        navigate("/");
      } else if (isErrorResp(data)) {
        setErr(data.error || "Érvénytelen kód");
      } else {
        setErr("Ismeretlen válasz a szervertől.");
      }
    } catch {
      setErr("Hálózati hiba");
    } finally {
      setLoading(false);
    }
  };

  // ---- Stílusok (a kért elrendezéssel) ----
  const pageWrap: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    background: "#fbf4ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  };

  // panel: háttérKÉP + fehér fátyol
  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 560,
    borderRadius: 18,
    padding: 28,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#edf4ff",
    fontSize: 15,
    outline: "none",
  };

  const primaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    marginTop: 10,
    border: "none",
    borderRadius: 12,
    background: "#c89d73",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  };

  const linkBtn: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#916941",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 8,
    fontSize: 14,
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: "center",
    padding: "12px 8px",
    fontWeight: 700,
    borderBottom: `3px solid ${active ? "#d9a77d" : "transparent"}`,
    color: active ? "#2d2d2d" : "#777",
    cursor: "pointer",
  });

  return (
    <div style={pageWrap}>
      <div style={card}>
        {/* LOGÓ + CÍM */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <img
            src={logo}
            alt="KLEOPÁTRA SZÉPSÉGSZALONOK"
            style={{ height: 80, width: "auto" }} // dupla méret
          />
          <h1 style={{ margin: "12px 0 0 0", fontSize: 28 }}>Kleoszalon Belépés</h1>
        </div>

        {/* Fülek */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          <button type="button" style={tabBtn(tab === "customer")} onClick={() => { setTab("customer"); setStep("login"); }}>
            Ügyfél belépés
          </button>
          <button type="button" style={tabBtn(tab === "employee")} onClick={() => { setTab("employee"); setStep("login"); }}>
            Munkatársi belépés
          </button>
        </div>

        {step === "login" ? (
          <form onSubmit={handleLogin}>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                {tab === "employee" ? "Felhasználónév" : "E-mail vagy felhasználónév"}
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={tab === "employee" ? "pl. admin" : "pl. you@example.com vagy admin"}
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              <span style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Jelszó</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={inputStyle}
              />
            </label>

            {/* Elfelejtett jelszó -> a gomb FÖLÉ, jobbra igazítva */}
            <div style={{ textAlign: "right", margin: "6px 0 10px 0" }}>
              <button type="button" style={linkBtn} onClick={() => navigate("/forgot-password")}>
                Elfelejtett jelszó?
              </button>
            </div>

            {tab === "customer" && (
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Telephely</span>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  disabled={locLoading}
                  style={{ ...inputStyle, background: "#fff" }}
                >
                  {locLoading && <option>Telephelyek betöltése…</option>}
                  {!locLoading && locs.length === 0 && <option>Nem érhető el telephely</option>}
                  {!locLoading &&
                    locs.map((l) => (
                      <option key={String(l.id)} value={String(l.id)}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <button type="submit" style={primaryBtn} disabled={loading}>
              {loading ? "Belépés…" : "Belépés"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                E-mail vagy felhasználónév (ellenőrzéshez)
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="pl. you@example.com vagy admin"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Belépési kód</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="123456"
                inputMode="numeric"
                pattern="^\\d{6}$"
                title="6 számjegy"
                style={inputStyle}
              />
            </label>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" style={{ ...primaryBtn, marginTop: 0 }} disabled={loading}>
                {loading ? "Ellenőrzés…" : "Kód ellenőrzése"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("login"); setCode(""); setMsg(""); setErr(""); }}
                style={{ ...linkBtn, marginLeft: 0 }}
              >
                Vissza
              </button>
            </div>
          </form>
        )}

        {msg && <p style={{ color: "green", marginTop: 12 }}>{msg}</p>}
        {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 14 }}>
          Nincs még fiókod?{" "}
          <button type="button" style={linkBtn} onClick={() => navigate("/register")}>
            Regisztráció (jóváhagyásra vár)
          </button>
        </div>
      </div>
    </div>
  );
}
