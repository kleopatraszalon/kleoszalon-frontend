import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import ModulePlaceholderPage from "./ModulePlaceholderPage";
import VirAutopilotPage from "./VirAutopilotPage";
import { hasStoredRole } from "../utils/roles";

export default function ModuleRoutesPage() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/modules/vir-autopilot")) {
    if (!hasStoredRole(["admin", "manager"])) return <Navigate to="/" replace />;
    return <VirAutopilotPage />;
  }
  return <ModulePlaceholderPage />;
}
