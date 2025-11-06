// src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/kleo_logo.png";
import bg from "../assets/background_register.webp"; // ← háttérkép

interface FormData {
  full_name: string;
  email: string;
  password: string;
  zip_code: string;
  city: string;
  address: string;
  birth_date: string;
  gender: string;
  heard_about_us: string;
  nearest_salon: string;
  newsletter: boolean;
  loyalty_program: boolean;
  consent: boolean;
}

interface RegisterResponse {
  success: boolean;
  error?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    password: "",
    zip_code: "",
    city: "",
    address: "",
    birth_date: "",
    gender: "",
    heard_about_us: "",
    nearest_salon: "",
    newsletter: false,
    loyalty_program: false,
    consent: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setFormData((prev) => ({ ...prev, [target.name]: value } as FormData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.consent) {
      setError("Az adatkezelési feltételek elfogadása kötelező.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post<RegisterResponse>("/api/register", formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        alert("Sikeres regisztráció! Ellenőrizd az emailedet.");
        navigate("/login");
      } else {
        setError(response.data.error || "Hiba a regisztráció során.");
      }
    } catch (err: any) {
      console.error("Regisztráció hiba:", err);
      setError(err?.response?.data?.error || "Hálózati hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* sötét overlay a jobb olvashatóságért */}
      <div className="min-h-screen w-full bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center">
          <img src={logo} alt="Kleoszalon logó" className="mx-auto mb-6 w-32 h-auto" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            Kleoszalon Regisztráció
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {[
              { name: "full_name", placeholder: "Teljes név", type: "text" },
              { name: "email", placeholder: "E-mail", type: "email" },
              { name: "password", placeholder: "Jelszó", type: "password" },
              { name: "zip_code", placeholder: "Irányítószám", type: "text" },
              { name: "city", placeholder: "Város", type: "text" },
              { name: "address", placeholder: "Cím", type: "text" },
              { name: "birth_date", placeholder: "Születési dátum", type: "date" },
            ].map((input) => (
              <input
                key={input.name}
                type={input.type}
                name={input.name}
                placeholder={input.placeholder}
                value={(formData as any)[input.name]}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
              />
            ))}

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            >
              <option value="">Nem</option>
              <option value="male">Férfi</option>
              <option value="female">Nő</option>
            </select>

            <input
              type="text"
              name="heard_about_us"
              placeholder="Hogyan hallott rólunk?"
              value={formData.heard_about_us}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />
            <input
              type="text"
              name="nearest_salon"
              placeholder="Legközelebbi szalon"
              value={formData.nearest_salon}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
            />

            {/* Checkboxok */}
            <div className="flex flex-col space-y-2 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="mr-2"
                />
                Kérek értesítést az akciókról
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="loyalty_program"
                  checked={formData.loyalty_program}
                  onChange={handleChange}
                  className="mr-2"
                />
                Részt kívánok venni a pontgyűjtő rendszerben
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                Elfogadom az adatkezelési feltételeket
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white mt-4 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#d4a373] hover:bg-[#c29260]"
              }`}
            >
              {loading ? "Regisztráció..." : "Regisztráció"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
