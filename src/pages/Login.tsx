// src/pages/Login.tsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageProvider";
import api from "../api/api";
import { markAuthenticatedSession } from "../utils/authSession";

type LoginResponse = {
  success?: boolean;
  auth_transport?: string;
  role?: any;
  account_type?: "customer" | "staff" | "admin" | string;
  location_id?: string | number | null;
  location_name?: string | null;
  tenant_id?: string | number | null;
  full_name?: string | null;
  email?: string | null;
  login_name?: string | null;
  error?: string;
};

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
  const { t } = useLanguage();
  const toggleLabel = visible ? t("login.hide_password") : t("login.show_password");
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
        aria-label={toggleLabel}
        title={toggleLabel}
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
  const [searchParams] = useSearchParams();
  const { language, t } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idleLogout = searchParams.get("reason") === "idle";

  const persistAuthAndGoHome = (body: LoginResponse) => {
    try {
      // The JWT is owned exclusively by the backend HttpOnly cookie. Keep only
      // a non-secret compatibility marker for legacy route guards.
      markAuthenticatedSession();

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
      setError(t("login.persist_error"));
    }
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError(t("login.required"));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<LoginResponse>("/login", {
        identifier: identifier.trim(),
        password,
      });
      const body = response.data || {};
      if (body.success === false) {
        setError(body.error || t("login.unexpected"));
        return;
      }
      persistAuthAndGoHome(body);
    } catch (err: any) {
      console.error("Login error:", err);
      const status = err?.response?.status;
      const body = err?.response?.data as LoginResponse | undefined;
      setError(
        body?.error ||
          (status
            ? language === "en"
              ? `Sign-in failed (HTTP ${status}).`
              : `Sikertelen belépés (HTTP ${status}).`
            : t("login.unexpected")),
      );
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
          <div className="login-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div className="login-logo"><img src={logo} alt="Kleopátra Szépségszalonok" /></div>
            <LanguageSwitcher compact />
          </div>

          <p className="login-tagline">{t("login.tagline")}</p>
          <h1 className="login-title">{t("login.title")}</h1>
          <p className="login-subtitle">{t("login.subtitle")}</p>

          {idleLogout && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginBottom: 12,
                border: "1px solid #d5c4a4",
                borderRadius: 8,
                padding: "9px 11px",
                background: "#fffaf2",
                color: "#5d5a55",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {t("login.idle")}
            </div>
          )}
          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">{t("login.identifier")}</label>
              <input
                type="text"
                className="login-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                placeholder={t("login.identifier_placeholder")}
              />
            </div>

            <div className="login-field">
              <label className="login-label">{t("login.password")}</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>

            <div className="login-row">
              <span />
              <button type="button" className="login-link" disabled title={language === "en" ? "Coming soon" : "Hamarosan"}>{t("login.forgot")}</button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? t("login.loading") : t("login.submit")}
            </button>

            <div className="login-footer">
              {t("login.register_intro")} {" "}
              <button type="button" onClick={() => navigate("/register")} className="login-footer-link">
                {t("login.register")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
