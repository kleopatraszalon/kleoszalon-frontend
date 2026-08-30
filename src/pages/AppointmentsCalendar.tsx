import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import AppointmentsCalendarCore from "./AppointmentsCalendarCore";
import AdvancedBookingLauncher from "./booking/AdvancedBookingLauncher";

const LEGACY_VIEW_ROUTES: Record<string, string> = {
  "voice-booking": "/appointments/voice-booking-stats",
  "complex-services": "/modules/appointments/complex-services",
  "group-bookings": "/modules/appointments/group-bookings",
  notifications: "/modules/appointments/notifications",
  "no-show": "/modules/appointments/attendance",
  waitlist: "/modules/appointments/waitlist",
};

export default function AppointmentsCalendarPage(){
  const location = useLocation();
  const view = new URLSearchParams(location.search).get("view");
  const redirect = view ? LEGACY_VIEW_ROUTES[view] : undefined;
  if (redirect) return <Navigate to={redirect} replace />;

  return <>
    <AppointmentsCalendarCore/>
    <AdvancedBookingLauncher/>
  </>;
}