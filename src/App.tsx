import React, { Suspense, lazy, type ReactElement } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import EmployeeDetailsPage from "./pages/EmployeeDetails";
import ProductsList from "./pages/ProductsList";
import WebshopAdmin from "./pages/WebshopAdmin";
import "./styles/kleo-theme.css";
import AppLayout from "./layouts/AppLayout";

const AppointmentsCalendar = lazy(
  () => import("./pages/AppointmentsCalendar")
);

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
const ServicesList = lazy(() => import("./pages/ServicesList"));
const SignageAdmin = lazy(() => import("./pages/SignageAdmin"));
const KioskAdmin = lazy(() => import("./pages/KioskAdmin"));
const TimetableUpdatePage = lazy(() => import("./pages/TimetableUpdatePage"));
const HrAttendancePage = lazy(() => import("./pages/HrAttendancePage"));
const PayrollPage = lazy(() => import("./pages/PayrollPage"));
const AccessControlPage = lazy(() => import("./pages/AccessControlPage"));

const VirDashboardPage = lazy(() => import("./pages/VirDashboardPage"));
const VirStaffDetailPage = lazy(() => import("./pages/VirStaffDetailPage"));
const VirServiceDetailPage = lazy(() => import("./pages/VirServiceDetailPage"));
const VirReportsAdminPage = lazy(() => import("./pages/VirReportsAdminPage"));
const VirTopMetricsPage = lazy(() => import("./pages/VirTopMetricsPage"));
const ModulePlaceholderPage = lazy(() => import("./pages/ModulePlaceholderPage"));
const AppointmentsModulePage = lazy(() => import("./pages/AppointmentsModulePage"));
const ClientsCRMPage = lazy(() => import("./pages/ClientsCRMPage"));

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
  if (!t) return <Navigate to="/login" replace />;

  // A korábbi egyszerű „fejlesztés alatt” blokkok helyett egységes,
  // használható VIR moduloldalt jelenítünk meg.
  const isLegacyPlaceholder =
    React.isValidElement(children) && children.type === "div";

  return (
    <AppLayout>
      {isLegacyPlaceholder ? <ModulePlaceholderPage /> : children}
    </AppLayout>
  );
}

function PublicOnly({ children }: GuardProps) {
  const t = getToken();
  return t ? <Navigate to={HOME_PATH} replace /> : children;
}

function FallbackRedirect() {
  const t = getToken();
  return <Navigate to={t ? HOME_PATH : "/login"} replace />;
}

// ===== ROUTER DEFINÍCIÓ (data router) =====

