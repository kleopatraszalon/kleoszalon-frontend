// src/pages/Calendar.tsx
import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AdminEventModal, {
  Employee,
  Client,
  Service,
  CalendarEvent,
} from "../components/AdminEventModal";
import "./Home.css";

// --- Localizer ---
const locales = {};
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Egységesítjük a service rekordokat (id / név eltérő oszlopnevekhez is jó)
  const normService = (s: any) => ({
    id: s.id ?? s.uuid ?? s.service_id,
    name: s.name ?? s.service_name ?? s.title ?? "Szolgáltatás",
    duration_minutes: s.duration_minutes ?? s.duration ?? s.length ?? 30,
    price: s.price ?? s.list_price ?? s.unit_price ?? 0,
    color: s.color ?? null,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchWithAuth = (url: string) =>
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (r.status === 401) {
            navigate("/login");
            throw new Error("401 Unauthorized");
          }
          return r.json().catch(() => []);
        })
        .catch(() => []);

    (async () => {
      const [evs, emps, cls] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/events"),
        fetchWithAuth("http://localhost:5000/api/employees"),
        fetchWithAuth("http://localhost:5000/api/clients"),
      ]);

      setEvents(Array.isArray(evs) ? evs : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setClients(Array.isArray(cls) ? cls : []);

      // Szolgáltatások: /api/services, ha üres, próba /api/masters/services
      let sv = await fetchWithAuth("http://localhost:5000/api/services");
      if (!Array.isArray(sv) || sv.length === 0) {
        sv = await fetchWithAuth("http://localhost:5000/api/masters/services");
      }
      setServices((Array.isArray(sv) ? sv : []).map(normService));
    })();
  }, [token, navigate]);

  // Naptár események mappelése
  const mappedEvents = events.map((ev) => {
    const employee = employees.find((e) => e.id === ev.employee_id);
    return {
      id: ev.id,
      title: ev.title,
      start: new Date(ev.start_time),
      end: new Date(ev.end_time),
      resource: ev.employee_id,
      style: { backgroundColor: employee?.color || "#4caf50" },
    };
  });

  const handleSelectEvent = (event: any) => {
    const found = events.find((e) => e.id === event.id);
    if (found) {
      setSelectedEvent(found);
      setIsModalOpen(true);
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (data: any) => {
    const newEvent: CalendarEvent = {
      id: selectedEvent ? selectedEvent.id : String(Date.now()),
      title: data.title || "Új bejegyzés",
      start_time: data.start_time,
      end_time: data.end_time,
      employee_id: String(data.employee_id || ""),
      client_id: String(data.client_id || ""),
      service_id: String(data.service_id || ""),
      status: data.status,
      price: data.price !== undefined && data.price !== "" ? Number(data.price) : null,
      payment_method: data.payment_method ?? "",
      notes: data.notes ?? "",
    };

    if (selectedEvent) {
      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? newEvent : e)));
    } else {
      setEvents((prev) => [...prev, newEvent]);
    }
    setIsModalOpen(false);

    fetch(`http://localhost:5000/api/events${selectedEvent ? `/${selectedEvent.id}` : ""}`, {
      method: selectedEvent ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newEvent),
    }).catch(console.error);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold mb-1">Naptár</h2>
          <p className="text-gray-500 dark:text-gray-400">Időpontok és foglalások kezelése</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4">
          <Calendar
            localizer={localizer}
            events={mappedEvents}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            style={{ height: "85vh" }}
            defaultView="week"
            views={{ month: true, week: true, day: true }}
          />
        </div>

        <AdminEventModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          employees={employees}
          clients={clients}
          services={services}
          event={selectedEvent}
          slot={selectedSlot}
          onSave={handleSaveEvent}
        />
      </main>
    </div>
  );
};

export default CalendarPage;
