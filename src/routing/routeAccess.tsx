import { lazy, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { hasStoredRole } from "../utils/roles";
import { hasStoredAuthToken } from "../utils/authSession";

const ModulePlaceholderPage = lazy(() => import("../pages/ModulePlaceholderPage"));

export const HOME_PATH = "/";

export const ADMIN_ROLES = ["admin"] as const;
export const MANAGEMENT_ROLES = ["admin", "manager"] as const;
export const HR_ROLES = ["admin", "manager", "hr"] as const;
export const KIOSK_MANAGER_ROLES = [
  "admin",
  "manager",
  "location_manager",
  "salon_manager",
  "receptionist",
] as const;

type GuardProps = { children: ReactElement };
type RoleGuardProps = GuardProps & { allowed: readonly string[] };

export function RequireAuth({ children }: GuardProps) {
  if (!hasStoredAuthToken()) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export function RequireRoles({ children, allowed }: RoleGuardProps) {
  if (!hasStoredAuthToken()) return <Navigate to="/login" replace />;
  if (!hasStoredRole(allowed)) return <Navigate to={HOME_PATH} replace />;
  return <RequireAuth>{children}</RequireAuth>;
}

export function PublicOnly({ children }: GuardProps) {
  return hasStoredAuthToken() ? <Navigate to={HOME_PATH} replace /> : children;
}

export function FallbackRedirect() {
  return hasStoredAuthToken() ? (
    <RequireAuth>
      <ModulePlaceholderPage />
    </RequireAuth>
  ) : (
    <Navigate to="/login" replace />
  );
}

export const authenticated = (element: ReactElement) => <RequireAuth>{element}</RequireAuth>;
export const roleProtected = (roles: readonly string[], element: ReactElement) => (
  <RequireRoles allowed={roles}>{element}</RequireRoles>
);
