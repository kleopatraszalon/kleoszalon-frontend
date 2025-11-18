// src/pages/WorkOrdersList.tsx
// Munkalapok listája

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { apiFetch } from "../utils/api";
import { useCurrentUser } from "../hooks/useCurrentUser";

type WorkOrder = {
  id: string;
  title: string;
  status?: string;
  created_at?: string;
};

const WorkOrdersList: React.FC = () => {
  const { user } = useCurrentUser();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch<any[]>("/api/workorders");

        if (Array.isArray(data)) {
          setItems(
            data.map((d: any) => ({
              id: String(d.id),
              title: d.title ?? "",
              status: d.status,
              created_at: d.created_at,
            }))
          );
        } else {
          setItems([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Nem sikerült betölteni a munkalapokat");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Munkalapok</h2>
          <Link
            to="/workorders/new"
            style={{
              backgroundColor: "#4f46e5",
              color: "#fff",
              borderRadius: 6,
              padding: "0.35rem 0.9rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + Új munkalap
          </Link>
        </div>

        {loading && <p>Betöltés...</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {!loading && !error && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>
                  Azonosító
                </th>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>Cím</th>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>
                  Státusz
                </th>
                <th style={{ textAlign: "left", padding: "0.4rem" }}>
                  Létrehozva
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((wo) => (
                <tr key={wo.id}>
                  <td
                    style={{
                      padding: "0.4rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <Link to={`/workorders/${wo.id}`}>{wo.id}</Link>
                  </td>
                  <td
                    style={{
                      padding: "0.4rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    {wo.title}
                  </td>
                  <td
                    style={{
                      padding: "0.4rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    {wo.status || "—"}
                  </td>
                  <td
                    style={{
                      padding: "0.4rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    {wo.created_at
                      ? new Date(wo.created_at).toLocaleString("hu-HU")
                      : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: "0.6rem", textAlign: "center" }}
                  >
                    Nincs még munkalap.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default WorkOrdersList;
