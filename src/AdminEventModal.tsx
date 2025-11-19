import React, { useEffect, useMemo, useState } from "react";
export type Employee = {
  id: string;
  full_name?: string | null;
  name?: string | null;
};

export type Client = {
  id: string;
  full_name?: string | null;
  name?: string | null;
};

export type Service = {
  id: string;
  name?: string | null;
  service_name?: string | null;
  title?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
};

export type CalendarEvent = {
  id?: string;
  title: string;
  start_time: string;
  end_time: string;
  employee_id?: string | null;
  client_id?: string | null;
  service_ids?: string[];
  status?: string;
  price?: number;
  payment_method?: string;
  notes?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (data: CalendarEvent) => void;
  slotStart?: Date | null;
  slotEnd?: Date | null;
  employees: Employee[];
  clients: Client[];
  services: Service[];
  event?: CalendarEvent | null;
};

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${m}-${day}`;
}

function toHM(d: Date): string {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function addMinutes(hm: string, minutes: number): string {
  const [hh, mm] = hm.split(":").map((x) => parseInt(x, 10) || 0);
  const base = new Date(2000, 0, 1, hh, mm, 0, 0);
  base.setMinutes(base.getMinutes() + minutes);
  return toHM(base);
}

const AdminEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
  slotStart,
  slotEnd,
  employees,
  clients,
  services,
  event,
}) => {
  // --- Alapállapot (slot vagy meglévő event alapján) ---
  const initialStart = useMemo(() => {
    if (event?.start_time) return new Date(event.start_time);
    if (slotStart) return slotStart;
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  }, [event, slotStart]);

  const initialEnd = useMemo(() => {
    if (event?.end_time) return new Date(event.end_time);
    if (slotEnd) return slotEnd;
    const d = new Date(initialStart);
    d.setMinutes(d.getMinutes() + 30);
    return d;
  }, [event, slotEnd, initialStart]);

  const [title, setTitle] = useState(event?.title || "");
  const [status, setStatus] = useState(event?.status || "booked");
  const [date, setDate] = useState(toDateInputValue(initialStart));
  const [startHM, setStartHM] = useState(toHM(initialStart));
  const [endHM, setEndHM] = useState(toHM(initialEnd));
  const [employeeId, setEmployeeId] = useState<string | "">(
    (event?.employee_id as string) || ""
  );
  const [clientId, setClientId] = useState<string | "">(
    (event?.client_id as string) || ""
  );

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    event?.service_ids ?? []
  );

  const [price, setPrice] = useState<string>(
    event?.price != null ? String(event.price) : ""
  );
  const [payment, setPayment] = useState(event?.payment_method || "");
  const [notes, setNotes] = useState(event?.notes || "");

  // --- Szolgáltatásokból össz-idő és összár ---
  const { totalMinutes, autoPrice } = useMemo(() => {
    let minutes = 0;
    let sumPrice = 0;
    for (const id of selectedServiceIds) {
      const s = services.find(
        (x) => x.id === id || x.title === id || (x as any).uuid === id
      );
      if (!s) continue;
      const dur =
        typeof s.duration_minutes === "number" && !isNaN(s.duration_minutes)
          ? s.duration_minutes
          : 30;
      const p =
        typeof s.price === "number" && !isNaN(s.price) ? s.price : 0;
      minutes += dur;
      sumPrice += p;
    }
    if (minutes === 0) minutes = 30;
    return { totalMinutes: minutes, autoPrice: sumPrice };
  }, [selectedServiceIds, services]);

  // End time automatikus frissítése
  useEffect(() => {
    setEndHM(addMinutes(startHM, totalMinutes));
  }, [startHM, totalMinutes]);

  // Ár automatikus javaslat (ha még üres)
  useEffect(() => {
    if (!price && autoPrice > 0) {
      setPrice(String(autoPrice));
    }
  }, [autoPrice, price]);

  // Szolgáltatás kiválasztás (több is lehet)
  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const start_time = `${date} ${startHM}`;
    const end_time = `${date} ${endHM}`;
    onSaved({
      id: event?.id,
      title: title || "Időpont",
      start_time,
      end_time,
      employee_id: employeeId || undefined,
      client_id: clientId || undefined,
      service_ids: selectedServiceIds,
      status,
      price: price ? Number(price) : undefined,
      payment_method: payment || undefined,
      notes: notes || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal">
        <div className="modal-header">
          <h2>Új időpont</h2>
          <button onClick={onClose} className="delete-btn">
            Bezár
          </button>
        </div>

        <div className="tab-content">
          {/* Bal oszlop: alap adatok */}
          <div className="column">
            <label>Cím</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pl. Fodrász – hajvágás"
            />

            <label>Státusz</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="booked">Foglalva</option>
              <option value="confirmed">Megerősítve</option>
              <option value="completed">Elvégezve</option>
              <option value="cancelled">Lemondva</option>
            </select>

            <label>Megjegyzés</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Középső oszlop: ügyfél, dolgozó, szolgáltatások */}
          <div className="column">
            <label>Dolgozó</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">– nincs kiválasztva –</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name ?? e.name ?? e.id}
                </option>
              ))}
            </select>

            <label>Ügyfél</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">– nincs kiválasztva –</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? c.name ?? c.id}
                </option>
              ))}
            </select>

            <label>Szolgáltatások</label>
            <div className="services-list">
              {services.map((s) => {
                const id = s.id;
                const label =
                  s.name || s.service_name || s.title || s.id;
                const dur =
                  typeof s.duration_minutes === "number"
                    ? s.duration_minutes
                    : 30;
                const pr =
                  typeof s.price === "number" ? s.price : undefined;
                const checked = selectedServiceIds.includes(id);
                return (
                  <label key={id} className="service-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(id)}
                    />
                    <span>{label}</span>
                    <span className="service-meta">
                      {dur} perc
                      {pr != null ? ` • ${pr} Ft` : ""}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="service-summary">
              Össz-időtartam: <strong>{totalMinutes} perc</strong>
              {autoPrice > 0 && (
                <>
                  {" "}
                  • Javasolt ár: <strong>{autoPrice} Ft</strong>
                </>
              )}
            </div>
          </div>

          {/* Jobb oszlop: idő és fizetés */}
          <div className="column">
            <label>Dátum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label>Kezdés</label>
            <input
              type="time"
              value={startHM}
              onChange={(e) => setStartHM(e.target.value)}
            />

            <label>Befejezés</label>
            <input
              type="time"
              value={endHM}
              onChange={(e) => setEndHM(e.target.value)}
            />

            <label>Ár</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <label>Fizetés módja</label>
            <input
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="készpénz / bankkártya / utalás..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="delete-btn" onClick={onClose}>
            Mégse
          </button>
          <button className="save-btn" onClick={handleSave}>
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEventModal;
