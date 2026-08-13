import React from "react";
import AppointmentsCalendarCore from "./AppointmentsCalendarCore";
import AdvancedBookingLauncher from "./booking/AdvancedBookingLauncher";

export default function AppointmentsCalendarPage(){
  return <>
    <AppointmentsCalendarCore/>
    <AdvancedBookingLauncher/>
  </>;
}
