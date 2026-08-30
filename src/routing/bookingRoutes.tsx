import { lazy } from "react";
import { Navigate, useLocation, type RouteObject } from "react-router-dom";
import { MANAGEMENT_ROLES as MANAGEMENT, authenticated as A, roleProtected as R } from "./routeAccess";
import {
  AppointmentsCalendar,
  AppointmentsModulePage,
  Bejelentkezesek,
  BookingVoiceStatsPage,
  ClientsCRMPage,
  CustomerBookingPage,
  ModulePlaceholderPage,
  Munkalapok,
  RoleDashboardPage,
  WorkOrderNewModalPage,
  WorkOrdersList,
} from "./routePages";

const AppointmentCreatePage = lazy(() => import("../pages/AppointmentCreatePage"));

function AppointmentFallback() {
  const { pathname } = useLocation();
  if (pathname === "/appointments/new") return <AppointmentCreatePage />;
  return <Navigate to="/appointments/calendar" replace />;
}

export const bookingRoutes: RouteObject[] = [
  { path: "/", element: A(<RoleDashboardPage />) },
  { path: "/dashboard", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/summary", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/quick", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/notifications", element: A(<ModulePlaceholderPage />) },
  { path: "/customer/booking", element: A(<CustomerBookingPage />) },
  { path: "/modules/appointments/:view", element: A(<AppointmentsModulePage />) },
  { path: "/modules/customers/:view", element: A(<ClientsCRMPage />) },
  { path: "/bejelentkezesek", element: A(<Bejelentkezesek />) },
  { path: "/munkalapok", element: A(<Munkalapok />) },
  {
    path: "/appointments",
    element: <Navigate to="/appointments/calendar" replace />,
  },
  { path: "/appointments/calendar", element: A(<AppointmentsCalendar />) },
  { path: "/appointments/list", element: <Navigate to="/modules/appointments/list" replace /> },
  {
    path: "/appointments/voice-booking-stats",
    element: R(MANAGEMENT, <BookingVoiceStatsPage />),
  },
  {
    path: "/appointments/*",
    element: A(<AppointmentFallback />),
  },
  { path: "/workorders", element: A(<WorkOrdersList />) },
  { path: "/workorders/list", element: A(<WorkOrdersList />) },
  { path: "/workorders/new", element: A(<WorkOrderNewModalPage />) },
  { path: "/workorders/:id", element: A(<WorkOrderNewModalPage />) },
  { path: "/workorders/*", element: A(<WorkOrdersList />) },
  {
    path: "/clients",
    element: <Navigate to="/modules/customers/clients" replace />,
  },
  {
    path: "/clients/*",
    element: <Navigate to="/modules/customers/clients" replace />,
  },
  { path: "/crm", element: <Navigate to="/modules/customers/crm" replace /> },
  { path: "/crm/*", element: <Navigate to="/modules/customers/crm" replace /> },
];
