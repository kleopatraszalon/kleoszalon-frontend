import React from "react";
import { useNavigate } from "react-router-dom";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
import AppointmentsCalendarCore from "./AppointmentsCalendarCore";

export default function AppointmentCreatePage() {
  const navigate = useNavigate();

  const closeToCalendar = () => {
    navigate("/appointments/calendar", { replace: true });
  };

  return (
    <>
      <AppointmentsCalendarCore initialMode="days" />
      <AppointmentNewModal onSaved={closeToCalendar} onClose={closeToCalendar} />
    </>
  );
}
