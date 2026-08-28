import { Navigate, useLocation } from "react-router-dom";
import EmployeeSkillMatrixPage from "./EmployeeSkillMatrixPage";
import EmployeesList from "./EmployeesList";
import { hasStoredRole } from "../utils/roles";

const SKILL_MATRIX_ROLES = ["admin", "manager"] as const;

export default function EmployeeRoutesPage() {
  const { pathname } = useLocation();
  if (pathname === "/employees/skills/matrix") {
    if (!hasStoredRole(SKILL_MATRIX_ROLES)) return <Navigate to="/employees" replace />;
    return <EmployeeSkillMatrixPage />;
  }
  return <EmployeesList />;
}
