import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";

export interface Employee {
  id: number;
  name: string;
  position?: string;
  color?: string;
}

export interface Client {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
  price?: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  employee_id: number;
  client_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  price?: number;
  payment_method: string;
  notes?: string;
}

export interface AdminEventModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  employees: Employee[] | any; // fallback
  clients: Client[] | any;
  services: Service[] | any;
  event?: CalendarEvent | null;
  slot?: { start: Date; end: Date } | null;
  onSave: (data?: CalendarEvent) => void;
}

const AdminEventModal: React.FC<AdminEventModalProps> = ({
  isOpen,
  onRequestClose,
  employees,
  clients,
  services,
  event,
  slot,
  onSave,
}) => {
  const [form, setForm] = useState({
    title: "",
    employee_id: "",
    client_id: "",
    service_id: "",
    start_time: "",
    end_time: "",
    status: "booked",
    price: "",
    payment_method: "cash",
    notes: "",
  });

  // --- biztosítjuk, hogy ezek mindig tömbök legyenek ---
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeServices = Array.isArray(services) ? services : [];

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        employee_id: event.employee_id?.toString() || "",
        client_id: event.client_id?.toString() || "",
        service_id: event.service_id?.toString() || "",
        start_time: event.start_time?.slice(0, 16) || "",
        end_time: event.end_time?.slice(0, 16) || "",
        status: event.status || "booked",
        price: event.price?.toString() || "",
        payment_method: event.payment_method || "cash",
        notes: event.notes || "",
      });
    } else if (slot) {
      setForm((prev) => ({
        ...prev,
        start_time: slot.start.toISOString().slice(0, 16),
        end_time: slot.end.toISOString().slice(0, 16),
      }));
    }
  }, [event, slot]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CalendarEvent = {
      id: event?.id ?? Date.now(),
      title: form.title,
      employee_id: Number(form.employee_id),
      client_id: Number(form.client_id),
      service_id: Number(form.service_id),
      start_time: form.start_time,
      end_time: form.end_time,
      status: form.status,
      price: Number(form.price),
      payment_method: form.payment_method,
      notes: form.notes,
    };

    try {
      if (event?.id) {
        await axios.put(`/api/events/${event.id}`, payload);
      } else {
        await axios.post("/api/events", payload);
      }
      onSave(payload);
      onRequestClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (event?.id && window.confirm("Biztosan törlöd ezt a bejegyzést?")) {
      try {
        await axios.delete(`/api/events/${event.id}`);
        onSave();
        onRequestClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="w-full max-w-5xl mx-auto mt-16 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-gray-200 dark:border-neutral-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {event ? "Bejegyzés szerkesztése" : "Új bejegyzés"}
        </h2>
        <button
          onClick={onRequestClose}
          className="text-2xl text-gray-500 hover:text-red-500 transition"
        >
          ×
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8"
      >
        {/* Bal oszlop */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            Cím
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          />

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Dolgozó
          </label>
          <select
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          >
            <option value="">Válassz dolgozót</option>
            {safeEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Ügyfél
          </label>
          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          >
            <option value="">Válassz ügyfelet</option>
            {safeClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Középső oszlop */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            Szolgáltatás
          </label>
          <select
            name="service_id"
            value={form.service_id}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          >
            <option value="">Válassz szolgáltatást</option>
            {safeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Kezdés
          </label>
          <input
            type="datetime-local"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          />

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Befejezés
          </label>
          <input
            type="datetime-local"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          />
        </div>

        {/* Jobb oszlop */}
        <div className="flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            Státusz
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          >
            <option value="booked">Foglalt</option>
            <option value="completed">Teljesítve</option>
            <option value="cancelled">Törölve</option>
          </select>

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Ár (Ft)
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          />

          <label className="font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1">
            Fizetési mód
          </label>
          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          >
            <option value="cash">Készpénz</option>
            <option value="card">Bankkártya</option>
            <option value="transfer">Átutalás</option>
          </select>
        </div>

        {/* Megjegyzés */}
        <div className="col-span-full flex flex-col">
          <label className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            Megjegyzés
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-800"
          />
        </div>

        {/* Láb */}
        <div className="col-span-full flex justify-end gap-4 border-t border-gray-200 dark:border-neutral-700 pt-6 mt-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Mentés
          </button>
          {event?.id && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Törlés
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AdminEventModal;
