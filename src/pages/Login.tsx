import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/kleo_logo.png";

type LocationRow = {
  id: string;
  name: string;
  city: string;
  address: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();

  // ---- Tabs: client = Ügyfél, employee = Munkatársi ----
  const [activeTab, setActiveTab] = useState<"client" | "employee">("client");

  // ==== ÜGYFÉL FLOW (változatlan) ====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locationId, setLocationId] = useState("");

  const [step, setStep] = useState<1 | 2>(1); // 1 = jelszó, 2 = e-mail kód
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ==== MUNKATÁRSI FLOW (új) ====
  const [empLogin, setEmpLogin] = useState("");
  const [empPass, setEmpPass] = useState("");
  const [empError, setEmpError] = useState("");

  // ------- biztonságos JSON feldolgozó -------
  const parseJSON = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: "Váratlan szerverválasz" };
    }
  };

  // 🔄 Telephelyek (Ügyfél fülhöz)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/locations", {
          method: "GET",
        });
        const data = await parseJSON(res);

        if (res.ok && Array.isArray(data)) {
          setLocations(data);
          if (data.length > 0 && !locationId) {
            setLocationId(data[0].id);
          }
        } else {
          console.warn("Telephely lista nem érvényes:", data);
        }
      } catch (err) {
        console.error("Telephely lekérdezési hiba:", err);
      }
    };

    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // ✅ Sikeres ÜGYFÉL login befejezése
  const finishClientLogin = (data: any) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("kleo_token", data.token);
    }
    localStorage.setItem("kleo_role", data.role ?? "guest");

    const finalLocId = data.location_id ?? locationId ?? "";
    localStorage.setItem("kleo_location_id", finalLocId);

    let finalLocName = "";
    if (finalLocId && locations.length > 0) {
      const found = locations.find((l) => l.id === finalLocId);
      if (found) finalLocName = found.name;
    }
    localStorage.setItem("kleo_location_name", finalLocName);

    if (email) localStorage.setItem("email", email);

    navigate("/home");
  };

  // ▶ ÜGYFÉL 1. lépés: email + jelszó + telephely
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!locationId) {
      setError("Válassz telephelyet a belépéshez.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, location_id: locationId }),
      });

      const data = await parseJSON(res);
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
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!locationId) {
      setError("Válassz telephelyet a belépéshez.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, location_id: locationId }),
      });

      const data = await parseJSON(res);
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

  // ▶ MUNKATÁRSI belépés (DEMO): admin/admin → admin token
  const handleEmployeeLogin = (e: FormEvent) => {
    e.preventDefault();
    setEmpError("");

    const u = empLogin.trim();
    const p = empPass.trim();

    if (u === "admin" && p === "admin") {
      // készítünk egy egyszerű „tokent” (demo)
      const payload = {
        user_id: "demo-admin-id",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      };
      const fakeToken = btoa(JSON.stringify(payload));

      localStorage.setItem("token", fakeToken);
      localStorage.setItem("kleo_token", fakeToken);
      localStorage.setItem("kleo_role", "admin");

      // munkatársnál most nincs kötelező telephely
      localStorage.setItem("kleo_location_id", "");
      localStorage.setItem("kleo_location_name", "");

      navigate("/home");
      return;
    }

    setEmpError("Hibás felhasználónév vagy jelszó.");
  };

  // Telephely select (Ügyfél űrlaphoz)
  const LocationSelect = () => (
    <div className="text-left">
      <label className="block text-xs text-gray-600 mb-1">Telephely</label>
      <select
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373] bg-white text-sm"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        required
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#f9f5f0]">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center">
        {/* logó */}
        <img src={logo} alt="Kleoszalon logó" className="mx-auto mb-6 w-32 h-auto" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Kleoszalon Belépés</h2>

        {/* Tabs */}
        <div className="flex text-sm font-medium border-b border-gray-200 mb-6">
          <button
            className={`flex-1 py-2 ${
              activeTab === "client" ? "text-[#d4a373] border-b-2 border-[#d4a373]" : "text-gray-500 hover:text-gray-700"
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
              activeTab === "employee" ? "text-[#d4a373] border-b-2 border-[#d4a373]" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("employee");
              setEmpError("");
            }}
          >
            Munkatársi belépés
          </button>
        </div>

        {/* ÜGYFÉL FORM – eredeti flow */}
        {activeTab === "client" && (
          <form onSubmit={step === 1 ? handleLogin : handleVerify} className="space-y-5">
            {step === 1 && (
              <>
                <input
                  type="email"
                  placeholder="E-mail cím"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                />
                <input
                  type="password"
                  placeholder="Jelszó"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
                />
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
            {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            {step === 1 && (
              <p className="mt-5 text-sm text-gray-500">
                Nincs még fiókod?{" "}
                <button onClick={() => navigate("/register")} className="text-[#d4a373] font-medium hover:underline">
                  Regisztráció (jóváhagyásra vár)
                </button>
              </p>
            )}
          </form>
        )}

        {/* MUNKATÁRSI FORM – demo admin/admin */}
        {activeTab === "employee" && (
          <form onSubmit={handleEmployeeLogin} className="space-y-5">
            <input
              type="text"
              placeholder="Felhasználónév (pl. admin)"
              value={empLogin}
              onChange={(e) => setEmpLogin(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
            <input
              type="password"
              placeholder="Jelszó"
              value={empPass}
              onChange={(e) => setEmpPass(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
            {empError && <p className="text-red-500 text-sm">{empError}</p>}
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
              Belépés (Munkatárs)
            </button>
            <p className="text-[11px] text-gray-500 leading-snug">
              Teszt: <b>admin</b> / <b>admin</b> → admin jogosultság, demo token. Később az
              <i> employees</i> tábla <code>login_name</code> + <code>password_hash</code> alapján fog menni.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
