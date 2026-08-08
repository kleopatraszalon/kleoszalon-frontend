// src/pages/Login.tsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type LoginResponse = {
  success?: boolean;
  token?: string;
  role?: any;
  account_type?: "customer" | "staff" | "admin" | string;
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

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
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
        placeholder="••••••••"
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistAuthAndGoHome = (body: LoginResponse) => {
    try {
      if (body.token) {
        localStorage.setItem("kleo_token", body.token);
        localStorage.setItem("token", body.token);
      }
      if (body.role != null) localStorage.setItem("kleo_role", String(body.role));
      if (body.full_name) localStorage.setItem("kleo_full_name", String(body.full_name));
      else localStorage.removeItem("kleo_full_name");

      if (body.location_id != null) localStorage.setItem("kleo_location_id", String(body.location_id));
      else localStorage.removeItem("kleo_location_id");

      if (body.location_name) localStorage.setItem("kleo_location_name", String(body.location_name));
      else localStorage.removeItem("kleo_location_name");

      const storedIdentifier = body.email || body.login_name || identifier.trim();
      if (storedIdentifier) localStorage.setItem("email", String(storedIdentifier));
      if (body.account_type) localStorage.setItem("kleo_account_type", String(body.account_type));
      else localStorage.removeItem("kleo_account_type");

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Auth persist error:", err);
      setError("Nem sikerült elmenteni a belépési adatokat.");
    }
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Add meg az e-mail címedet vagy felhasználónevedet és a jelszavadat.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("login", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const body: LoginResponse = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        setError(body.error || `Sikertelen belépés (HTTP ${res.status}).`);
        return;
      }
      persistAuthAndGoHome(body);
    } catch (err) {
      console.error("Login error:", err);
      setError("Váratlan hiba történt a bejelentkezés során.");
    } finally {
      setLoading(false);
    }
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
          <p className="login-subtitle">
            Egyetlen belépési felület ügyfeleknek, munkatársaknak és adminisztrátoroknak. A rendszer automatikusan a megfelelő jogosultságot és telephelyet használja.
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">E-mail vagy felhasználónév</label>
              <input
                type="text"
                className="login-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                placeholder="E-mail cím vagy felhasználónév"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Jelszó</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>

            <div className="login-row">
              <span />
              <button type="button" className="login-link" disabled title="Hamarosan">Elfelejtett jelszó?</button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Belépés..." : "Belépés"}
            </button>

            <div className="login-footer">
              Új ügyfél vagy?{" "}
              <button type="button" onClick={() => navigate("/register")} className="login-footer-link">
                Ügyfél regisztráció
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
