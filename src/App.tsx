import React, { Suspense, lazy, type ReactElement } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./styles/kleo-theme.css";
import AppLayout from "./layouts/AppLayout";
import BrandLoadingScreen from "./components/BrandLoadingScreen";
import { hasStoredRole } from "./utils/roles";
const ProductsList = lazy(() => import("./pages/ProductsList"));
const ProductTaxonomyReviewPage = lazy(() => import("./pages/ProductTaxonomyReviewPage"));
const InventoryOperationsPage = lazy(() => import("./pages/InventoryOperationsPage"));
const WebshopAdmin = lazy(() => import("./pages/WebshopAdmin"));
const HrPositionsPage = lazy(() => import("./pages/HrPositionsPage"));
const HrDevelopmentPage = lazy(() => import("./pages/HrDevelopmentPage"));
const OperationsQualityPage = lazy(
  () => import("./pages/OperationsQualityPage"),
);
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const DailyActionsPage = lazy(() => import("./pages/DailyActionsPage"));
const KleopatraMobileApp = lazy(() => import("./pages/KleopatraMobileApp"));
const LoyaltyProgramPage = lazy(() => import("./pages/LoyaltyProgramPage"));
const LoyaltyModulePage = lazy(() => import("./pages/LoyaltyModulePage"));
const EmployeeWorkContextPage = lazy(
  () => import("./pages/EmployeeWorkContextPage"),
);
const AppointmentsCalendar = lazy(() => import("./pages/AppointmentsCalendar"));
const Login = lazy(() => import("./pages/Login"));
const RoleDashboardPage = lazy(() => import("./pages/RoleDashboardPage"));
const Bejelentkezesek = lazy(() => import("./pages/Bejelentkezesek"));
const Munkalapok = lazy(() => import("./pages/Munkalapok"));
const Penzugy = lazy(() => import("./pages/Penzugy"));
const Logisztika = lazy(() => import("./pages/Logisztika"));
const CentralSupplyPage = lazy(() => import("./pages/CentralSupplyPage"));
const Register = lazy(() => import("./pages/Register"));
const WorkOrdersList = lazy(() => import("./pages/WorkOrdersList"));
const WorkOrderNewModalPage = lazy(
  () => import("./pages/WorkOrderNewModalPage"),
);
const EmployeesList = lazy(() => import("./pages/EmployeesList"));
const ServicesList = lazy(() => import("./pages/ServicesList"));
const SignageAdmin = lazy(() => import("./pages/SignageAdmin"));
const SignageAppearanceAdmin = lazy(
  () => import("./pages/SignageAppearanceAdmin"),
);
const KioskAdmin = lazy(() => import("./pages/KioskAdmin"));
const RoleTimetablePage = lazy(() => import("./pages/RoleTimetablePage"));
const HrAttendancePage = lazy(() => import("./pages/HrAttendancePage"));
const PayrollPage = lazy(() => import("./pages/PayrollPage"));
const AccessControlPage = lazy(() => import("./pages/AccessControlPage"));
const VirDashboardPage = lazy(() => import("./pages/VirDashboardPage"));
const VirStaffDetailPage = lazy(() => import("./pages/VirStaffDetailPage"));
const VirServiceDetailPage = lazy(() => import("./pages/VirServiceDetailPage"));
const VirReportsAdminPage = lazy(() => import("./pages/VirReportsAdminPage"));
const VirTopMetricsPage = lazy(() => import("./pages/VirTopMetricsPage"));
const ModulePlaceholderPage = lazy(
  () => import("./pages/ModulePlaceholderPage"),
);
const AppointmentsModulePage = lazy(
  () => import("./pages/AppointmentsModulePage"),
);
const ClientsCRMPage = lazy(() => import("./pages/ClientsCRMPage"));
const StaffImportPage = lazy(() => import("./pages/StaffImportPage"));
const SystemHealthPage = lazy(() => import("./pages/SystemHealthPage"));
const UatTestCenterPage = lazy(() => import("./pages/UatTestCenterPage"));
const LoyaltyPage = lazy(() => import("./pages/LoyaltyPage"));
const LoyaltySalesRulesPage = lazy(
  () => import("./pages/LoyaltySalesRulesPage"),
);
const LoyaltyAutomationPage = lazy(
  () => import("./pages/LoyaltyAutomationPage"),
);
const ChecklistsPage = lazy(() => import("./pages/ChecklistsPage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));
const StaffChatPage = lazy(() => import("./pages/StaffChatPage"));
const CustomerBookingPage = lazy(() => import("./pages/CustomerBookingPage"));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage"));
const PublicBookingManagePage = lazy(
  () => import("./pages/PublicBookingManagePage"),
);
const BookingVoiceStatsPage = lazy(
  () => import("./pages/BookingVoiceStatsPage"),
);
const WebsiteAdminPage = lazy(() => import("./pages/WebsiteAdminPage"));
const WebsitePagesAdminPage = lazy(
  () => import("./pages/WebsitePagesAdminPage"),
);
const NavOnlineInvoicePage = lazy(() => import("./pages/NavOnlineInvoicePage"));
const HOME_PATH = "/";
function getToken() {
  try {
    return typeof window === "undefined"
      ? null
      : localStorage.getItem("kleo_token") || localStorage.getItem("token");
  } catch {
    return null;
  }
}
type GuardProps = { children: ReactElement };
type RoleGuardProps = GuardProps & { allowed: string[] };
function RequireAuth({ children }: GuardProps) {
  if (!getToken()) return <Navigate to="/login" replace />;
  const legacy = React.isValidElement(children) && children.type === "div";
  return <AppLayout>{legacy ? <ModulePlaceholderPage /> : children}</AppLayout>;
}
function RequireRoles({ children, allowed }: RoleGuardProps) {
  if (!getToken()) return <Navigate to="/login" replace />;
  if (!hasStoredRole(allowed)) return <Navigate to={HOME_PATH} replace />;
  return <RequireAuth>{children}</RequireAuth>;
}
function PublicOnly({ children }: GuardProps) {
  return getToken() ? <Navigate to={HOME_PATH} replace /> : children;
}
function FallbackRedirect() {
  return getToken() ? (
    <RequireAuth>
      <ModulePlaceholderPage />
    </RequireAuth>
  ) : (
    <Navigate to="/login" replace />
  );
}
const A = (el: ReactElement) => <RequireAuth>{el}</RequireAuth>;
const R = (roles: string[], el: ReactElement) => (
  <RequireRoles allowed={roles}>{el}</RequireRoles>
);
const ADMIN = ["admin"];
const MANAGEMENT = ["admin", "manager"];
const KIOSK_MANAGERS = [
  "admin",
  "manager",
  "location_manager",
  "salon_manager",
  "receptionist",
];
const router = createBrowserRouter([
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
  { path: "/booking/manage/:token", element: <PublicBookingManagePage /> },
  { path: "/foglalas/kezeles/:token", element: <PublicBookingManagePage /> },
  { path: "/booking", element: <PublicBookingPage /> },
  { path: "/foglalas", element: <PublicBookingPage /> },
  { path: "/idopontfoglalas", element: <PublicBookingPage /> },
  { path: "/", element: A(<RoleDashboardPage />) },
  { path: "/dashboard", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/summary", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/quick", element: A(<RoleDashboardPage />) },
  { path: "/dashboard/notifications", element: A(<ModulePlaceholderPage />) },
  { path: "/customer/booking", element: A(<CustomerBookingPage />) },
  { path: "/dashboard/shift", element: A(<HrAttendancePage />) },
  {
    path: "/admin/system-health",
    element: R(MANAGEMENT, <SystemHealthPage />),
  },
  { path: "/admin/uat", element: R(MANAGEMENT, <UatTestCenterPage />) },
  { path: "/admin/website", element: R(MANAGEMENT, <WebsiteAdminPage />) },
  {
    path: "/admin/website/pages",
    element: R(MANAGEMENT, <WebsitePagesAdminPage />),
  },
  { path: "/loyalty/sales-rules", element: A(<LoyaltySalesRulesPage />) },
  { path: "/loyalty/automation", element: A(<LoyaltyAutomationPage />) },
  { path: "/loyalty", element: A(<LoyaltyPage />) },
  { path: "/loyalty/*", element: A(<LoyaltyPage />) },
  { path: "/hr/positions", element: R(MANAGEMENT, <HrPositionsPage />) },
  { path: "/hr/applications", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  { path: "/spec/training", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  { path: "/hr/evaluations", element: R(MANAGEMENT, <HrDevelopmentPage />) },
  {
    path: "/modules/team/recruitment",
    element: <Navigate to="/hr/applications" replace />,
  },
  {
    path: "/modules/team/training",
    element: <Navigate to="/spec/training" replace />,
  },
  {
    path: "/modules/team/evaluations",
    element: <Navigate to="/hr/evaluations" replace />,
  },
  { path: "/extra/tasks", element: R(MANAGEMENT, <OperationsQualityPage />) },
  {
    path: "/spec/maintenance",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  {
    path: "/extra/documents",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  {
    path: "/spec/internal-email",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  {
    path: "/marketing/complaints",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  {
    path: "/operations/audits",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  {
    path: "/operations/incidents",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  { path: "/extra/chat", element: <Navigate to="/staff/chat" replace /> },
  { path: "/marketing/newsletter", element: R(MANAGEMENT, <NewsletterPage />) },
  {
    path: "/marketing/daily-deals",
    element: R(MANAGEMENT, <DailyActionsPage />),
  },
  { path: "/kleopatra-app", element: <KleopatraMobileApp /> },
  {
    path: "/modules/customers/loyalty-program",
    element: R(MANAGEMENT, <LoyaltyProgramPage />),
  },
  { path: "/modules/loyalty/*", element: R(MANAGEMENT, <LoyaltyModulePage />) },
  {
    path: "/modules/appointments/:view",
    element: A(<AppointmentsModulePage />),
  },
  { path: "/modules/team/payroll", element: R(MANAGEMENT, <PayrollPage />) },
  { path: "/modules/team/roles", element: R(ADMIN, <AccessControlPage />) },
  { path: "/admin/access-control", element: R(ADMIN, <AccessControlPage />) },
  { path: "/settings/roles", element: R(ADMIN, <ModulePlaceholderPage />) },
  {
    path: "/modules/settings/audit-log",
    element: R(MANAGEMENT, <ModulePlaceholderPage />),
  },
  {
    path: "/modules/settings/chat-supervision",
    element: R(MANAGEMENT, <ModulePlaceholderPage />),
  },
  { path: "/hr/positions", element: A(<EmployeesList />) },
  { path: "/modules/team/import", element: R(MANAGEMENT, <StaffImportPage />) },
  { path: "/modules/customers/:view", element: A(<ClientsCRMPage />) },
  { path: "/bejelentkezesek", element: A(<Bejelentkezesek />) },
  { path: "/munkalapok", element: A(<Munkalapok />) },
  { path: "/penzugy", element: A(<Penzugy />) },
  { path: "/finance", element: A(<Penzugy />) },
  {
    path: "/finance/nav-online-invoice",
    element: R(ADMIN, <NavOnlineInvoicePage />),
  },
  { path: "/finance/*", element: A(<Penzugy />) },
  { path: "/logisztika", element: A(<Logisztika />) },
  { path: "/warehouse", element: A(<Logisztika />) },
  { path: "/warehouse/list", element: A(<Logisztika />) },
  { path: "/warehouse/operations", element: R(KIOSK_MANAGERS, <InventoryOperationsPage />) },
  { path: "/masterdata/products/taxonomy-review", element: R(MANAGEMENT, <ProductTaxonomyReviewPage />) },
  { path: "/warehouse/products", element: A(<ProductsList />) },
  { path: "/warehouse/products/*", element: A(<ProductsList />) },
  { path: "/products", element: A(<ProductsList />) },
  { path: "/products/*", element: A(<ProductsList />) },
  { path: "/masterdata/products", element: A(<ProductsList />) },
  { path: "/masterdata/products/*", element: A(<ProductsList />) },
  {
    path: "/inventory/products",
    element: <Navigate to="/warehouse/products" replace />,
  },
  { path: "/inventory", element: <Navigate to="/warehouse" replace /> },
  { path: "/inventory/*", element: <Navigate to="/warehouse" replace /> },
  { path: "/warehouse/central-supply", element: A(<CentralSupplyPage />) },
  {
    path: "/procurement",
    element: (
      <Navigate to="/warehouse?view=procurement&section=dashboard" replace />
    ),
  },
  {
    path: "/procurement/*",
    element: (
      <Navigate to="/warehouse?view=procurement&section=dashboard" replace />
    ),
  },
  {
    path: "/warehouse/procurement",
    element: (
      <Navigate to="/warehouse?view=procurement&section=dashboard" replace />
    ),
  },
  { path: "/masters", element: R(MANAGEMENT, <ServicesList />) },
  { path: "/masterdata/services", element: R(MANAGEMENT, <ServicesList />) },
  { path: "/masterdata/services/*", element: R(MANAGEMENT, <ServicesList />) },
  { path: "/services", element: R(MANAGEMENT, <ServicesList />) },
  { path: "/services/*", element: R(MANAGEMENT, <ServicesList />) },
  { path: "/hr", element: A(<EmployeesList />) },
  { path: "/reports", element: <Navigate to="/reports/top-metrics" replace /> },
  {
    path: "/reports/top-metrics",
    element: R(MANAGEMENT, <VirTopMetricsPage />),
  },
  {
    path: "/reports/vir",
    element: <Navigate to="/reports/top-metrics" replace />,
  },
  { path: "/reports/*", element: R(MANAGEMENT, <VirTopMetricsPage />) },
  {
    path: "/appointments",
    element: <Navigate to="/appointments/calendar" replace />,
  },
  { path: "/appointments/calendar", element: A(<AppointmentsCalendar />) },
  {
    path: "/appointments/voice-booking-stats",
    element: R(MANAGEMENT, <BookingVoiceStatsPage />),
  },
  {
    path: "/appointments/*",
    element: <Navigate to="/appointments/calendar" replace />,
  },
  { path: "/workorders", element: A(<WorkOrdersList />) },
  { path: "/workorders/list", element: A(<WorkOrdersList />) },
  { path: "/workorders/new", element: A(<WorkOrderNewModalPage />) },
  { path: "/workorders/:id", element: A(<WorkOrderNewModalPage />) },
  { path: "/workorders/*", element: A(<WorkOrdersList />) },
  { path: "/employees", element: A(<EmployeesList />) },
  { path: "/team", element: <Navigate to="/employees" replace /> },
  { path: "/staff", element: <Navigate to="/employees" replace /> },
  { path: "/employees/:id", element: A(<EmployeeWorkContextPage />) },
  { path: "/employees/*", element: A(<EmployeesList />) },
  {
    path: "/clients",
    element: <Navigate to="/modules/customers/clients" replace />,
  },
  {
    path: "/clients/*",
    element: <Navigate to="/modules/customers/clients" replace />,
  },
  { path: "/crm", element: <Navigate to="/modules/customers/crm" replace /> },
  { path: "/crm/*", element: <Navigate to="/modules/customers/crm" replace /> },
  { path: "/modules/team/timetable", element: A(<RoleTimetablePage />) },
  { path: "/modules/team/attendance", element: A(<HrAttendancePage />) },
  { path: "/staff/chat", element: A(<StaffChatPage />) },
  { path: "/admin/vir", element: R(MANAGEMENT, <VirDashboardPage />) },
  {
    path: "/admin/vir/staff/:id",
    element: R(MANAGEMENT, <VirStaffDetailPage />),
  },
  {
    path: "/admin/vir/services/:id",
    element: R(MANAGEMENT, <VirServiceDetailPage />),
  },
  {
    path: "/admin/vir/reports",
    element: R(MANAGEMENT, <VirReportsAdminPage />),
  },
  { path: "/signage", element: R(MANAGEMENT, <SignageAdmin />) },
  {
    path: "/signage/appearance",
    element: R(MANAGEMENT, <SignageAppearanceAdmin />),
  },
  { path: "/kiosk", element: R(KIOSK_MANAGERS, <KioskAdmin />) },
  { path: "/webshop/admin", element: R(MANAGEMENT, <WebshopAdmin />) },
  {
    path: "/marketing",
    element: <Navigate to="/modules/marketing/campaigns" replace />,
  },
  { path: "/extras", element: <Navigate to="/extra/tasks" replace /> },
  { path: "/finance/transaction", element: <Navigate to="/finance" replace /> },
  { path: "/finance/transactions", element: A(<Penzugy />) },
  { path: "/finance/invoices/out", element: A(<Penzugy />) },
  { path: "/finance/invoices/in", element: A(<Penzugy />) },
  { path: "/settings", element: A(<ModulePlaceholderPage />) },
  { path: "/knowledge-base/checklists", element: A(<ChecklistsPage />) },
  { path: "/knowledge-base/library", element: A(<KnowledgeBasePage />) },
  { path: "/knowledge-base/processes", element: A(<KnowledgeBasePage />) },
  { path: "/knowledge-base/quiz", element: A(<KnowledgeBasePage />) },
  {
    path: "/knowledge-base",
    element: <Navigate to="/knowledge-base/library" replace />,
  },
  {
    path: "/spec/inventory-orders",
    element: <Navigate to="/warehouse/central-supply" replace />,
  },
  { path: "/spec/:moduleKey", element: A(<ModulePlaceholderPage />) },
  { path: "/modules/:moduleKey/*", element: A(<ModulePlaceholderPage />) },
  { path: "*", element: <FallbackRedirect /> },
]);
export default function App() {
  return (
    <Suspense fallback={<BrandLoadingScreen/>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
