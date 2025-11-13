// File: frontend/src/pages/WorkOrderNew.tsx
// Generated: 2025-11-12 22:16
import React, { useState } from "react";
import { apiFetch } from "../../utils/api";

export default function WorkOrderNew(){
  const [appointmentId, setAppointmentId] = useState("");
  const [newId, setNewId] = useState<string | null>(null);

  async function create(){ 
    const r = await apiFetch(`/api/workorders/from-appointment/${appointmentId}`, { method:"POST" });
    const j = await r.json();
    setNewId(j.id);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Új munkalap foglalásból</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-sm">Foglalás ID
          <input className="border rounded w-full px-2 py-1" value={appointmentId} onChange={e=>setAppointmentId(e.target.value)} />
        </label>
        <div className="flex items-end">
          <button className="px-3 py-1 rounded bg-black text-white" onClick={create}>Létrehozás</button>
        </div>
      </div>
      {newId && (
        <div className="mt-4 text-sm">
          Létrehozva: <a className="underline" href={`/workorders/${newId}`}>{newId}</a>
        </div>
      )}
    </div>
  );
}
