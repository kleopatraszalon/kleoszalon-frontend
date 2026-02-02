import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchArray, fetchJSON, apiFetch } from "../utils/fetch";

type PickerItem = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  title?: string | null;
  color?: string | null;
};

type Props = {
  onSaved: () => void;
  onClose: () => void;

  /** Napi nézetben kattintott munkatárs id-ja (előválasztás) */
  initialEmployeeId?: string;

  /** Kiválasztott nap: 'YYYY-MM-DD' */
  initialDate?: string;

  /** Kattintott slot kezdete percben 0–1440 között (pl. 9:30 -> 570) */
  initialStartMinutes?: number;

  /** Alapértelmezett időtartam percben (pl. 30) */
  initialDurationMinutes?: number;
};

// ======== Segédfüggvények ========
function pad2(n: number) { return String(n).padStart(2, "0"); }

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nowHM(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function addMinutesHM(hm: string, mins: number): string {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m || 0, 0, 0);
  d.setMinutes(d.getMinutes() + mins);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function displayName(x: PickerItem) { return x.full_name ?? x.name ?? x.title ?? x.id; }

// 15 perces rácsra igazítás
function snapToGrid(hm: string, stepMinutes = 15, direction: "nearest" | "up" | "down" = "nearest"): string {
  const [h, m] = hm.split(":").map(Number);
  let total = h * 60 + (m || 0);
  const mod = total % stepMinutes;

  if (direction === "nearest") {
    if (mod === 0) return hm;
    const down = total - mod;
    const up = total + (stepMinutes - mod);
    total = (total - down) < (up - total) ? down : up;
  } else if (direction === "up") {
    if (mod !== 0) total += (stepMinutes - mod);
  } else {
    total -= mod;
  }

  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${pad2(((hh % 24) + 24) % 24)}:${pad2(((mm % 60) + 60) % 60)}`;
}

// ISO egyesítő
function combineISO(dateISO: string, hm: string): string {
  return `${dateISO} ${hm}`;
}

// Alap időintervallum validáció (kliense oldalon)
function validateIntervalLocal(dateISO: string, startHM: string, endHM: string): string | null {
  if (!dateISO || !startHM || !endHM) return "Hiányzó időadatok.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return "Érvénytelen dátum.";
  if (!/^\d{2}:\d{2}$/.test(startHM) || !/^\d{2}:\d{2}$/.test(endHM)) return "Érvénytelen időformátum.";
  const [sh, sm] = startHM.split(":").map(Number);
  const [eh, em] = endHM.split(":").map(Number);
  const sMin = sh * 60 + sm;
  const eMin = eh * 60 + em;
  if (eMin <= sMin) return "A befejezésnek a kezdés után kell lennie.";
  if (eMin - sMin < 5) return "Túl rövid intervallum (min. 5 perc).";
  return null;
}

// ======== Komponens ========
export function AppointmentNewModal({ onSaved, onClose }: Props) {
  // pickerek
  const [locations, setLocations] = useState<PickerItem[]>([]);
  const [employees, setEmployees] = useState<PickerItem[]>([]);
  const [clients, setClients] = useState<PickerItem[]>([]);
  const [services, setServices] = useState<PickerItem[]>([]);

  // űrlap state
  const [locationId, setLocationId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");

  const [date, setDate] = useState<string>(todayISO());
  const [startHM, setStartHM] = useState<string>(nowHM());
  const [endHM, setEndHM] = useState<string>(addMinutesHM(nowHM(), 30));
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // szerver oldali ütközés infó
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  // pickerek betöltése – fetchArray mindig tömböt ad
  const loadPickers = useCallback(async () => {
    try {
      const [locs, emps, cls, svs] = await Promise.all([
        fetchArray<PickerItem>("/api/locations"),
        fetchArray<PickerItem>("/api/employees"),
        fetchArray<PickerItem>("/api/clients"),
        fetchArray<PickerItem>("/api/services"),
      ]);
      setLocations(locs);
      setEmployees(emps);
      setClients(cls);
      setServices(svs);

      // alapértelmezések
      if (!locationId && locs[0]?.id) setLocationId(locs[0].id);
      if (!employeeId && emps[0]?.id) setEmployeeId(emps[0].id);
      if (!clientId && cls[0]?.id) setClientId(cls[0].id);
      if (!serviceId && svs[0]?.id) setServiceId(svs[0].id);
    } catch (e) {
      console.error("picker load failed:", e);
      setError("A választólisták betöltése sikertelen.");
      setLocations([]); setEmployees([]); setClients([]); setServices([]);
    }
  }, [clientId, employeeId, locationId, serviceId]);

  useEffect(() => { loadPickers(); }, [loadPickers]);

  // 15 perces rácsra húzás blur-kor
  const onStartBlur = useCallback(() => setStartHM(snapToGrid(startHM, 15, "nearest")), [startHM]);
  const onEndBlur   = useCallback(() => setEndHM(snapToGrid(endHM, 15, "nearest")), [endHM]);

  // Szerver oldali ütközés-ellenőrzés (alkalmazott + hely + idő)
  const checkConflicts = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const localErr = validateIntervalLocal(date, startHM, endHM);
      if (localErr) { setConflicts([]); setError(localErr); return; }

      const startIso = combineISO(date, startHM);
      const endIso   = combineISO(date, endHM);

      // GET: /api/appointments/conflicts?employee_id=&location_id=&start=&end=
      // A válasz lehet: [] (nincs ütközés), tömb (ütköző tételek), vagy boolean (true=ütközés).
      const q = new URLSearchParams({
        employee_id: employeeId || "",
        location_id: locationId || "",
        start: startIso,
        end: endIso,
      }).toString();

      // Tömbösítve kérjük el a választ, boolean esetén []/[*] lesz
      const raw = await fetchJSON<any>(`/api/appointments/conflicts?${q}`, undefined, []);
      let list: any[] = [];

      if (Array.isArray(raw)) list = raw;
      else if (raw === true)  list = [{ id: "_conflict_", title: "Ütközés" }];
      else if (raw && typeof raw === "object") {
        // gyakori szerkezetek
        if (Array.isArray((raw as any).items)) list = (raw as any).items;
        else if (Array.isArray((raw as any).data)) list = (raw as any).data;
        else list = Object.values(raw).every(v => typeof v === "object") ? Object.values(raw) : [];
      }

      setConflicts(list);
      if (list.length > 0) {
        setError(`Ütköző foglalás található (${list.length} db). Kérem válassz másik időpontot.`);
      }
    } catch (e) {
      console.error("conflict check failed:", e);
      setError("Az ütközésellenőrzés sikertelen.");
      setConflicts([]);
    } finally {
      setChecking(false);
    }
  }, [date, startHM, endHM, employeeId, locationId]);

  // Űrlap változásakor újra ellenőrizhetünk (debounce-olható, most egyszerűsítve)
  useEffect(() => { if (employeeId && locationId) { void checkConflicts(); } }, [employeeId, locationId, date, startHM, endHM, checkConflicts]);

  const canSubmit = useMemo(() => {
    const hasBasics = locationId && employeeId && clientId && serviceId && date && startHM && endHM;
    const localErr = validateIntervalLocal(date, startHM, endHM);
    return !!(hasBasics && !localErr && conflicts.length === 0 && !checking);
  }, [locationId, employeeId, clientId, serviceId, date, startHM, endHM, conflicts.length, checking]);

  // Mentés
  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // lokális check
      const localErr = validateIntervalLocal(date, startHM, endHM);
      if (localErr) throw new Error(localErr);

      if (conflicts.length > 0) {
        throw new Error("Ütköző foglalás van erre az időpontra. Válassz másik időablakot.");
      }

      const startIso = combineISO(date, snapToGrid(startHM, 15, "nearest"));
      const endIso   = combineISO(date, snapToGrid(endHM, 15, "nearest"));

      const payload = {
        location_id: locationId,
        employee_id: employeeId,
        client_id: clientId,
        service_id: serviceId,
        start_time: startIso,
        end_time: endIso,
        note: note || null,
        status: "booked",
      };

      const res = await apiFetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      onSaved();
    } catch (e: any) {
      console.error("create appointment failed:", e);
      setError(e?.message || "A mentés sikertelen.");
    } finally {
      setSaving(false);
    }
  }, [locationId, employeeId, clientId, serviceId, date, startHM, endHM, note, conflicts.length, onSaved]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">Új időpont</h2>
          <button onClick={onClose} className="px-3 py-1 rounded border hover:bg-gray-50">Bezár</button>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
            {checking && <span className="ml-2 opacity-70">(ellenőrzés…)</span>}
          </div>
        )}

        {/* Választók */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Telephely</label>
            <select className="w-full border rounded px-2 py-1" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              {locations.map((x) => <option key={x.id} value={x.id}>{displayName(x)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Munkatárs</label>
            <select className="w-full border rounded px-2 py-1" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((x) => <option key={x.id} value={x.id}>{displayName(x)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Ügyfél</label>
            <select className="w-full border rounded px-2 py-1" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((x) => <option key={x.id} value={x.id}>{displayName(x)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Szolgáltatás</label>
            <select className="w-full border rounded px-2 py-1" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((x) => <option key={x.id} value={x.id}>{displayName(x)}</option>)}
            </select>
          </div>
        </div>

        {/* Időzítés + rácsra igazítás blur-kor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Dátum</label>
            <input type="date" className="w-full border rounded px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Kezdés</label>
            <input
              type="time"
              className="w-full border rounded px-2 py-1"
              value={startHM}
              onChange={(e) => setStartHM(e.target.value)}
              onBlur={onStartBlur}
              step={900} // 15 perc
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Befejezés</label>
            <input
              type="time"
              className="w-full border rounded px-2 py-1"
              value={endHM}
              onChange={(e) => setEndHM(e.target.value)}
              onBlur={onEndBlur}
              step={900}
            />
          </div>
        </div>

        {/* Konfliktus lista (ha van) */}
        {conflicts.length > 0 && (
          <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
            <div className="font-medium mb-1">Ütközések:</div>
            <ul className="list-disc ml-5 space-y-1">
              {conflicts.map((c: any, i: number) => (
                <li key={c?.id ?? i}>
                  {c?.title ?? c?.service_name ?? "Foglalás"} — {c?.start_time} → {c?.end_time}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Akciók */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1 rounded border hover:bg-gray-50" disabled={saving}>Mégse</button>
          <button
            onClick={submit}
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-60"
            disabled={!canSubmit || saving}
            title={!canSubmit ? "Ellenőrizd az időpontot és az ütközéseket." : "Mentés"}
          >
            {saving ? "Mentés…" : "Létrehozás"}
          </button>
        </div>
      </div>
    </div>
  );
}
