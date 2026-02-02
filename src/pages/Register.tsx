// src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "./Login.css"; // ugyanazt a kinézetet használjuk
import logo from "../assets/kleo_logo.png";
import bg from "../assets/background_register.webp"; // háttér a kártyára

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      // /api/register – a backend itt küldje az e-mailt a megerősítő linkkel
      const response = await axios.post<RegisterResponse>("/api/register", formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        alert(
          "Sikeres regisztráció! Kérlek, ellenőrizd az e-mail fiókodat és erősítsd meg a regisztrációd."
        );
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
    <div className="login-page">
      <div className="login-card">
        <div
          className="login-card-bg"
          style={{ backgroundImage: `url(${bg})` }}
        />
        <div className="login-card-overlay" />
        <div className="login-card-inner">
          {/* LOGÓ KÖZÉPEN */}
          <div className="login-header">
            <div className="login-logo">
              <img src={logo} alt="Kleoszalon logó" />
            </div>
          </div>

          <h1 className="login-title">Kleoszalon Regisztráció</h1>
          <p className="login-subtitle">
            Kérjük, add meg az adataidat a fiók létrehozásához.
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Szöveges mezők */}
            <div className="login-field">
              <label className="login-label">Teljes név</label>
              <input
                type="text"
                name="full_name"
                className="login-input"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">E-mail</label>
              <input
                type="email"
                name="email"
                className="login-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Jelszó</label>
              <input
                type="password"
                name="password"
                className="login-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Irányítószám</label>
              <input
                type="text"
                name="zip_code"
                className="login-input"
                value={formData.zip_code}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Város</label>
              <input
                type="text"
                name="city"
                className="login-input"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Cím</label>
              <input
                type="text"
                name="address"
                className="login-input"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Születési dátum</label>
              <input
                type="date"
                name="birth_date"
                className="login-input"
                value={formData.birth_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Nem</label>
              <select
                name="gender"
                className="login-input"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Válassz...</option>
                <option value="male">Férfi</option>
                <option value="female">Nő</option>
              </select>
            </div>

            <div className="login-field">
              <label className="login-label">Hogyan hallott rólunk?</label>
              <input
                type="text"
                name="heard_about_us"
                className="login-input"
                value={formData.heard_about_us}
                onChange={handleChange}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Legközelebbi szalon</label>
              <input
                type="text"
                name="nearest_salon"
                className="login-input"
                value={formData.nearest_salon}
                onChange={handleChange}
              />
            </div>

            {/* Checkboxok */}
            <div className="login-checkbox-group">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                Kérek értesítést az akciókról
              </label>

              <label className="login-checkbox">
                <input
                  type="checkbox"
                  name="loyalty_program"
                  checked={formData.loyalty_program}
                  onChange={handleChange}
                />
                Részt kívánok venni a pontgyűjtő rendszerben
              </label>

              <label className="login-checkbox">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  required
                />
                Elfogadom az adatkezelési feltételeket
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? "Regisztráció..." : "Regisztráció"}
            </button>

            <div className="login-footer">
              Már van fiókod?{" "}
              <button
                type="button"
                className="login-footer-link"
                onClick={() => navigate("/login")}
              >
                Belépés
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
