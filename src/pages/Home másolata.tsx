import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // 🔹 új sidebar
import AdminEventModal, {
  Employee,
  Client,
  Service,
  CalendarEvent,
} from "../components/AdminEventModal";
import "./Home.css";

// --- Localizer ---
const locales = {};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

Modal.setAppElement("#root");

const Home: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const navigate = useNavigate();

  // 🔹 Token ellenőrzés
  const token = localStorage.getItem("token");

  // --- Adatok betöltése ---
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Események, dolgozók, vendégek, szolgáltatások
    const endpoints = [
      { key: "events", setter: setEvents },
      { key: "employees", setter: setEmployees },
      { key: "clients", setter: setClients },
      { key: "services", setter: setServices },
    ];

    endpoints.forEach(({ key, setter }) => {
      fetch(`http://localhost:5000/api/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401) {
            navigate("/login");
            throw new Error("Nincs jogosultság");
          }
          return res.json();
        })
        .then((data) => setter(Array.isArray(data) ? data : []))
        .catch((err) => console.error(`${key} betöltési hiba:`, err));
    });
  }, [token, navigate]);

  // --- Megjelenítéshez formázott események ---
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

  // --- Esemény kijelölése ---
  const handleSelectEvent = (event: any) => {
    const found = events.find((e) => e.id === event.id);
    if (found) {
      setSelectedEvent(found);
      setIsModalOpen(true);
    }
  };

  // --- Új időpont kijelölése ---
  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  // --- Mentés / frissítés ---
  const handleSaveEvent = (data: any) => {
    const newEvent: CalendarEvent = {
      id: selectedEvent ? selectedEvent.id : Date.now(),
      title: data.title || "Új bejegyzés",
      start_time: data.start_time,
      end_time: data.end_time,
      employee_id: Number(data.employee_id),
      client_id: Number(data.client_id),
      service_id: Number(data.service_id),
      status: data.status,
      price: Number(data.price),
      payment_method: data.payment_method,
      notes: data.notes,
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
      {/* 🔹 OLDALSÁV */}
      <Sidebar />

      {/* 🔹 FŐTARTALOM */}
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
            views={["day", "week", "month"]}
          />
        </div>

        {/* 🔹 MODAL */}
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

export default Home;
