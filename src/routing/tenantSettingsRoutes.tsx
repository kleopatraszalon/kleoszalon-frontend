import type { RouteObject } from "react-router-dom";
import TenantSettingsPage from "../pages/TenantSettingsPage";
import { MANAGEMENT_ROLES as MANAGEMENT, roleProtected as R } from "./routeAccess";

export const tenantSettingsRoutes: RouteObject[] = [
  { path: "/settings/tenant", element: R(MANAGEMENT, <TenantSettingsPage />) },
];
