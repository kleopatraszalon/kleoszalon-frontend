// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";
import "./Login.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type LoginStep = "credentials" | "code";

type LoginResponse = {
  success?: boolean;
  step?: string;
  error?: string;
};

type VerifyResponse = {
  success?: boolean;
  token?: string;
  role?: string;
  location_id?: string | number | null;
  location_name?: string | null;
  full_name?: string | null;
  error?: string;
};

type LocationOpt = {
  id: string | number;
  name: string;
};

function apiUrl(path: string): string {
  const clean = String(path).replace(/^\/+/, "");
  return `${API_BASE}/${clean}`;
}

function safeJsonParse(text: string): any {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function normalizeToArray(raw: any): any[] {
  // ⚙️ bármi is jön a backendtől, próbálunk belőle listát csinálni
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.locations)) return raw.locations;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.data)) return raw.data;
  return [];
}

function headersToRecord(h?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (h instanceof Headers) {
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v;
    return out;
  }
  return { ...(h as Record<string, string>) };
}

async function fetchLocationsAsOptions(): Promise<LocationOpt[]> {
  // A 404 tipikusan azt jelenti, hogy rossz az endpoint neve.
  // Ezért több gyakori útvonalat is megpróbálunk.
  const pathCandidates = [
    "locations/public",
    "locations",
  ];

  // Ha a backend nem használ /api prefixet, akkor a base-ben szereplő /api-t elhagyva
  // is megpróbáljuk (csak a telephely lekérésnél, hogy mást ne törjünk el).
  const baseCandidates: string[] = [API_BASE];
  const altBase = API_BASE.replace(/\/api\/?$/, "");
  if (altBase && altBase !== API_BASE) baseCandidates.push(altBase);

  const errors: string[] = [];

  for (const base of baseCandidates) {
    for (const path of pathCandidates) {
      const clean = String(path).replace(/^\/+/, "");
      const url = `${base}/${clean}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const text = await res.text();
          const raw = safeJsonParse(text) ?? text;
          const rows = normalizeToArray(raw);

          if (!Array.isArray(rows)) {
            console.warn("Váratlan telephely válasz (nem tömb):", raw);
            return [];
          }

          return rows.map((row: any) => {
            const id = row?.id ?? row?.location_id ?? row?.value ?? row?.code;
            const name =
              row?.display_name ??
              row?.location_name ??
              row?.name ??
              row?.title ??
              String(id ?? "");
            const city = row?.city ?? row?.town ?? row?.settlement;
            const label = city && name ? `${city} – ${name}` : name;
            return { id: id ?? label, name: label };
          });
        }

        // Ha 404, próbáljuk a következő candidate-et
        const body = await res.text().catch(() => "");
        errors.push(`HTTP ${res.status} @ ${url} :: ${body.slice(0, 200)}`);
        if (res.status !== 404) {
          // ha nem 404, akkor ez már valós hiba (pl. 401/500) -> nem érdemes tovább próbálkozni
          break;
        }
      } catch (e: any) {
        errors.push(`ERR @ ${url} :: ${e?.message || String(e)}`);
      }
    }
  }

  console.error("Telephelyek lekérése sikertelen (minden próbálkozás):", errors);
  return [];
}

async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = apiUrl(path);
  // GET-nél NE adjunk Content-Type-ot, mert felesleges CORS preflightot okozhat.
  const hdr = headersToRecord(init.headers);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...hdr,
  };

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");
  const [step, setStep] = useState<LoginStep>("credentials");

  // ügyfél belépés
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // kódos ellenőrzés
  const [code, setCode] = useState("");

  // munkatársi belépés
  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  // telephely választó
  const [locations, setLocations] = useState<LocationOpt[]>([]);
  const [locationId, setLocationId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // telephelyek lekérése
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const opts = await fetchLocationsAsOptions();
        if (!cancelled) setLocations(opts);
      } catch (err) {
        console.error("Telephelyek lekérése sikertelen:", err);
        if (!cancelled) setLocations([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const notice = sessionStorage.getItem("kleo.login.notice");
    if (!notice) return;
    setError(notice);
    sessionStorage.removeItem("kleo.login.notice");
  }, []);

const persistAuthAndGoHome = (body: VerifyResponse) => {
    const token = body.token;

    // 🔹 Ha van token, eltároljuk, ha nincs, akkor is továbbengedjük (cookie-alapú auth esetén is működik)
    try {
      if (token) {
        localStorage.setItem("kleo_token", token);
        localStorage.setItem("token", token);
      }

      const effectiveLocationId =
        body.location_id ??
        (locationId ? Number(locationId) || locationId : null);

      const effectiveLocationName =
        body.location_name ??
        (effectiveLocationId != null
          ? locations.find((l) => String(l.id) === String(effectiveLocationId))
              ?.name ?? null
          : null);

      if (body.role) {
        localStorage.setItem("kleo_role", String(body.role));
      }
      if (effectiveLocationId != null) {
        localStorage.setItem("kleo_location_id", String(effectiveLocationId));
      }
      if (effectiveLocationName != null) {
        localStorage.setItem("kleo_location_name", effectiveLocationName);
      }
      if (body.full_name != null) {
        localStorage.setItem("kleo_full_name", String(body.full_name));
      }
      if (email) {
        localStorage.setItem("email", email);
      }

      // IDE NAVIGÁLUNK SIKERES BELÉPÉS UTÁN
      navigate("/", { replace: true });
      // ha nálad a főoldal nem "/", hanem pl. "/home", akkor ezt írd át arra
      // navigate("/home", { replace: true });
    } catch (err) {
      console.error("Auth persist error:", err);
      setError("Nem sikerült elmenteni a belépési adatokat.");
    }
  };
  
  // ÜGYFÉL: első lépcső – email + jelszó
const handleCustomerLogin = async (ev: React.FormEvent) => {
  ev.preventDefault();
  setError(null);

  // Telephely választás ellenőrzés
  if (locations.length > 0 && !locationId) {
    setError("Kérlek válassz telephelyet.");
    return;
  }

  setLoading(true);

  try {
    const res = await apiFetch("login", {
      method: "POST",
      body: JSON.stringify({
        // 🔹 A backend az előzőek szerint email / identifier mezőt vár
        email: email.trim(),
        password,
        location_id: locationId || null,
      }),
    });

    // Válasz body biztonságos parse-olása
    const text = await res.text();
    let body: LoginResponse & VerifyResponse = {} as any;

    try {
      body = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error(
        "Nem sikerült JSON-ként értelmezni a login választ:",
        err,
        text
      );
      body = {} as any;
    }

    console.log("Login válasz:", res.status, body);

    // Hibakezelés
    if (!res.ok || body.success === false) {
      setError(body.error || `Sikertelen belépés (HTTP ${res.status}).`);
      return;
    }

    // Ha a backend 2FA-t kér (step: 'code_required')
    if (body.step === "code_required") {
      setStep("code");
      return;
    }

    // Ha a backend tokennel is válaszol (opcionális, ha beépíted)
    if ((body as any).token) {
      persistAuthAndGoHome(body);
      return;
    }

    // Ha cookie alapú auth van (token sütiben), akkor is lépünk tovább
    persistAuthAndGoHome(body);
  } catch (e: any) {
    console.error("Login error:", e);
    setError("Váratlan hiba történt a bejelentkezés során.");
  } finally {
    setLoading(false);
  }
};


  // ÜGYFÉL: második lépcső – kód
  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch("verify-code", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          location_id: locationId || null,
        }),
      });

      const text = await res.text();
      let body: VerifyResponse = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }

      if (!res.ok || body.success === false) {
        setError(body.error || `Érvénytelen kód (HTTP ${res.status}).`);
        return;
      }

      persistAuthAndGoHome(body);
    } catch (e: any) {
      console.error("Verify error:", e);
      setError("Váratlan hiba történt a kód ellenőrzése közben.");
    } finally {
      setLoading(false);
    }
  };

  // MUNKATÁRSI BELÉPÉS: employees.login_name + password
  const handleStaffLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);

    if (locations.length > 0 && !locationId) {
      setError("Kérlek válassz telephelyet.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("employee-login", {
        method: "POST",
        body: JSON.stringify({
          login_name: staffName.trim(),
          password: staffPassword,
          location_id: locationId || null,
        }),
      });

      const text = await res.text();
      let body: VerifyResponse = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }

      if (!res.ok || body.success === false) {
        setError(body.error || `Sikertelen belépés (HTTP ${res.status}).`);
        return;
      }

      // itt is: ha van token, elmentjük, ha nincs, csak megyünk tovább
      persistAuthAndGoHome(body);
    } catch (e: any) {
      console.error("Employee login error:", e);
      setError("Váratlan hiba történt a munkatársi belépés során.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: "customer" | "staff") => {
    setActiveTab(tab);
    setStep("credentials");
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div
          className="login-card-bg"
          style={{ backgroundImage: `url(${bg})` }}
        />
        <div className="login-card-overlay" />
        <div className="login-card-inner">
          <div className="login-header">
            <div className="login-logo">
              <img src={logo} alt="Kleopátra Szépségszalonok" />
            </div>
          </div>

          <p className="login-tagline">
            Modern szépségszalon-hálózat prémium szolgáltatásokkal, átlátható
            foglalási rendszerrel és professzionális munkatársakkal – mindezt
            egyetlen felületen kezelve.
          </p>

          <h1 className="login-title">Kleoszalon Belépés</h1>
          <p className="login-subtitle">
            Jelentkezz be a foglalások, vendégek és munkanapok kezeléséhez.
          </p>

          <div className="login-tabs">
            <button
              type="button"
              className={
                "login-tab " +
                (activeTab === "customer" ? "login-tab--active" : "")
              }
              onClick={() => switchTab("customer")}
            >
              Ügyfél belépés
            </button>
            <button
              type="button"
              className={
                "login-tab " +
                (activeTab === "staff" ? "login-tab--active" : "")
              }
              onClick={() => switchTab("staff")}
            >
              Munkatársi belépés
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          {/* ÜGYFÉL BELÉPÉS */}
          {activeTab === "customer" && (
            <>
              {step === "credentials" && (
                <form onSubmit={handleCustomerLogin}>
                  <div className="login-field">
                    <label className="login-label">
                      E-mail vagy felhasználónév
                    </label>
                    <input
                      type="email"
                      className="login-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="pl. you@example.com vagy admin"
                    />
                  </div>

                  <div className="login-field">
                    <label className="login-label">Jelszó</label>
                    <input
                      type="password"
                      className="login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* TELEPHELY VÁLASZTÓ */}
                  <div className="login-field">
                    <label className="login-label">Telephely</label>
                    <select
                      className="login-input"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                    >
                      <option value="">
                        {locations.length === 0
                          ? "Nem érhető el telephely"
                          : "Válassz telephelyet"}
                      </option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="login-row">
                    <span />
                    <button
                      type="button"
                      className="login-link"
                      disabled
                      title="Hamarosan"
                    >
                      Elfelejtett jelszó?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? "Belépés..." : "Belépés"}
                  </button>

                  <div className="login-footer">
                    Nincs még fiókod?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="login-footer-link"
                    >
                      Regisztráció (jóváhagyásra vár)
                    </button>
                  </div>
                </form>
              )}

              {step === "code" && (
                <form onSubmit={handleVerify}>
                  <p className="login-text">
                    A megadott e-mail címre elküldtük az egyszer használatos
                    belépési kódot. Kérlek, írd be az alábbi mezőbe.
                  </p>

                  <div className="login-field">
                    <label className="login-label">Belépési kód</label>
                    <input
                      type="text"
                      className="login-input login-code-input"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoComplete="one-time-code"
                      placeholder="••••••"
                    />
                  </div>

                  {/* ugyanaz a telephely itt is megmarad */}
                  <div className="login-field">
                    <label className="login-label">Telephely</label>
                    <select
                      className="login-input"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                    >
                      <option value="">
                        {locations.length === 0
                          ? "Nem érhető el telephely"
                          : "Válassz telephelyet"}
                      </option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="login-secondary-button"
                    disabled={loading}
                  >
                    {loading ? "Ellenőrzés..." : "Kód ellenőrzése"}
                  </button>

                  <button
                    type="button"
                    className="login-back-button"
                    onClick={() => setStep("credentials")}
                  >
                    Vissza az e-mail / jelszó megadásához
                  </button>
                </form>
              )}
            </>
          )}

          {/* MUNKATÁRSI BELÉPÉS */}
          {activeTab === "staff" && (
            <form onSubmit={handleStaffLogin}>
              <div className="login-field">
                <label className="login-label">Név</label>
                <input
                  type="text"
                  className="login-input"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="pl. kozmetikus01"
                />
              </div>

              <div className="login-field">
                <label className="login-label">Jelszó</label>
                <input
                  type="password"
                  className="login-input"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              {/* Telephely választó munkatársaknak is */}
              <div className="login-field">
                <label className="login-label">Telephely</label>
                <select
                  className="login-input"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">
                    {locations.length === 0
                      ? "Nem érhető el telephely"
                      : "Válassz telephelyet"}
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Belépés..." : "Belépés"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
