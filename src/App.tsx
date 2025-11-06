// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ⚠️ A lapoknak DEFAULT exporttal kell rendelkezniük (export default ...)
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Bejelentkezesek = lazy(() => import("./pages/Bejelentkezesek"));
const Munkalapok = lazy(() => import("./pages/Munkalapok"));
const Penzugy = lazy(() => import("./pages/Penzugy"));
const Logisztika = lazy(() => import("./pages/Logisztika"));
const Register = lazy(() => import("./pages/Register"));
const WorkOrdersList = lazy(() => import("./pages/WorkOrdersList"));
const WorkOrderNew = lazy(() => import("./pages/WorkOrderNew"));
const EmployeesList = lazy(() => import("./pages/EmployeesList"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Betöltés…</div>}>
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

          {/* Munkatársak */}
          <Route path="/employees" element={<EmployeesList />} />
          <Route path="/employees/:id" element={<EmployeeDetails />} />

          {/* Új munkatárs (placeholder) */}
          <Route
            path="/employees/new"
            element={<div>Új munkatárs felvétele (később készítjük el)</div>}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
