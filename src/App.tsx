// src/App.tsx
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
          <div>Munkaidő indítása / zárása – fejlesztés alatt</div>
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

    // Modulok – régi útvonalak (bejelentkezések, munkalapok, stb.)
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
          <div>HR modul – fejlesztés alatt</div>
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
      element: (
        <RequireAuth>
          <div>Kimutatások és jelentések – fejlesztés alatt</div>
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
          <div>Termék típusok – fejlesztés alatt</div>
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
          <div>Eszközök és eszköz típusok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/discounts",
      element: (
        <RequireAuth>
          <div>Kedvezmények – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/partners",
      element: (
        <RequireAuth>
          <div>Partnerek / Beszállítók – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/vacation-types",
      element: (
        <RequireAuth>
          <div>Szabadság típusok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/units",
      element: (
        <RequireAuth>
          <div>Mennyiségi egységek – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/payment-methods",
      element: (
        <RequireAuth>
          <div>Fizetési módok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/price-types",
      element: (
        <RequireAuth>
          <div>Ár típusok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/masterdata/movement-types",
      element: (
        <RequireAuth>
          <div>Készletmozgás típusok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // HR aloldalak
    {
      path: "/hr/positions",
      element: (
        <RequireAuth>
          <div>Pozíciók és álláshirdetések – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/applications",
      element: (
        <RequireAuth>
          <div>Jelentkezések kezelése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/applications/review",
      element: (
        <RequireAuth>
          <div>Jelentkezés elbírálása – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/employees",
      element: (
        <RequireAuth>
          <div>Dolgozói adatok és beosztások – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/vacations",
      element: (
        <RequireAuth>
          <div>Szabadságkezelés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/timesheets",
      element: (
        <RequireAuth>
          <div>Munkaidő-nyilvántartás – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/hr/evaluations",
      element: (
        <RequireAuth>
          <div>Dolgozói értékelések – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Marketing aloldalak
    {
      path: "/marketing/newsletter",
      element: (
        <RequireAuth>
          <div>Hírlevél küldése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/coupons",
      element: (
        <RequireAuth>
          <div>Bérletek, hűségkártyák, kuponok – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/daily-deals",
      element: (
        <RequireAuth>
          <div>Napi akciók – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/complaints",
      element: (
        <RequireAuth>
          <div>Panaszkezelés – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/marketing/reviews",
      element: (
        <RequireAuth>
          <div>Értékelések kezelése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Reports aloldalak
    {
      path: "/reports/profit",
      element: (
        <RequireAuth>
          <div>Profit táblázat – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports/stock-movements",
      element: (
        <RequireAuth>
          <div>Készletmozgások lekérdezése – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports/expected-revenue",
      element: (
        <RequireAuth>
          <div>
            Elvárt bevételek (napi, óránkénti, üzletenkénti) – fejlesztés
            alatt
          </div>
        </RequireAuth>
      ),
    },
    {
      path: "/reports/custom",
      element: (
        <RequireAuth>
          <div>Jelentés szerkesztő – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },

    // Settings aloldalak
    {
      path: "/settings/roles",
      element: (
        <RequireAuth>
          <div>
            Jogosultságok és hozzáférési szintek – fejlesztés alatt
          </div>
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
          <div>
            Biztonsági és teljesítmény beállítások – fejlesztés alatt
          </div>
        </RequireAuth>
      ),
    },

    // Extra modulok
    {
      path: "/extra/documents",
      element: (
        <RequireAuth>
          <div>
            Elektronikus dokumentum nyilvántartás – fejlesztés alatt
          </div>
        </RequireAuth>
      ),
    },
    {
      path: "/extra/chat",
      element: (
        <RequireAuth>
          <div>Belső üzenetküldés / chat – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/extra/tasks",
      element: (
        <RequireAuth>
          <div>Teendők lista – fejlesztés alatt</div>
        </RequireAuth>
      ),
    },
    {
      path: "/extra/corporate-dashboard",
      element: (
        <RequireAuth>
          <div>
            Cégműszerfal (vezetői dashboard, döntéstámogatás) – fejlesztés
            alatt
          </div>
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

    // 🔹 WEBSHOP ADMIN
    {
      path: "/webshop-admin",
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

    // Fallback
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
{
      path: "*",
      element: <FallbackRedirect />,
    }
],
  {
    // 🔹 React Router v7 future flag-ek bekapcsolva – eltűnnek a warningok
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
