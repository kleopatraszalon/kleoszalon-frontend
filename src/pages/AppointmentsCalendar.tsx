// File: frontend/src/pages/AppointmentsCalendar.tsx
// Purpose: simple day view and creation modal launcher (MVP)
// Generated: 2025-11-12 16:21
import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";

type Appt = {
  id: string;
  employee_name?: string;
  client_name?: string;
  service_name?: string;
  title?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
};

export default function AppointmentsCalendar(){
  const [items,setItems] = useState<Appt[]>([]);
  const [day, setDay] = useState<string>(new Date().toISOString().slice(0,10));
  const [showNew, setShowNew] = useState(false);

  function load(){
    apiFetch(`/api/appointments?from=${day} 00:00&to=${day} 23:59`)
      .then(r=>r.json()).then(setItems);
  }

  useEffect(()=>{ load(); },[day]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Naptár – {day}</h1>
        <div className="flex gap-2">
          <input type="date" value={day} onChange={e=>setDay(e.target.value)} className="border px-2 py-1 rounded" />
          <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>setShowNew(true)}>Létrehozás</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(a => (
          <div key={a.id} className="rounded border p-3">
            <div className="text-sm opacity-70">{a.start_time} → {a.end_time}</div>
            <div className="font-medium">{a.title || a.service_name || "Időpont"}</div>
            <div className="text-sm">{a.employee_name || "-"} • {a.client_name || "-"}</div>
            <div className="text-xs mt-1 uppercase tracking-wide">{a.status}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <AppointmentNewModal
          onClose={()=>setShowNew(false)}
          onSaved={()=>{ setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
