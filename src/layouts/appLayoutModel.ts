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
  "/admin/booking-v4": "VIR Autopilot",
  "/modules/vir-autopilot": "VIR Autopilot",
  "/modules/vir-autopilot/dashboard": "VIR Autopilot",
  "/admin/vir/cockpit": "VIR Manager Cockpit",
  "/admin/vir/actions": "Egységes VIR Akcióközpont",
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
