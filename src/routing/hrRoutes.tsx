import { Navigate, type RouteObject } from "react-router-dom";
import {
  ADMIN_ROLES as ADMIN,
  MANAGEMENT_ROLES as MANAGEMENT,
  authenticated as A,
  roleProtected as R,
} from "./routeAccess";
import {
  AccessControlPage,
  EmployeeSkillMatrixPage,
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
  { path: "/hr/positions", element: R(MANAGEMENT, <HrPositionsPage />) },
  { path: "/hr/applications", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  { path: "/spec/training", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  { path: "/hr/evaluations", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  { path: "/hr/skill-matrix", element: R(MANAGEMENT, <EmployeeSkillMatrixPage />) },
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
  { path: "/modules/team/payroll", element: R(MANAGEMENT, <PayrollPage />) },
  { path: "/modules/team/roles", element: R(ADMIN, <AccessControlPage />) },
  { path: "/modules/team/import", element: R(MANAGEMENT, <StaffImportPage />) },
  { path: "/hr", element: A(<EmployeesList />) },
  { path: "/employees", element: A(<EmployeesList />) },
  { path: "/employees/skills", element: R(MANAGEMENT, <EmployeeSkillMatrixPage />) },
  { path: "/team", element: <Navigate to="/employees" replace /> },
  { path: "/staff", element: <Navigate to="/employees" replace /> },
  { path: "/employees/:id", element: A(<EmployeeWorkContextPage />) },
  { path: "/employees/*", element: A(<EmployeesList />) },
  { path: "/modules/team/timetable", element: A(<RoleTimetablePage />) },
  { path: "/modules/team/attendance", element: A(<HrAttendancePage />) },
  { path: "/staff/chat", element: A(<StaffChatPage />) },
  { path: "/settings/roles", element: R(ADMIN, <ModulePlaceholderPage />) },
];