// File: frontend/src/components/AppointmentNewModal.tsx
// Purpose: create new appointment (MVP) with minimal required fields
// Generated: 2025-11-12 16:21
import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

type Item = { id: string; name: string };

export function AppointmentNewModal({ onSaved, onClose }:{ onSaved:()=>void; onClose:()=>void; }){
  const [locations, setLocations] = useState<Item[]>([]);
  const [employees, setEmployees] = useState<Item[]>([]);
  const [clients,   setClients]   = useState<Item[]>([]);
  const [services,  setServices]  = useState<Item[]>([]);

  const [locationId, setLocationId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [clientId,   setClientId]   = useState<string>("");
  const [serviceId,  setServiceId]  = useState<string>("");
  const [start,      setStart]      = useState<string>("");
  const [end,        setEnd]        = useState<string>("");
  const [title,      setTitle]      = useState<string>("");
  const [notes,      setNotes]      = useState<string>("");

  useEffect(()=>{
    // Basic lookups (replace endpoints with your actual ones if different)
    apiFetch("/api/locations").then(r=>r.json()).then(setLocations);
    apiFetch("/api/employees").then(r=>r.json()).then(setEmployees);
    apiFetch("/api/clients").then(r=>r.json()).then(setClients);
    apiFetch("/api/services").then(r=>r.json()).then(setServices);
  },[]);

  async function save(){
    const body = { location_id: locationId, employee_id: employeeId, client_id: clientId || null,
                   service_id: serviceId, title: title || null, start_time: start, end_time: end, notes };
    await apiFetch("/api/appointments", { method:"POST", body: JSON.stringify(body) });
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Új időpont</h2>
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1 rounded bg-black text-white">Létrehozás</button>
            <button onClick={onClose} className="px-3 py-1 rounded border">Mégse</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">Telephely
            <select value={locationId} onChange={e=>setLocationId(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">-- válassz --</option>
              {locations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>

          <label className="text-sm">Munkatárs
            <select value={employeeId} onChange={e=>setEmployeeId(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">-- válassz --</option>
              {employees.map(x=><option key={x.id} value={x.id}>{(x as any).full_name || x.name}</option>)}
            </select>
          </label>

          <label className="text-sm">Ügyfél
            <select value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">-- (opcionális) --</option>
              {clients.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>

          <label className="text-sm">Szolgáltatás
            <select value={serviceId} onChange={e=>setServiceId(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">-- válassz --</option>
              {services.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>

          <label className="text-sm">Kezdés
            <input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} className="w-full border rounded px-2 py-1" />
          </label>

          <label className="text-sm">Befejezés
            <input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} className="w-full border rounded px-2 py-1" />
          </label>

          <label className="text-sm md:col-span-2">Cím (opcionális)
            <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-2 py-1" />
          </label>

          <label className="text-sm md:col-span-2">Megjegyzés
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border rounded px-2 py-1" rows={3}></textarea>
          </label>
        </div>
      </div>
    </div>
  );
}
