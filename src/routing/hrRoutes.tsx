import { Navigate, type RouteObject } from "react-router-dom";
import {
  ADMIN_ROLES as ADMIN,
  HR_ROLES as HR,
  authenticated as A,
  roleProtected as R,
} from "./routeAccess";
import {
  AccessControlPage,
  EmployeeRoutesPage,
  EmployeeWorkContextPage,
  EmployeesList,
  HrAttendancePage,
  HrDevelopmentPage,
  HrPositionsPage,
  ModulePlaceholderPage,
  PayrollPage,
  RoleTimetablePage,
  StaffChatPage,
  StaffImportPage,
} from "./routePages";

export const hrRoutes: RouteObject[] = [
  { path: "/dashboard/shift", element: A(<HrAttendancePage />) },
  { path: "/hr/positions", element: R(HR, <HrPositionsPage />) },
  { path: "/hr/applications", element: R(HR, <HrDevelopmentPage />) },
  { path: "/spec/training", element: R(HR, <HrDevelopmentPage />) },
  { path: "/hr/evaluations", element: R(HR, <HrDevelopmentPage />) },
  {
    path: "/modules/team/recruitment",
    element: <Navigate to="/hr/applications" replace />,
  },
  {
    path: "/modules/team/training",
    element: <Navigate to="/spec/training" replace />,
  },
  {
    path: "/modules/team/evaluations",
    element: <Navigate to="/hr/evaluations" replace />,
  },
  { path: "/modules/team/payroll", element: R(HR, <PayrollPage />) },
  { path: "/modules/team/roles", element: R(ADMIN, <AccessControlPage />) },
  { path: "/modules/team/import", element: R(HR, <StaffImportPage />) },
  { path: "/hr", element: A(<EmployeesList />) },
  { path: "/employees", element: A(<EmployeesList />) },
  { path: "/team", element: <Navigate to="/employees" replace /> },
  { path: "/staff", element: <Navigate to="/employees" replace /> },
  { path: "/employees/:id", element: A(<EmployeeWorkContextPage />) },
  { path: "/employees/*", element: A(<EmployeeRoutesPage />) },
  { path: "/modules/team/timetable", element: A(<RoleTimetablePage />) },
  { path: "/modules/team/attendance", element: A(<HrAttendancePage />) },
  { path: "/staff/chat", element: A(<StaffChatPage />) },
  { path: "/settings/roles", element: R(ADMIN, <ModulePlaceholderPage />) },
];
