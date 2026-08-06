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
const StaffImportPage = lazy(() => import("./pages/StaffImportPage"));

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
      path: "/modules/team/import",
      element: (
        <RequireAuth>
          <StaffImportPage />
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
    {
      path: "/spec/:moduleKey",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/knowledge-base",
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
      element: <Navigate to="/modules/marketing/campaigns" replace />,
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
          <ModulePlaceholderPage />
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
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/extras",
      element: <Navigate to="/extra/tasks" replace />,
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
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoice",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/transaction",
      element: <Navigate to="/finance/transactions" replace />,
    },
    {
      path: "/finance/transactions",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoices/out",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/invoices/in",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/transactions/guest",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/finance/balance/topup",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
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
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/transfer",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/purchase",
      element: <Navigate to="/spec/inventory-orders" replace />,
    },
    {
      path: "/inventory/adjustment",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/inventory/usage",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },

    // Törzsadatok / Masterdata
    {
      path: "/masters/salons",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masters/users",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masters/guests",
      element: <Navigate to="/modules/customers/list" replace />,
    },
    {
      path: "/masterdata/departments",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/service-types",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
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
    },
    {
      path: "/masters/services",
      element: (
        <RequireAuth>
          <ServicesList />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/product-types",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/products",
      element: (
        <RequireAuth>
          <ProductsList />
        </RequireAuth>
      ),
    },
    {
      path: "/products",
      element: (
        <RequireAuth>
          <ProductsList />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/assets",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/discounts",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/partners",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/vacation-types",
      element: (
        <RequireAuth>
          <HrAttendancePage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/units",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/payment-methods",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/price-types",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/movement-types",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },

    // HR aloldalak
    {
      path: "/hr/applications",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/hr/applications/review",
      element: <Navigate to="/hr/applications" replace />,
    },
    {
      path: "/hr/employees",
      element: (
        <RequireAuth>
          <EmployeesList />
        </RequireAuth>
      ),
    },
    {
      path: "/hr/vacations",
      element: (
        <RequireAuth>
          <HrAttendancePage />
        </RequireAuth>
      ),
    },
    {
      path: "/hr/timesheets",
      element: (
        <RequireAuth>
          <HrAttendancePage />
        </RequireAuth>
      ),
    },
    {
      path: "/hr/evaluations",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },

    // Marketing aloldalak
    {
      path: "/marketing/newsletter",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/coupons",
      element: <Navigate to="/modules/loyalty/discounts" replace />,
    },
    {
      path: "/marketing/daily-deals",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/complaints",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/reviews",
      element: <Navigate to="/modules/marketing/feedback" replace />,
    },

    // Reports aloldalak
    {
      path: "/reports/profit",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/reports/stock-movements",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/reports/expected-revenue",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/reports/custom",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },

    // Settings aloldalak
    {
      path: "/settings/roles",
      element: (
        <RequireAuth>
          <div>Jogosultságok és hozzáférési szintek – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/audit-log",
      element: (
        <RequireAuth>
          <div>Naplózás és aktivitáskövetés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/localization",
      element: (
        <RequireAuth>
          <div>Többnyelvűség beállítása – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/integrations",
      element: (
        <RequireAuth>
          <div>Kommunikációs interfészek – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/daily-deals-display",
      element: (
        <RequireAuth>
          <div>Napi akciók megjelenítése TV-n – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/external-systems",
      element: (
        <RequireAuth>
          <div>Külső rendszerkapcsolatok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/settings/security",
      element: (
        <RequireAuth>
          <div>Biztonsági és teljesítmény beállítások – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Extra modulok
    {
      path: "/extra/documents",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/extra/chat",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/extra/tasks",
      element: (
        <RequireAuth>
          <ModulePlaceholderPage />
        </RequireAuth>
      ),
    },
    {
      path: "/extra/corporate-dashboard",
      element: (
        <RequireAuth>
          <div>Cégműszerfal (vezetői dashboard, döntéstámogatás) – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Munkatársak
    {
      path: "/employees/:id",
      element: (
        <RequireAuth>
          <EmployeeDetailsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/employees",
      element: (
        <RequireAuth>
          <EmployeesList />
        </RequireAuth>
      ),
    },
    {
      path: "/employees/new",
      element: (
        <RequireAuth>
          <div>Új munkatárs felvétele (később készítjük el)</div>
        </RequireAuth>
      ),
    },

    // WEBSHOP ADMIN
    {
      path: "/webshop-admin",
      element: (
        <RequireAuth>
          <WebshopAdmin />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/webshop",
      element: (
        <RequireAuth>
          <WebshopAdmin />
        </RequireAuth>
      ),
    },

    // Appointments
    {
      path: "/appointments",
      element: (
        <RequireAuth>
          <Navigate to="/appointments/calendar" replace />
        </RequireAuth>
      ),
    },
    {
      path: "/appointments/calendar",
      element: (
        <RequireAuth>
          <AppointmentsCalendar />
        </RequireAuth>
      ),
    },
    {
      path: "/appointments/new",
      element: (
        <RequireAuth>
          <AppointmentsCalendar />
        </RequireAuth>
      ),
    },
    {
      path: "/appointments/cancel",
      element: (
        <RequireAuth>
          <AppointmentsCalendar />
        </RequireAuth>
      ),
    },
    {
      path: "/appointments/add-event",
      element: (
        <RequireAuth>
          <AppointmentsCalendar />
        </RequireAuth>
      ),
    },
    {
      path: "/appointments/timetable-update",
      element: (
        <RequireAuth>
          <TimetableUpdatePage />
        </RequireAuth>
      ),
    },
    {
      path: "/timetable/update",
      element: (
        <RequireAuth>
          <TimetableUpdatePage />
        </RequireAuth>
      ),
    },

    // Admin oldalak
    {
      path: "/admin/signage",
      element: (
        <RequireAuth>
          <SignageAdmin />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/kiosk",
      element: (
        <RequireAuth>
          <KioskAdmin />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/signate",
      element: <Navigate to="/admin/signage" replace />,
    },

    // VIR oldalak
    {
      path: "/admin/vir",
      element: (
        <RequireAuth>
          <VirDashboardPage />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/vir/staff/:staffId",
      element: (
        <RequireAuth>
          <VirStaffDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/vir/service/:serviceId",
      element: (
        <RequireAuth>
          <VirServiceDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/admin/vir-reports",
      element: (
        <RequireAuth>
          <VirReportsAdminPage />
        </RequireAuth>
      ),
    },

    // Fallback
    {
      path: "*",
      element: <FallbackRedirect />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

// ===== APP KOMPONENS =====

export default function App() {
  return (
    <Suspense fallback={<div>Betöltés…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
