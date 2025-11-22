// src/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-jon.onrender.com/api";

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

async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = apiUrl(path);
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
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
  (async () => {
    try {
      const res = await apiFetch("locations");
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const raw = await res.json() as any;

      // pl. raw.token vagy raw.accessToken – amit a backend küld
      if (raw && raw.token) {
        localStorage.setItem("token", raw.token);
        // vagy sessionStorage, ha csak session-re akarod
      }

      // ⚙️ Itt normalizáljuk: akármi is jött, lesz belőle egy tömb
      let dataArray: any[] = [];

      if (Array.isArray(raw)) {
        dataArray = raw;
      } else if (raw && Array.isArray(raw.locations)) {
        dataArray = raw.locations;
      } else if (raw && Array.isArray(raw.items)) {
        dataArray = raw.items;
      } else if (raw && Array.isArray(raw.data)) {
        dataArray = raw.data;
      } else {
        console.warn("Váratlan /api/locations válasz:", raw);
        dataArray = [];
      }

      const opts: LocationOpt[] = dataArray.map((row: any) => {
        const label =
          row.city && row.name
            ? `${row.city} – ${row.city} – ${row.name}`
            : row.name || String(row.id);
        return { id: row.id, name: label };
      });

      setLocations(opts);
    } catch (err) {
      console.error("Telephelyek lekérése sikertelen:", err);
      setLocations([]);
    }
  })();
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
