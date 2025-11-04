import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Oldalak
import Login from "./pages/Login";
import Home from "./pages/Home";
import Bejelentkezesek from "./pages/Bejelentkezesek";
import Munkalapok from "./pages/Munkalapok";
import Penzugy from "./pages/Penzugy";
import Logisztika from "./pages/Logisztika";
import Register from "./pages/Register";
import WorkOrdersList from "./pages/WorkOrdersList";
import WorkOrderNew from "./pages/WorkOrderNew";
import EmployeesList from "./pages/EmployeesList";
import EmployeeDetails from "./pages/EmployeeDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public / auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Főoldal */}
        <Route path="/" element={<Home />} />

        {/* Modulok */}
        <Route path="/bejelentkezesek" element={<Bejelentkezesek />} />
        <Route path="/munkalapok" element={<Munkalapok />} />
        <Route path="/penzugy" element={<Penzugy />} />
        <Route path="/logisztika" element={<Logisztika />} />

        {/* Munkalap / work order menü */}
        <Route path="/workorders" element={<WorkOrdersList />} />
        <Route path="/workorders/new" element={<WorkOrderNew />} />

        {/* Munkatársak lista */}
        <Route path="/employees" element={<EmployeesList />} />

        {/* Munkatárs részletes nézete */}
        <Route path="/employees/:id" element={<EmployeeDetails />} />

        {/* Új munkatárs felvétele (még nincs kész, placeholder) */}
        <Route
          path="/employees/new"
          element={<div>Új munkatárs felvétele (később készítjük el)</div>}
        />

        {/* fallback: ismeretlen útvonal -> vissza a főoldalra */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
