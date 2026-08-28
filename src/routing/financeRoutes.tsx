import { Navigate, type RouteObject } from "react-router-dom";
import {
  ADMIN_ROLES as ADMIN,
  MANAGEMENT_ROLES as MANAGEMENT,
  authenticated as A,
  roleProtected as R,
} from "./routeAccess";
import {
  InventoryOperationsPage,
  ManagementToolsPage,
  NavOnlineInvoicePage,
  Penzugy,
  VirSupplementaryReportsPage,
  VirTopMetricsExtendedPage,
} from "./routePages";

export const financeRoutes: RouteObject[] = [
  { path: "/penzugy", element: A(<Penzugy />) },
  { path: "/finance", element: A(<Penzugy />) },
  {
    path: "/finance/nav-online-invoice",
    element: R(ADMIN, <NavOnlineInvoicePage />),
  },
  { path: "/finance/*", element: A(<Penzugy />) },
  { path: "/reports", element: <Navigate to="/reports/top-metrics" replace /> },
  { path: "/reports/top", element: R(MANAGEMENT, <VirTopMetricsExtendedPage />) },
  { path: "/reports/top-metrics", element: R(MANAGEMENT, <VirTopMetricsExtendedPage />) },
  { path: "/reports/profit", element: R(MANAGEMENT, <Penzugy />) },
  { path: "/reports/inventory-movement", element: R(MANAGEMENT, <InventoryOperationsPage />) },
  { path: "/reports/inventory-movements", element: R(MANAGEMENT, <InventoryOperationsPage />) },
  { path: "/reports/expected-revenue", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/custom", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/builder", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/management-tools", element: R(MANAGEMENT, <ManagementToolsPage />) },
  {
    path: "/reports/vir",
    element: <Navigate to="/reports/top-metrics" replace />,
  },
  { path: "/reports/*", element: <Navigate to="/reports/top-metrics" replace /> },
  { path: "/finance/transaction", element: <Navigate to="/finance" replace /> },
  { path: "/finance/transactions", element: A(<Penzugy />) },
  { path: "/finance/invoices/out", element: A(<Penzugy />) },
  { path: "/finance/invoices/in", element: A(<Penzugy />) },
];
