import { CurrentUser } from "../api/me";

export function isAdmin(user?: CurrentUser | null) {
  return (user?.role || "").toLowerCase() === "admin";
}

export function canSeeFinancials(user?: CurrentUser | null) {
  const role = (user?.role || "").toLowerCase();
  return role === "admin" || role === "manager" || role === "location_manager";
}

export function canEditLocationFilter(user?: CurrentUser | null) {
  return isAdmin(user);
}

export function getEffectiveLocationId(user?: CurrentUser | null, selectedLocationId?: string) {
  if (isAdmin(user)) return selectedLocationId || "";
  return user?.location_id ? String(user.location_id) : selectedLocationId || "";
}
