import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios példány a backendhez

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("kleo_token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await api.get("/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user || { full_name: "User", id: 0, email: "", role: "" });
      } catch (err: any) {
        console.error(err);
        setError("A token érvénytelen vagy lejárt.");
        localStorage.removeItem("kleo_token");
        localStorage.removeItem("kleo_user");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) return <p>Betöltés...</p>;

  return (
    <div style={{ padding: 20 }}>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <h1>Üdv, {user?.full_name || "User"}</h1>
      <p>Ez a zárt terület.</p>
    </div>
  );
};

export default Dashboard;
