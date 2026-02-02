// src/pages/WorkOrderView.tsx
// Egy munkalap részletes nézete

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";
import { useCurrentUser } from "../hooks/useCurrentUser";

type WorkOrder = {
  id: string;
  title: string;
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

const WorkOrderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Biztos megoldás: listából keressük ki
        const all = await apiFetch<any[]>("/api/workorders");
        const found = Array.isArray(all)
          ? all.find((x) => String(x.id) === String(id))
          : null;

        if (!found) {
          setError("A munkalap nem található");
          setWorkOrder(null);
        } else {
          setWorkOrder({
            id: String(found.id),
            title: found.title ?? "",
            notes: found.notes ?? found.description ?? "",
            status: found.status,
            created_at: found.created_at,
            updated_at: found.updated_at,
          });
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Nem sikerült betölteni a munkalapot");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />
      <main className="calendar-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Munkalap részletei
          </h2>
          <Link
            to="/workorders"
            style={{
              fontSize: "0.85rem",
              textDecoration: "none",
              color: "#4f46e5",
            }}
          >
            ← Vissza a listához
          </Link>
        </div>

        {loading && <p>Betöltés...</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {!loading && !error && workOrder && (
          <div
            style={{
              padding: "1rem",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
              maxWidth: 640,
            }}
          >
            <p>
              <strong>Azonosító:</strong> {workOrder.id}
            </p>
            <p>
              <strong>Cím:</strong> {workOrder.title}
            </p>
            <p>
              <strong>Státusz:</strong> {workOrder.status || "—"}
            </p>
            <p>
              <strong>Létrehozva:</strong>{" "}
              {workOrder.created_at
                ? new Date(workOrder.created_at).toLocaleString("hu-HU")
                : "—"}
            </p>
            <p>
              <strong>Módosítva:</strong>{" "}
              {workOrder.updated_at
                ? new Date(workOrder.updated_at).toLocaleString("hu-HU")
                : "—"}
            </p>
            {workOrder.notes && (
              <p style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap" }}>
                <strong>Megjegyzés:</strong>
                <br />
                {workOrder.notes}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkOrderView;
