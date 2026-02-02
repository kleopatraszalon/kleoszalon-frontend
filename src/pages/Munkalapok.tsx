import React, { useEffect, useState } from "react";
import axios from "axios";

interface WorkOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  start_at?: string;
  end_at?: string;
  guest_name?: string;
  salon_name?: string;
  created_by?: string;
}

const Munkalapok: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    axios
      // 🔹 Típusmegadás a visszatérő adatnak
      .get<WorkOrder[]>("http://localhost:5000/api/workorders")
      .then((res) => {
        // 🔹 res.data már WorkOrder[] típusú, nem unknown
        setWorkOrders(res.data);
      })
      .catch((err) => console.error("API hiba:", err));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Munkalapok</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th>ID</th>
            <th>Vendég</th>
            <th>Szalon</th>
            <th>Státusz</th>
            <th>Összeg</th>
            <th>Létrehozta</th>
            <th>Dátum</th>
          </tr>
        </thead>

        <tbody>
          {workOrders.map((wo) => (
            <tr key={wo.id}>
              <td>{wo.id.slice(0, 8)}</td>
              <td>{wo.guest_name || "-"}</td>
              <td>{wo.salon_name || "-"}</td>
              <td>{wo.status}</td>
              <td>{wo.total_amount.toFixed(2)} Ft</td>
              <td>{wo.created_by || "-"}</td>
              <td>{new Date(wo.created_at).toLocaleString("hu-HU")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Munkalapok;
