// src/pages/WorkOrderNew.tsx
// Egyszerű „Új munkalap” űrlap

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";
import { useCurrentUser } from "../hooks/useCurrentUser";

type WorkOrderPayload = {
  title: string;
  notes: string;
};

const WorkOrderNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [form, setForm] = useState<WorkOrderPayload>({ title: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("A munkalap címe kötelező");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const data = await apiFetch<{ id?: string } | null>("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (data && data.id) {
        navigate(`/workorders/${data.id}`);
      } else {
        navigate("/workorders");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Hiba a mentés során");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />
      <main className="calendar-container">
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          Új munkalap
        </h2>

        {error && (
          <div style={{ color: "#dc2626", marginBottom: "0.75rem" }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: 480, display: "grid", gap: "0.75rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: 4,
              }}
            >
              Cím *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.4rem 0.6rem",
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: 4,
              }}
            >
              Megjegyzés
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                padding: "0.4rem 0.6rem",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                backgroundColor: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "0.45rem 1.1rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Mentés..." : "Mentés"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/workorders")}
              style={{
                backgroundColor: "#e5e7eb",
                color: "#111827",
                border: "none",
                borderRadius: 6,
                padding: "0.45rem 1.1rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Mégse
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default WorkOrderNew;
