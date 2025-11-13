// File: frontend/src/pages/WorkOrdersList.tsx
// Generated: 2025-11-12 22:16
import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { Link } from "react-router-dom";

type WO = {
  id: string;
  status: string;
  title?: string;
  employee_name?: string;
  client_name?: string;
  grand_total?: number;
  created_at?: string;
};

export default function WorkOrdersList(){
  const [items, setItems] = useState<WO[]>([]);
  useEffect(()=>{
    apiFetch("/api/workorders").then(r=>r.json()).then(setItems);
  },[]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Munkalapok</h1>
      <div className="grid gap-3">
        {items.map(w => (
          <Link to={`/workorders/${w.id}`} key={w.id} className="border rounded p-3 hover:bg-gray-50 block">
            <div className="text-sm opacity-70">#{w.id.slice(0,8)}</div>
            <div className="font-medium">{w.title || "Munkalap"}</div>
            <div className="text-sm">{w.employee_name || "-"} • {w.client_name || "-"}</div>
            <div className="text-xs uppercase mt-1">{w.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
