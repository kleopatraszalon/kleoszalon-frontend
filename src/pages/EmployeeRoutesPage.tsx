import { useLocation } from "react-router-dom";
import EmployeeSkillMatrixPage from "./EmployeeSkillMatrixPage";
import EmployeesList from "./EmployeesList";

export default function EmployeeRoutesPage() {
  const { pathname } = useLocation();
  if (pathname === "/employees/skills/matrix") return <EmployeeSkillMatrixPage />;
  return <EmployeesList />;
}
