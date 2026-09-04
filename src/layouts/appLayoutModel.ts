const PAGE_NAMES: Record<string, string> = {
  "/": "Irányítópult",
  "/employees": "Munkatársak",
  "/appointments": "Időpontok",
  "/appointments/calendar": "Naptár",
  "/appointments/new": "Új időpont",
  "/appointments/list": "Időpontok listája",
  "/modules/appointments/list": "Időpontok listája",
  "/modules/customers/clients": "Vendégek",
  "/workorders": "Munkalap / elszámolás",
  "/finance/product-sale": "Új értékesítés",
  "/finance/cashier": "Pénztár",
  "/finance": "Pénzügy",
  "/warehouse": "Raktár és készlet",
  "/services": "Szolgáltatások",
  "/warehouse/lots": "Sarzs és lejárat (FEFO)",
  "/masterdata/services": "Szolgáltatási törzs",
  "/masterdata/products": "Termékek",
  "/products": "Termékek",
  "/warehouse/products": "Termékek",
  "/dashboard/notifications": "Értesítési központ",
  "/settings": "Rendszerbeállítások",
  "/settings/legal-entities": "Cégek és könyvelési egységek",
  "/settings/roles": "Jogosultságok és hozzáférések",
  "/modules/settings/audit-log": "Audit és rendszeresemény-napló",
  "/modules/settings/chat-supervision": "Munkatársi chat felügyelet",
  "/knowledge-base/checklists": "Check listák",
  "/modules/team/timetable": "Beosztás és munkaidő",
  "/modules/team/attendance": "Jelenlét",
  "/modules/team/payroll": "Bér és jutalék",
  "/hr/positions": "Munkakörök",
  "/hr/applications": "Toborzás",
  "/spec/training": "Képzések",
  "/hr/evaluations": "Értékelések",
  "/staff/chat": "Munkatársi chat",
  "/admin/booking-v4": "Foglalási autopilóta",
  "/modules/vir-autopilot": "Automatizálási központ",
  "/modules/vir-autopilot/dashboard": "Automatizálási központ",
  "/admin/vir": "Intelligencia",
  "/admin/vir/cockpit": "Intelligencia",
  "/admin/vir/actions": "Intelligencia",
  "/admin/vir/intelligence": "Intelligencia",
  "/admin/vir/p1": "Intelligencia",
  "/admin/vir/p2": "Intelligencia",
  "/admin/vir/p3": "Intelligencia",
  "/admin/vir/p3/revenue-leakage": "Intelligencia",
  "/admin/vir/p4": "Intelligencia",
  "/admin/vir/p5": "Intelligencia",
  "/admin/vir/p6": "Intelligencia",
  "/admin/vir/p7": "Intelligencia",
  "/admin/vir/p8": "Intelligencia",
  "/admin/vir/p9": "Intelligencia",
  "/admin/vir/p10": "Intelligencia",
  "/admin/vir/p11": "Intelligencia",
  "/admin/vir/p12": "Intelligencia",
  "/admin/vir/p13": "Intelligencia",
  "/admin/vir/p14": "Intelligencia",
  "/admin/vir/p15": "Intelligencia",
  "/admin/vir/p16": "Intelligencia",
};

const ACCOUNTING_ROLES = ["accounting", "bookkeeper", "konyveles", "könyvelés"];
const ELEVATED_ROLES = ["admin", "administrator", "rendszergazda", "superadmin", "super_admin", "manager", "vezető", "vezeto"];
const RECEPTION_ROLES = ["receptionist", "reception", "recepciós", "recepcios"];
const HR_ROLES = ["hr", "hr_manager", "human_resources", "személyügy", "szemelyugy"];
const STAFF_ROLES = ["employee", "staff", "munkatárs", "munkatars", "professional", "specialist"];

export function parseRoleList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((value) => value.toLowerCase());
  const text = String(raw ?? "");
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.toLowerCase());
  } catch {
    // Non-JSON role strings are handled below.
  }
  return text
    .split(",")
    .map((value) => value.replace(/[[\]"]/g, "").trim().toLowerCase())
    .filter(Boolean);
}

export function deriveRoleFlags(raw: unknown) {
  const roles = parseRoleList(raw);
  const isAccounting = roles.some((role) => ACCOUNTING_ROLES.includes(role));
  const isElevated = roles.some((role) => ELEVATED_ROLES.includes(role));
  const isReceptionist = roles.some((role) => RECEPTION_ROLES.includes(role));
  const isHr = roles.some((role) => HR_ROLES.includes(role));
  const isStaff = isReceptionist || (!isAccounting && !isElevated && !isHr && roles.some((role) => STAFF_ROLES.includes(role)));
  return { roles, isAccounting, isElevated, isReceptionist, isHr, isStaff };
}

export function resolveCurrentPageHu(pathname: string, serviceView: string): string {
  if (pathname === "/masterdata/services") {
    if (serviceView === "categories") return "Szolgáltatási kategóriák";
    if (serviceView === "staff") return "Szakember–szolgáltatás beállítások";
    return "Szolgáltatások";
  }

  return PAGE_NAMES[pathname]
    || pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ")
    || "Irányítópult";
}

export function resolveBackFallback(pathname: string): string {
  if (pathname === "/") return "/";
  if (["/dashboard", "/dashboard/summary", "/dashboard/quick"].includes(pathname)) return "/";

  if (pathname === "/appointments" || pathname === "/appointments/calendar") return "/";
  if (pathname.startsWith("/appointments/") || pathname.startsWith("/modules/appointments/")) return "/appointments/calendar";

  if (pathname === "/workorders") return "/";
  if (pathname.startsWith("/workorders/")) return "/workorders";

  if (pathname === "/employees") return "/";
  if (pathname.startsWith("/employees/") || pathname.startsWith("/hr/") || pathname.startsWith("/modules/team/") || pathname.startsWith("/spec/training")) return "/employees";

  if (pathname === "/finance") return "/";
  if (pathname.startsWith("/finance/")) return "/finance";

  if (pathname === "/warehouse") return "/";
  if (pathname.startsWith("/warehouse/")) return "/warehouse";

  if (pathname === "/settings") return "/";
  if (pathname.startsWith("/settings/") || pathname.startsWith("/modules/settings/")) return "/settings";

  if (pathname.startsWith("/masterdata/")) return "/masters";
  if (pathname.startsWith("/modules/customers/")) return "/";
  if (pathname.startsWith("/knowledge-base/")) return "/";
  if (pathname.startsWith("/services")) return "/";
  if (pathname.startsWith("/products")) return "/warehouse";
  if (pathname.startsWith("/admin/") || pathname.startsWith("/modules/vir-autopilot")) return "/";

  return "/";
}
