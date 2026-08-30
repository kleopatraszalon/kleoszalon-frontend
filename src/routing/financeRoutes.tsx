import { Navigate, type RouteObject } from "react-router-dom";
import {
  FINANCE_ROLES as FINANCE,
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
    element: R(FINANCE, <NavOnlineInvoicePage />),
  },
  { path: "/finance/*", element: A(<Penzugy />) },
  { path: "/reports", element: <Navigate to="/reports/top-metrics" replace /> },
  { path: "/reports/top", element: R(FINANCE, <VirTopMetricsExtendedPage />) },
  { path: "/reports/top-metrics", element: R(FINANCE, <VirTopMetricsExtendedPage />) },
  { path: "/reports/profit", element: R(FINANCE, <Penzugy />) },
  { path: "/reports/inventory-movement", element: R(FINANCE, <InventoryOperationsPage />) },
  { path: "/reports/inventory-movements", element: R(FINANCE, <InventoryOperationsPage />) },
  { path: "/reports/expected-revenue", element: R(FINANCE, <VirSupplementaryReportsPage />) },
  { path: "/reports/custom", element: R(FINANCE, <VirSupplementaryReportsPage />) },
  { path: "/reports/builder", element: R(FINANCE, <VirSupplementaryReportsPage />) },
  { path: "/reports/management-tools", element: R(FINANCE, <ManagementToolsPage />) },
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
