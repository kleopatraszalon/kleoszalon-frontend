// src/App.tsx
import React, { Suspense, lazy, type ReactElement } from "react";
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

const HOME_PATH = "/";

// Token olvasás biztonságosan (SSR-safe)
function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("kleo_token") || localStorage.getItem("token");
  } catch {
    return null;
  }
}

type GuardProps = { children: ReactElement };

function RequireAuth({ children }: GuardProps) {
  const t = getToken();
  return t ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: GuardProps) {
  const t = getToken();
  return t ? <Navigate to={HOME_PATH} replace /> : children;
}

function FallbackRedirect() {
  const t = getToken();
  return <Navigate to={t ? HOME_PATH : "/login"} replace />;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div>Betöltés…</div>}>
        <Routes>
          {/* Public / Auth pages (csak kijelentkezve) */}
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* Home (védett) */}
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />

          {/* Modulok (védettek) */}
          <Route path="/bejelentkezesek" element={<RequireAuth><Bejelentkezesek /></RequireAuth>} />
          <Route path="/munkalapok" element={<RequireAuth><Munkalapok /></RequireAuth>} />
          <Route path="/penzugy" element={<RequireAuth><Penzugy /></RequireAuth>} />
          <Route path="/logisztika" element={<RequireAuth><Logisztika /></RequireAuth>} />

          {/* Munkalap / Work orders (védettek) */}
          <Route path="/workorders" element={<RequireAuth><WorkOrdersList /></RequireAuth>} />
          <Route path="/workorders/new" element={<RequireAuth><WorkOrderNew /></RequireAuth>} />

          {/* Munkatársak (védettek) */}
          <Route path="/employees" element={<RequireAuth><EmployeesList /></RequireAuth>} />
          <Route path="/employees/:id" element={<RequireAuth><EmployeeDetails /></RequireAuth>} />

          {/* Placeholder (védett) */}
          <Route
            path="/employees/new"
            element={<RequireAuth><div>Új munkatárs felvétele (később készítjük el)</div></RequireAuth>}
          />

          {/* Fallback */}
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
