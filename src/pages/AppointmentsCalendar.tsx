import React, { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";

type Appt = {
  id: string;
  employee_name?: string | null;
  client_name?: string | null;
  service_name?: string | null;
  title?: string | null;
  start_time: string; // ISO
  end_time: string;   // ISO
  status?: string | null;
  employee_id?: string | null;
  location_id?: string | null;
};

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeJson<T>(txt: string, fallback: T): T {
  try { return JSON.parse(txt) as T; } catch { return fallback; }
}

function toArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object") {
    const anyx: any = x;
    if (Array.isArray(anyx.items)) return anyx.items as T[];
    if (Array.isArray(anyx.data))  return anyx.data as T[];
    const vals = Object.values(anyx);
    if (vals.length && vals.every(v => typeof v === "object")) return vals as T[];
  }
  return [];
}

export default function AppointmentsCalendar() {
  const [day, setDay] = useState<string>(todayISODate());
  const [items, setItems] = useState<Appt[]>([]);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/appointments?from=${day} 00:00&to=${day} 23:59`);
      const text = await res.text();
      const raw = safeJson<any>(text, []);
      const arr = toArray<Appt>(raw);
      setItems(arr);
    } catch (e) {
      console.error("appointments load error:", e);
      setItems([]);
    }
  }, [day]);

  useEffect(() => { load(); }, [load]);

  const list = Array.isArray(items) ? items : [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Naptár</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            className="px-3 py-1 rounded bg-black text-white"
            onClick={() => setShowNew(true)}
          >
            Létrehozás
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((a) => (
          <div key={a.id} className="rounded border p-3">
            <div className="text-sm opacity-70">
              {a.start_time} → {a.end_time}
            </div>
            <div className="font-medium">
              {a?.title || a?.service_name || "Időpont"}
            </div>
            <div className="text-sm">
              {(a.employee_name ?? "-")} • {(a.client_name ?? "-")}
            </div>
            {a.status && (
              <div className="text-xs mt-1 uppercase tracking-wide">{a.status}</div>
            )}
          </div>
        ))}
      </div>

      {showNew && (
        <AppointmentNewModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