const router = createBrowserRouter(
  [
    // Public / auth oldalak
    {
      path: "/login",
      element: (
        <PublicOnly>
          <Login />
        </PublicOnly>
      ),
    },
    {
      path: "/register",
      element: (
        <PublicOnly>
          <Register />
        </PublicOnly>
      ),
    },
    {
      path: "/modules/appointments/:view",
      element: (
        <RequireAuth>
          <AppointmentsModulePage />
        </RequireAuth>
      ),
    },
    {
      path: "/modules/team/payroll",
      element: (
        <RequireAuth>
          <PayrollPage />
        </RequireAuth>
      ),
    },
    {
      path: "/modules/team/roles",
      element: (
        <RequireAuth>
          <AccessControlPage />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/access-control",
      element: (
        <RequireAuth>
          <AccessControlPage />
        </RequireAuth>
      ),
    },
    {
      path: "/hr/positions",
      element: (
        <RequireAuth>
          <EmployeesList />
        </RequireAuth>
      ),
    },
    {
      path: "/modules/customers/:view",
      element: (
        <RequireAuth>
          <ClientsCRMPage />
        </RequireAuth>
      ),
    },
    {
      path: "/modules/:moduleKey/*",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },

    // Home (régi root)
    {
      path: "/",
      element: (
        <RequireAuth>
          <Home />
        </RequireAuth>
      ),
    },

    // Dashboard / fő modul
    {
      path: "/dashboard",
      element: (
        <RequireAuth>
          <Home />
        </RequireAuth>
      ),
    },
    {
      path: "/dashboard/summary",
      element: (
        <RequireAuth>
          <Home />
        </RequireAuth>
      ),
    },
    {
      path: "/dashboard/quick",
      element: (
        <RequireAuth>
          <Home />
        </RequireAuth>
      ),
    },
    {
      path: "/dashboard/shift",
      element: (
        <RequireAuth>
          <HrAttendancePage />
        </RequireAuth>
      ),
    },
    {
      path: "/dashboard/notifications",
      element: (
        <RequireAuth>
          <div>Értesítések – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Modulok – régi útvonalak
    {
      path: "/bejelentkezesek",
      element: (
        <RequireAuth>
          <Bejelentkezesek />
        </RequireAuth>
      ),
    },
    {
      path: "/munkalapok",
      element: (
        <RequireAuth>
          <Munkalapok />
        </RequireAuth>
      ),
    },
    {
      path: "/penzugy",
      element: (
        <RequireAuth>
          <Penzugy />
        </RequireAuth>
      ),
    },
    {
      path: "/logisztika",
      element: (
        <RequireAuth>
          <Logisztika />
        </RequireAuth>
      ),
    },

    // Menü-kompatibilis fő modul útvonalak
    {
      path: "/finance",
      element: (
        <RequireAuth>
          <Penzugy />
        </RequireAuth>
      ),
    },
    {
      path: "/warehouse",
      element: (
        <RequireAuth>
          <Logisztika />
        </RequireAuth>
      ),
    },
    {
      path: "/masters",
      element: (
        <RequireAuth>
          <ServicesList />
        </RequireAuth>
      ),
    },

    // HR, Marketing, Reports, Settings, Extras – placeholder-ek
    {
      path: "/hr",
      element: (
        <RequireAuth>
          <EmployeesList />
        </RequireAuth>
      ),
    },
    {
      path: "/marketing",
      element: (
        <RequireAuth>
          <div>Marketing modul – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports",
      element: <Navigate to="/reports/top-metrics" replace />,
    },
    {
      path: "/reports/top-metrics",
      element: (
        <RequireAuth>
          <VirTopMetricsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/reports/appointments",
      element: (
        <RequireAuth>
          <div style={{ padding: "2rem" }}>Bejegyzések kimutatás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports/events",
      element: (
        <RequireAuth>
          <div style={{ padding: "2rem" }}>Események kimutatás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports/all",
      element: (
        <RequireAuth>
          <div style={{ padding: "2rem" }}>Összes kimutatás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings",
      element: (
        <RequireAuth>
          <div>Beállítások / Adminisztráció – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/extras",
      element: (
        <RequireAuth>
          <div>Egyéb modulok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Weblap / arculat
    {
      path: "/weblap_settings",
      element: (
        <RequireAuth>
          <div>Weblap beállítások – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/style-editor",
      element: (
        <RequireAuth>
          <div>Arculat szerkesztő – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Workorders / Munkalapok
    {
      path: "/workorders",
      element: (
        <RequireAuth>
          <WorkOrdersList />
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/list",
      element: (
        <RequireAuth>
          <WorkOrdersList />
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/new",
      element: (
        <RequireAuth>
          <WorkOrderNew />
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/add-service",
      element: (
        <RequireAuth>
          <div>Szolgáltatás hozzáadása – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/add-items",
      element: (
        <RequireAuth>
          <div>Szolgáltatás / termék hozzáadása – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/payment",
      element: (
        <RequireAuth>
          <div>Fizetés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/close",
      element: (
        <RequireAuth>
          <div>Munkalap lezárása / visszavonása – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/workorders/history",
      element: (
        <RequireAuth>
          <div>Korábbi szolgáltatások megtekintése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Pénzügy aloldalak
    {
      path: "/finance/cash",
      element: (
        <RequireAuth>
          <div>Pénztár kezelése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoice",
      element: (
        <RequireAuth>
          <div>Számlázás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/transaction",
      element: (
        <RequireAuth>
          <div>Kiadás / bevétel rögzítése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/transactions",
      element: (
        <RequireAuth>
          <div>Tranzakciók listája – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoices/out",
      element: (
        <RequireAuth>
          <div>Kimenő számlák – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoices/in",
      element: (
        <RequireAuth>
          <div>Bejövő számlák – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/transactions/guest",
      element: (
        <RequireAuth>
          <div>Vendégszámla tranzakciók – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/finance/balance/topup",
      element: (
        <RequireAuth>
          <div>Egyenlegfeltöltés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Raktár / Inventory
    {
      path: "/warehouse/list",
      element: (
        <RequireAuth>
          <Logisztika />
        </RequireAuth>
      ),
    },
    {
      path: "/warehouse/products",
      element: (
        <RequireAuth>
          <Logisztika />
        </RequireAuth>
      ),
    },
    {
      path: "/warehouse/incoming",
      element: (
        <RequireAuth>
          <div>Bevételezés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/transfer",
      element: (
        <RequireAuth>
          <div>Raktárak közötti termékmozgás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/purchase",
      element: (
        <RequireAuth>
          <div>Új beszerzés költséggel – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/adjustment",
      element: (
        <RequireAuth>
          <div>Készletkorrekció – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/usage",
      element: (
        <RequireAuth>
          <div>Szalonhasználat – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Törzsadatok / Masterdata
    {
      path: "/masters/salons",
      element: (
        <RequireAuth>
          <div>Szalonok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masters/users",
      element: (
        <RequireAuth>
          <div>Felhasználók – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masters/guests",
      element: (
        <RequireAuth>
          <div>Vendégek – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/departments",
      element: (
        <RequireAuth>
          <div>Részlegek – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/service-types",
      element: (
        <RequireAuth>
          <div>Szolgáltatás típusok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/services",
      element: (
        <RequireAuth>
          <ServicesList />
        </RequireAuth>
      ),
