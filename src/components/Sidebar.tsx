import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kleoLogo from "../assets/kleo_logo.png";

type LocationItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
};

type LoginResponse = {
  success?: boolean;
  token?: string;
  role?: string;
  location_id?: string | null;
  step?: "code_required";
  message?: string;
  error?: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();

  // ---- Tabs: client = Ügyfél, employee = Munkatársi ----
  const [activeTab, setActiveTab] = useState<"client" | "employee">("client");

  // ==== ÜGYFÉL FLOW ====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationId, setLocationId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ==== MUNKATÁRSI FLOW ====
  const [empLogin, setEmpLogin] = useState("");
  const [empPass, setEmpPass] = useState("");
  const [empError, setEmpError] = useState("");

  // ------- biztonságos JSON feldolgozó -------
  const parseJSON = async <T = any>(res: Response): Promise<T> => {
    try {
      const text = await res.text();
      return text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      return { error: "Váratlan szerverválasz" } as T;
    }
  };

  // 🔄 Telephelyek lekérése
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await parseJSON<LocationItem[] | { error?: string }>(res);
        if (res.ok && Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0 && !locationId) setLocationId(String(data[0].id));
        } else {
          console.warn("Telephely lista nem érvényes:", data);
        }
      } catch (err) {
        console.error("Telephely lekérdezési hiba:", err);
      }
    };
    loadLocations();
    // csak első betöltésnél
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Ügyfél login sikeres befejezése
  const finishClientLogin = (data: LoginResponse) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("kleo_token", data.token);
    }
    localStorage.setItem("kleo_role", data.role ?? "guest");

    const finalLocId = (data.location_id ?? locationId ?? "") as string;
    localStorage.setItem("kleo_location_id", finalLocId);

    const found = locations.find((l) => String(l.id) === String(finalLocId));
    const finalLocName = found ? found.name : "";
    localStorage.setItem("kleo_location_name", finalLocName);

    if (email) localStorage.setItem("email", email);

    // Az App.tsx-ben a Home a "/" útvonalon van
    navigate("/");
  };

  // ▶ ÜGYFÉL 1. lépés: email + jelszó + telephely
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!locationId) {
      setError("Válassz telephelyet a belépéshez.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, location_id: locationId }),
      });
      const data = await parseJSON<LoginResponse>(res);

      if (res.ok && data.success && data.step === "code_required") {
        setInfo(data.message || "Kérjük, írd be az e-mailben kapott belépési kódot.");
        setStep(2);
        return;
      }
      if (res.ok && data.success && data.token) {
        finishClientLogin(data);
        return;
      }
      setError(data.error || "Hibás bejelentkezési adatok");
    } catch (err) {
      console.error("Login request error:", err);
      setError("Hálózati hiba történt");
    }
  };

  // ▶ ÜGYFÉL 2. lépés: kód + telephely
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!locationId) {
      setError("Válassz telephelyet a belépéshez.");
      return;
    }

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, location_id: locationId }),
      });
      const data = await parseJSON<LoginResponse>(res);
      if (res.ok && data.success && data.token) {
        finishClientLogin(data);
        return;
      }
      setError(data.error || "Hibás kód");
    } catch (err) {
      console.error("Verify request error:", err);
      setError("Hálózati hiba történt");
    }
  };

  // ▶ ELFELEJTETT JELSZÓ
  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email) {
      setError("Add meg az e-mail címedet, majd kattints az Elfelejtett jelszó linkre.");
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJSON<{ message?: string; error?: string }>(res);
      if (res.ok) {
        setInfo(
          data.message ||
            "Ha létezik fiók ezzel az e-mail címmel, küldtünk egy jelszó-visszaállító levelet."
        );
      } else {
        setError(data.error || "A jelszó-visszaállítás kérése nem sikerült.");
      }
    } catch (err) {
      console.error("Forgot-password error:", err);
      setError("Hálózati hiba történt");
    }
  };

  // ▶ MUNKATÁRSI belépés (DEMO)
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError("");
    const u = empLogin.trim();
    const p = empPass.trim();
    if (u === "admin" && p === "admin") {
      const payload = {
        user_id: "demo-admin-id",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      };
      const fakeToken = btoa(JSON.stringify(payload));
      localStorage.setItem("token", fakeToken);
      localStorage.setItem("kleo_token", fakeToken);
      localStorage.setItem("kleo_role", "admin");
      localStorage.setItem("kleo_location_id", "");
      localStorage.setItem("kleo_location_name", "");
      navigate("/");
      return;
    }
    setEmpError("Hibás felhasználónév vagy jelszó.");
  };

  const LocationSelect: React.FC = () => (
    <div className="text-left">
      <label className="block text-xs text-gray-600 mb-1">Telephely</label>
      <select
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373] bg-white text-sm"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        required
        aria-label="Telephely kiválasztása"
      >
        {locations.length === 0 && <option value="">Telephelyek betöltése...</option>}
        {locations.length > 0 && !locationId && <option value="">Válassz telephelyet…</option>}
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
            {loc.city ? ` – ${loc.city}` : ""} {loc.address ? ` (${loc.address})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      className="
        relative flex items-center justify-center
        bg-gradient-to-br from-white to-[#f9f5f0]
        px-4
      "
      // Mobil: biztos 100dvh + safe-area
      style={{
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="
          bg-white shadow-2xl rounded-2xl
          w-full max-w-sm sm:max-w-md
          p-6 sm:p-8 md:p-10
          text-center
        "
      >
        <img
          src={kleoLogo}
          alt="Kleoszalon logó"
          className="mx-auto mb-5 sm:mb-6 w-24 sm:w-28 md:w-32 h-auto"
        />
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-5 sm:mb-6">
          Kleoszalon Belépés
        </h2>

        {/* Tabs */}
        <div className="flex text-sm font-medium border-b border-gray-200 mb-5 sm:mb-6">
          <button
            className={`flex-1 py-2 ${
              activeTab === "client"
                ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("client");
              setError("");
              setInfo("");
              setStep(1);
            }}
          >
            Ügyfél belépés
          </button>
          <button
            className={`flex-1 py-2 ${
              activeTab === "employee"
                ? "text-[#d4a373] border-b-2 border-[#d4a373]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("employee");
              setEmpError("");
            }}
          >
            Munkatársi belépés
          </button>
        </div>

        {/* ÜGYFÉL FORM */}
        {activeTab === "client" && (
          <form onSubmit={step === 1 ? handleLogin : handleVerify} className="space-y-4 sm:space-y-5">
            {step === 1 && (
              <>
                <input
                  type="email"
                  placeholder="E-mail cím"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  inputMode="email"
                  autoComplete="email"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                />
                <input
                  type="password"
                  placeholder="Jelszó"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                />

                <div className="text-right -mt-1 sm:-mt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Elfelejtett jelszó?
                  </button>
                </div>

                <LocationSelect />

                <button
                  type="submit"
                  className="w-full bg-[#d4a373] text-white py-3 rounded-xl font-medium hover:bg-[#c29260] transition"
                >
                  Belépés
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-gray-600 text-sm">
                  {info || "Írd be az e-mailben kapott hatjegyű kódot."}
                </p>
                <input
                  type="text"
                  placeholder="Belépési kód"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  inputMode="numeric"
                  pattern="\d*"
                  autoComplete="one-time-code"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373] tracking-widest text-center font-mono"
                />
                <LocationSelect />
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
                >
                  Hitelesítés
                </button>
                <button
                  type="button"
                  className="w-full text-xs text-gray-500 underline"
                  onClick={() => {
                    setStep(1);
                    setCode("");
                    setPassword("");
                    setInfo("");
                    setError("");
                  }}
                >
                  Vissza / Új kód kérése
                </button>
              </>
            )}

            {error && (
              <p className="mt-1 sm:mt-2 text-red-500 text-sm" aria-live="polite">
                {error}
              </p>
            )}
            {info && !error && (
              <p className="mt-1 sm:mt-2 text-green-600 text-sm" aria-live="polite">
                {info}
              </p>
            )}

            {step === 1 && (
              <p className="mt-4 sm:mt-5 text-sm text-gray-500">
                Nincs még fiókod?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-[#d4a373] font-medium hover:underline"
                >
                  Regisztráció (jóváhagyásra vár)
                </button>
              </p>
            )}
          </form>
        )}

        {/* MUNKATÁRSI FORM */}
        {activeTab === "employee" && (
          <form onSubmit={handleEmployeeLogin} className="space-y-4 sm:space-y-5">
            <input
              type="text"
              placeholder="Felhasználónév (pl. admin)"
              value={empLogin}
              onChange={(e) => setEmpLogin(e.target.value)}
              required
              autoComplete="username"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
            <input
              type="password"
              placeholder="Jelszó"
              value={empPass}
              onChange={(e) => setEmpPass(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
            {empError && <p className="text-red-500 text-sm">{empError}</p>}
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
            >
              Belépés (Munkatárs)
            </button>
            <p className="text-[11px] text-gray-500 leading-snug">
              Teszt: <b>admin</b> / <b>admin</b> → admin jogosultság, demo token.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
