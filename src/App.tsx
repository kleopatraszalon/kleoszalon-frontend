import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./styles/kleo-theme.css";
import BrandLoadingScreen from "./components/BrandLoadingScreen";
import {
  ADMIN_ROLES as ADMIN,
  MANAGEMENT_ROLES as MANAGEMENT,
  KIOSK_MANAGER_ROLES as KIOSK_MANAGERS,
  FallbackRedirect,
  PublicOnly,
  authenticated as A,
  roleProtected as R,
} from "./routing/routeAccess";
const ProductsList = lazy(() => import("./pages/ProductsList"));
const ProductTaxonomyReviewPage = lazy(() => import("./pages/ProductTaxonomyReviewPage"));
const InventoryOperationsPage = lazy(() => import("./pages/InventoryOperationsPage"));
const InventoryLotsPage = lazy(() => import("./pages/InventoryLotsPage"));
const WebshopAdmin = lazy(() => import("./pages/WebshopAdmin"));
const HrPositionsPage = lazy(() => import("./pages/HrPositionsPage"));
const HrDevelopmentPage = lazy(() => import("./pages/HrDevelopmentPage"));
const OperationsQualityPage = lazy(
  () => import("./pages/OperationsQualityPage"),
);
const ManagementImprovementPage = lazy(() => import("./pages/ManagementImprovementPage"));
const ManagementToolsPage = lazy(() => import("./pages/ManagementToolsPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const DailyActionsPage = lazy(() => import("./pages/DailyActionsPage"));
const WallBoardDailyActionPage = lazy(() => import("./pages/WallBoardDailyActionPage"));
const KleopatraMobileApp = lazy(() => import("./pages/KleopatraMobileApp"));
const MobileAppAdminPage = lazy(() => import("./pages/MobileAppAdminPage"));
const EmployeeMobileApp = lazy(() => import("./pages/EmployeeMobileApp"));
const GuestReviewTabletPage = lazy(() => import("./pages/GuestReviewTabletPage"));
const VirSpecParityPage = lazy(() => import("./pages/VirSpecParityPage"));
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
const CentralMasterDataPage = lazy(() => import("./pages/CentralMasterDataPage"));
const SystemSettingsPage = lazy(() => import("./pages/SystemSettingsPage"));
const MenuLayoutPage = lazy(() => import("./pages/MenuLayoutPage"));
const GdprCenterPage = lazy(() => import("./pages/GdprCenterPage"));
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
const VirTopMetricsExtendedPage = lazy(() => import("./pages/VirTopMetricsExtendedPage"));
const VirSupplementaryReportsPage = lazy(() => import("./pages/VirSupplementaryReportsPage"));
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
const SaasFranchiseAdminPage = lazy(() => import("./pages/SaasFranchiseAdminPage"));
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
  { path: "/vendeg-ertekeles", element: <GuestReviewTabletPage /> },
  { path: "/employee-app", element: <EmployeeMobileApp /> },
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
  { path: "/admin/saas", element: R(ADMIN, <SaasFranchiseAdminPage />) },
  { path: "/admin/menu-layout", element: R(ADMIN, <MenuLayoutPage />) },
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
  { path: "/operations/tasks", element: <Navigate to="/extra/tasks" replace /> },
  {
    path: "/spec/maintenance",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  { path: "/operations/maintenance", element: <Navigate to="/spec/maintenance" replace /> },
  {
    path: "/extra/documents",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  { path: "/operations/documents", element: <Navigate to="/extra/documents" replace /> },
  {
    path: "/spec/internal-email",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  { path: "/operations/email", element: <Navigate to="/spec/internal-email" replace /> },
  {
    path: "/marketing/complaints",
    element: R(MANAGEMENT, <OperationsQualityPage />),
  },
  { path: "/operations/complaints", element: <Navigate to="/marketing/complaints" replace /> },
  {
    path: "/operations/improvement",
    element: R(MANAGEMENT, <ManagementImprovementPage />),
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
  { path: "/marketing/wallboard", element: R(MANAGEMENT, <WallBoardDailyActionPage />) },
  { path: "/kleopatra-app", element: <KleopatraMobileApp /> },
  { path: "/admin/mobile-app", element: R(MANAGEMENT, <MobileAppAdminPage />) },
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
  { path: "/warehouse/lots", element: R(KIOSK_MANAGERS, <InventoryLotsPage />) },
  { path: "/masterdata", element: R(MANAGEMENT, <CentralMasterDataPage />) },
  { path: "/masterdata/salons", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="salons" />) },
  { path: "/masterdata/departments", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="departments" />) },
  { path: "/masterdata/equipment-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="equipment-types" />) },
  { path: "/masterdata/assets", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="equipment" />) },
  { path: "/masterdata/equipment", element: <Navigate to="/masterdata/assets" replace /> },
  { path: "/masterdata/suppliers", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="suppliers" />) },
  { path: "/masterdata/warehouses", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="warehouses" />) },
  { path: "/masterdata/units", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="units" />) },
  { path: "/masterdata/price-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="price-types" />) },
  { path: "/masterdata/leave-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="leave-types" />) },
  { path: "/masterdata/movement-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="movement-types" />) },
  { path: "/masterdata/stock-movement-types", element: <Navigate to="/masterdata/movement-types" replace /> },
  { path: "/masterdata/payment-methods", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="payment-methods" />) },
  { path: "/masterdata/financial-transaction-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="financial-transaction-types" />) },
  { path: "/spec/warehouses", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="warehouses" />) },
  { path: "/spec/leave-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="leave-types" />) },
  { path: "/spec/financial-transaction-types", element: R(MANAGEMENT, <CentralMasterDataPage entityKey="financial-transaction-types" />) },
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
  { path: "/reports/top", element: R(MANAGEMENT, <VirTopMetricsExtendedPage />) },
  { path: "/reports/top-metrics", element: R(MANAGEMENT, <VirTopMetricsExtendedPage />) },
  { path: "/reports/profit", element: R(MANAGEMENT, <Penzugy />) },
  { path: "/reports/inventory-movement", element: R(MANAGEMENT, <InventoryOperationsPage />) },
  { path: "/reports/inventory-movements", element: R(MANAGEMENT, <InventoryOperationsPage />) },
  { path: "/reports/expected-revenue", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/custom", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/builder", element: R(MANAGEMENT, <VirSupplementaryReportsPage />) },
  { path: "/reports/management-tools", element: R(MANAGEMENT, <ManagementToolsPage />) },
  {
    path: "/reports/vir",
    element: <Navigate to="/reports/top-metrics" replace />,
  },
  { path: "/reports/*", element: <Navigate to="/reports/top-metrics" replace /> },
  {
    path: "/appointments",
    element: <Navigate to="/appointments/calendar" replace />,
  },
  { path: "/appointments/calendar", element: A(<AppointmentsCalendar />) },
  { path: "/appointments/list", element: <Navigate to="/modules/appointments/list" replace /> },
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
  { path: "/admin/finance", element: R(MANAGEMENT, <VirDashboardPage />) },
  { path: "/admin/reports", element: R(MANAGEMENT, <VirReportsAdminPage />) },
  { path: "/admin/vir/spec-parity", element: R(MANAGEMENT, <VirSpecParityPage />) },
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
  { path: "/kiosk/admin", element: R(KIOSK_MANAGERS, <KioskAdmin />) },
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
  { path: "/settings", element: R(MANAGEMENT, <SystemSettingsPage />) },
  { path: "/settings/menu-order", element: <Navigate to="/admin/menu-layout" replace /> },
  { path: "/settings/system-health", element: <Navigate to="/admin/system-health" replace /> },
  { path: "/settings/uat", element: <Navigate to="/admin/uat" replace /> },
  { path: "/settings/gdpr", element: <Navigate to="/admin/gdpr" replace /> },
  { path: "/admin/gdpr", element: R(MANAGEMENT, <GdprCenterPage />) },
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
