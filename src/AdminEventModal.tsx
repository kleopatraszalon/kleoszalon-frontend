// src/components/AdminEventModal.tsx
// src/components/AdminEventModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../utils/api"; // csak apiFetch

// Helyi tömb-olvasó: [] | {items:[]} | {data:[]}
async function fetchArray<T>(input: string | Request, init?: RequestInit): Promise<T[]> {
  const r = await apiFetch(input, init);
  const txt = await r.text();
  try {
    const anyData = JSON.parse(txt);
    if (Array.isArray(anyData)) return anyData as T[];
    if (anyData && typeof anyData === "object") {
      if (Array.isArray((anyData as any).items)) return (anyData as any).items as T[];
      if (Array.isArray((anyData as any).data))  return (anyData as any).data  as T[];
    }
    return [];
  } catch {
    return [];
  }
}

// --- típusok ---
export type Employee = { id: string; full_name?: string | null; name?: string | null; color?: string | null };
export type Client   = { id: string; full_name?: string | null; name?: string | null };
export type Service  = { id: string; name?: string | null; duration_minutes?: number | null; color?: string | null };

export type CalendarEvent = {
  id: string;
  title?: string | null;
  start_time: string;
  end_time: string;
  employee_id?: string | null;
  client_id?: string | null;
  service_id?: string | null;
  status?: string | null;
  price?: number | null;
  payment_method?: string | null;
  notes?: string | null;
};



type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
  employees: Employee[];
  clients: Client[];
  services: Service[];
  event: CalendarEvent | null;
  slot: { start: Date; end: Date } | null;
  onSave: (data: any) => void;
};

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toISODate(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toHM(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

function AdminEventModal(props: Props) {
  const { isOpen, onRequestClose, employees, clients, services, event, slot, onSave } = props;
  const [title, setTitle] = useState<string>(event?.title ?? "");
  const [employeeId, setEmployeeId] = useState<string>(event?.employee_id ?? "");
  const [clientId, setClientId] = useState<string>(event?.client_id ?? "");
  const [serviceId, setServiceId] = useState<string>(event?.service_id ?? "");
  const [status, setStatus] = useState<string>(event?.status ?? "booked");
  const [price, setPrice] = useState<string>(event?.price?.toString() ?? "");
  const [payment, setPayment] = useState<string>(event?.payment_method ?? "");
  const [notes, setNotes] = useState<string>(event?.notes ?? "");

  // dátum/idő (slot vagy event)
  const initialDate = event ? new Date(event.start_time) : slot?.start ?? new Date();
  const initialEnd  = event ? new Date(event.end_time)   : slot?.end   ?? new Date();

  const [date, setDate] = useState<string>(toISODate(initialDate));
  const [startHM, setStartHM] = useState<string>(toHM(initialDate));
  const [endHM, setEndHM] = useState<string>(toHM(initialEnd));

  useEffect(() => {
    if (!event && employees.length && !employeeId) setEmployeeId(employees[0].id);
    if (!event && clients.length && !clientId) setClientId(clients[0].id);
    if (!event && services.length && !serviceId) setServiceId(services[0].id);
  }, [employees, clients, services, event, employeeId, clientId, serviceId]);

  if (!isOpen) return null;

  const backdrop: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
  };
  const panel: React.CSSProperties = {
    width: "100%", maxWidth: 720, background: "#fff", borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)", padding: 16
  };
  const input: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px" };

  const save = () => {
    onSave({
      title,
      start_time: `${date} ${startHM}`,
      end_time:   `${date} ${endHM}`,
      employee_id: employeeId,
      client_id: clientId,
      service_id: serviceId,
      status,
      price,
      payment_method: payment,
      notes,
    });
  };

  const content = (
    <div style={backdrop} onClick={(e) => { if (e.target === e.currentTarget) onRequestClose(); }}>
      <div style={panel}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontWeight: 600 }}>Foglalás</h2>
          <button onClick={onRequestClose}>Bezár</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <label>Cím</label>
            <input style={input} value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label>Státusz</label>
            <select style={input} value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="booked">booked</option>
              <option value="confirmed">confirmed</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div>
            <label>Dolgozó</label>
            <select style={input} value={employeeId} onChange={e=>setEmployeeId(e.target.value)}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.full_name ?? e.name ?? e.id}</option>)}
            </select>
          </div>
          <div>
            <label>Ügyfél</label>
            <select style={input} value={clientId} onChange={e=>setClientId(e.target.value)}>
              {clients.map(c=><option key={c.id} value={c.id}>{c.full_name ?? c.name ?? c.id}</option>)}
            </select>
          </div>

          <div>
            <label>Szolgáltatás</label>
            <select style={input} value={serviceId} onChange={e=>setServiceId(e.target.value)}>
              {services.map(s=><option key={s.id} value={s.id}>{s.name ?? s.id}</option>)}
            </select>
          </div>
          <div>
            <label>Ár</label>
            <input style={input} type="number" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>

          <div>
            <label>Fizetés módja</label>
            <input style={input} value={payment} onChange={e=>setPayment(e.target.value)} />
          </div>
          <div>
            <label>Megjegyzés</label>
            <input style={input} value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          <div>
            <label>Dátum</label>
            <input style={input} type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div/>
          <div>
            <label>Kezdés</label>
            <input style={input} type="time" value={startHM} onChange={e=>setStartHM(e.target.value)} />
          </div>
          <div>
            <label>Befejezés</label>
            <input style={input} type="time" value={endHM} onChange={e=>setEndHM(e.target.value)} />
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onRequestClose}>Mégse</button>
          <button onClick={save} style={{ background:"#111", color:"#fff", padding:"6px 10px", borderRadius:8 }}>Mentés</button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default AdminEventModal;
