import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import ModulePlaceholderPage from "./ModulePlaceholderPage";
import VirAutopilotPage from "./VirAutopilotPage";
import { FallbackRedirect } from "../routing/routeAccess";
import { hasStoredRole } from "../utils/roles";

export default function ModuleRoutesPage() {
  const { pathname } = useLocation();
  const isAutopilot = pathname === "/admin/booking-v4" || pathname.startsWith("/modules/vir-autopilot");
  if (isAutopilot) {
    if (!hasStoredRole(["admin", "manager"])) return <Navigate to="/" replace />;
    return <VirAutopilotPage />;
  }
  if (pathname.startsWith("/modules/")) return <ModulePlaceholderPage />;
  return <FallbackRedirect />;
}
