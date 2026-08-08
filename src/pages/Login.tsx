// src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type LoginStep = "credentials" | "code";
type LocationOpt = { id: string | number; name: string };
type LoginResponse = {
  success?: boolean;
  step?: string;
  token?: string;
  role?: any;
  location_id?: string | number | null;
  location_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  login_name?: string | null;
  error?: string;
};

function apiUrl(path: string) {
  return `${API_BASE}/${String(path).replace(/^\/+/, "")}`;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(apiUrl(path), { ...init, headers, credentials: "include", cache: "no-store" });
}

async function fetchLocationsAsOptions(): Promise<LocationOpt[]> {
  const candidates = ["locations/public", "locations"];
  for (const path of candidates) {
    try {
      const res = await apiFetch(path, { method: "GET" });
      if (!res.ok) continue;
      const raw = await res.json().catch(() => null);
      const rows = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.locations)
          ? raw.locations
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
      return rows.map((row: any) => {
        const id = row?.id ?? row?.location_id ?? row?.value ?? row?.code;
        const name = row?.display_name ?? row?.location_name ?? row?.name ?? row?.title ?? String(id ?? "");
        const city = row?.city ?? row?.town ?? row?.settlement;
        return { id: id ?? name, name: city && name ? `${city} – ${name}` : name };
      });
    } catch (err) {
      console.warn("Telephely lekérés sikertelen:", err);
    }
  }
  return [];
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
  placeholder = "••••••••",
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        className="login-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete="current-password"
        placeholder={placeholder}
        style={{ paddingRight: 48 }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        title={visible ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 34,
          height: 34,
          border: 0,
          borderRadius: 9,
          background: "transparent",
          color: "#5d5a55",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");
  const [step, setStep] = useState<LoginStep>("credentials");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [locations, setLocations] = useState<LocationOpt[]>([]);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLocationsAsOptions()
      .then((items) => { if (!cancelled) setLocations(items); })
      .catch(() => { if (!cancelled) setLocations([]); });
    return () => { cancelled = true; };
  }, []);

  const persistAuthAndGoHome = (body: LoginResponse, mode: "customer" | "staff") => {
    try {
      if (body.token) {
        localStorage.setItem("kleo_token", body.token);
        localStorage.setItem("token", body.token);
      }

      const customerFallbackLocation = mode === "customer" && locationId
        ? Number(locationId) || locationId
        : null;
      const effectiveLocationId = body.location_id ?? customerFallbackLocation;
      const effectiveLocationName = body.location_name ?? (
        mode === "customer" && effectiveLocationId != null
          ? locations.find((l) => String(l.id) === String(effectiveLocationId))?.name ?? null
          : null
      );

      if (body.role != null) localStorage.setItem("kleo_role", String(body.role));
      if (body.full_name) localStorage.setItem("kleo_full_name", String(body.full_name));

      if (effectiveLocationId != null) localStorage.setItem("kleo_location_id", String(effectiveLocationId));
      else localStorage.removeItem("kleo_location_id");

      if (effectiveLocationName) localStorage.setItem("kleo_location_name", String(effectiveLocationName));
      else localStorage.removeItem("kleo_location_name");

      const storedIdentifier = body.email || (mode === "staff" ? body.login_name || staffName : email);
      if (storedIdentifier) localStorage.setItem("email", String(storedIdentifier));

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Auth persist error:", err);
      setError("Nem sikerült elmenteni a belépési adatokat.");
    }
  };

  const handleCustomerLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (locations.length > 0 && !locationId) {
      setError("Kérlek válassz telephelyet.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password, location_id: locationId || null }),
      });
      const body: LoginResponse = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        setError(body.error || `Sikertelen belépés (HTTP ${res.status}).`);
        return;
      }
      if (body.step === "code_required") {
        setStep("code");
        return;
      }
      persistAuthAndGoHome(body, "customer");
    } catch (err) {
      console.error("Login error:", err);
      setError("Váratlan hiba történt a bejelentkezés során.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("verify-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), code: code.trim(), location_id: locationId || null }),
      });
      const body: LoginResponse = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        setError(body.error || `Érvénytelen kód (HTTP ${res.status}).`);
        return;
      }
      persistAuthAndGoHome(body, "customer");
    } catch (err) {
      console.error("Verify error:", err);
      setError("Váratlan hiba történt a kód ellenőrzése közben.");
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!staffName.trim() || !staffPassword) {
      setError("Add meg a felhasználónevet és a jelszót.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("employee-login", {
        method: "POST",
        body: JSON.stringify({ login_name: staffName.trim(), password: staffPassword }),
      });
      const body: LoginResponse = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        setError(body.error || `Sikertelen belépés (HTTP ${res.status}).`);
        return;
      }
      persistAuthAndGoHome(body, "staff");
    } catch (err) {
      console.error("Employee login error:", err);
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
        <div className="login-card-bg" style={{ backgroundImage: `url(${bg})` }} />
        <div className="login-card-overlay" />
        <div className="login-card-inner">
          <div className="login-header">
            <div className="login-logo"><img src={logo} alt="Kleopátra Szépségszalonok" /></div>
          </div>

          <p className="login-tagline">
            Modern szépségszalon-hálózat prémium szolgáltatásokkal, átlátható foglalási rendszerrel és professzionális munkatársakkal – mindezt egyetlen felületen kezelve.
          </p>
          <h1 className="login-title">Kleoszalon Belépés</h1>
          <p className="login-subtitle">Jelentkezz be a foglalások, vendégek és munkanapok kezeléséhez.</p>

          <div className="login-tabs">
            <button type="button" className={`login-tab ${activeTab === "customer" ? "login-tab--active" : ""}`} onClick={() => switchTab("customer")}>Ügyfél belépés</button>
            <button type="button" className={`login-tab ${activeTab === "staff" ? "login-tab--active" : ""}`} onClick={() => switchTab("staff")}>Munkatársi belépés</button>
          </div>

          {error && <div className="login-error">{error}</div>}

          {activeTab === "customer" && step === "credentials" && (
            <form onSubmit={handleCustomerLogin}>
              <div className="login-field">
                <label className="login-label">E-mail vagy felhasználónév</label>
                <input type="text" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="pl. you@example.com vagy admin" />
              </div>
              <div className="login-field">
                <label className="login-label">Jelszó</label>
                <PasswordInput value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
              <div className="login-field">
                <label className="login-label">Telephely</label>
                <select className="login-input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">{locations.length === 0 ? "Nem érhető el telephely" : "Válassz telephelyet"}</option>
                  {locations.map((loc) => <option key={loc.id} value={String(loc.id)}>{loc.name}</option>)}
                </select>
              </div>
              <div className="login-row"><span /><button type="button" className="login-link" disabled title="Hamarosan">Elfelejtett jelszó?</button></div>
              <button type="submit" className="login-button" disabled={loading}>{loading ? "Belépés..." : "Belépés"}</button>
              <div className="login-footer">Nincs még fiókod? <button type="button" onClick={() => navigate("/register")} className="login-footer-link">Regisztráció (jóváhagyásra vár)</button></div>
            </form>
          )}

          {activeTab === "customer" && step === "code" && (
            <form onSubmit={handleVerify}>
              <p className="login-text">A megadott e-mail címre elküldtük az egyszer használatos belépési kódot. Kérlek, írd be az alábbi mezőbe.</p>
              <div className="login-field">
                <label className="login-label">Belépési kód</label>
                <input type="text" className="login-input login-code-input" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="one-time-code" placeholder="••••••" />
              </div>
              <div className="login-field">
                <label className="login-label">Telephely</label>
                <select className="login-input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">{locations.length === 0 ? "Nem érhető el telephely" : "Válassz telephelyet"}</option>
                  {locations.map((loc) => <option key={loc.id} value={String(loc.id)}>{loc.name}</option>)}
                </select>
              </div>
              <button type="submit" className="login-secondary-button" disabled={loading}>{loading ? "Ellenőrzés..." : "Kód ellenőrzése"}</button>
              <button type="button" className="login-back-button" onClick={() => setStep("credentials")}>Vissza az e-mail / jelszó megadásához</button>
            </form>
          )}

          {activeTab === "staff" && (
            <form onSubmit={handleStaffLogin}>
              <div className="login-field">
                <label className="login-label">Felhasználónév</label>
                <input type="text" className="login-input" value={staffName} onChange={(e) => setStaffName(e.target.value)} required autoComplete="username" placeholder="pl. recepcio1" />
              </div>
              <div className="login-field">
                <label className="login-label">Jelszó</label>
                <PasswordInput value={staffPassword} onChange={setStaffPassword} visible={showStaffPassword} onToggle={() => setShowStaffPassword((v) => !v)} />
              </div>
              <p className="login-text" style={{ marginTop: 4 }}>
                A telephelyet nem kell kiválasztani: a rendszer automatikusan a munkatárshoz rendelt telephelyet használja.
              </p>
              <button type="submit" className="login-button" disabled={loading}>{loading ? "Belépés..." : "Belépés"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
