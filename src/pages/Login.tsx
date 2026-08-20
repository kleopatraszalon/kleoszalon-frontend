// src/pages/Login.tsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bg from "../assets/background_login.webp";
import logo from "../assets/kleo_logo.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import CopyrightNotice from "../components/CopyrightNotice";
import { useLanguage } from "../i18n/LanguageProvider";
import api from "../api/api";
import { invalidateCurrentUserCache } from "../hooks/useCurrentUser";
import { markAuthenticatedSession } from "../utils/authSession";

type LoginResponse = {
  success?: boolean;
  ok?: boolean;
  role?: any;
  account_type?: "customer" | "staff" | "admin" | string;
  location_id?: string | number | null;
  location_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  login_name?: string | null;
  user?: {
    role?: any;
    location_id?: string | number | null;
    location_name?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
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
      // /api/me has already verified the freshly issued HttpOnly cookie at this
      // point. Invalidate every previous-session user cache before exposing the
      // routing marker and navigating to the authenticated application shell.
      invalidateCurrentUserCache();
      markAuthenticatedSession();
      const user = body.user || {};
      const role = body.role ?? user.role;
      const fullName = body.full_name ?? user.full_name;
      const locationId = body.location_id ?? user.location_id;
      const locationName = body.location_name ?? user.location_name;
      const email = body.email ?? user.email;

      if (role != null) localStorage.setItem("kleo_role", String(role));
      if (fullName) localStorage.setItem("kleo_full_name", String(fullName));
      else localStorage.removeItem("kleo_full_name");

      if (locationId != null) localStorage.setItem("kleo_location_id", String(locationId));
      else localStorage.removeItem("kleo_location_id");

      if (locationName) localStorage.setItem("kleo_location_name", String(locationName));
      else localStorage.removeItem("kleo_location_name");

      const storedIdentifier = email || body.login_name || identifier.trim();
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
    let credentialsAccepted = false;
    try {
      const response = await api.post<LoginResponse>("/login", {
        identifier: identifier.trim(),
        password,
      });
      const body = response.data || {};
      if (body.success === false || body.ok === false) {
        setError(body.error || t("login.unexpected"));
        return;
      }
      credentialsAccepted = true;

      // Do not navigate on the login POST alone. The protected /api/me readback
      // proves that Chromium stored the cross-site HttpOnly cookie and will send
      // it back to the API. This removes the dashboard/login flicker loop.
      const sessionCheck = await api.get<LoginResponse>("/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      const verified = sessionCheck.data || {};
      if (verified.ok === false || !verified.user) {
        throw new Error("SESSION_VERIFICATION_FAILED");
      }

      const verifiedUser = verified.user;
      persistAuthAndGoHome({
        ...body,
        user: { ...(body.user || {}), ...verifiedUser },
        role: verifiedUser.role ?? body.role,
        location_id: verifiedUser.location_id ?? body.location_id,
        location_name: verifiedUser.location_name ?? body.location_name,
        full_name: verifiedUser.full_name ?? body.full_name,
        email: verifiedUser.email ?? body.email,
      });
    } catch (err: any) {
      console.error("Login error:", err);
      const status = err?.response?.status;
      const body = err?.response?.data as LoginResponse | undefined;
      if (credentialsAccepted) {
        setError(
          language === "en"
            ? "Sign-in was accepted, but the secure browser session could not be verified. Please try again."
            : "A belépési adatok helyesek, de a biztonságos böngészős munkamenet nem ellenőrizhető. Kérjük, próbáld újra.",
        );
      } else {
        setError(
          body?.error ||
            (status
              ? language === "en"
                ? `Sign-in failed (HTTP ${status}).`
                : `Sikertelen belépés (HTTP ${status}).`
              : t("login.unexpected")),
        );
      }
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
            <CopyrightNotice inline />
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
