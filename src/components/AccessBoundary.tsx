import React from "react";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCapabilities } from "../hooks/useCapabilities";
import { useCurrentUser } from "../hooks/useCurrentUser";

type Rule = { feature?: string; menu?: string; financial?: boolean };
function roles(raw:unknown):string[]{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());const t=String(raw??"");try{const p=JSON.parse(t);if(Array.isArray(p))return p.map(String).map(x=>x.toLowerCase());if(p!=null)return[String(p).toLowerCase()]}catch{}return t.split(",").map(x=>x.replace(/[\[\]"]/g,"").trim().toLowerCase()).filter(Boolean)}

function ruleFor(pathname: string, search: string): Rule | null {
  const q = new URLSearchParams(search);
  const procurement = pathname === "/warehouse" && q.get("view") === "procurement";
  if (procurement) {
    const section = q.get("section") || "dashboard";
    const known = new Set(["dashboard","suggestions","approvals","orders","suppliers","prices","performance","deviations"]);
    return { feature: "procurement", menu: `procurement.${known.has(section) ? section : "dashboard"}` };
  }
  if (pathname === "/admin/access-control" || pathname === "/modules/team/roles" || pathname === "/settings/roles") return { feature: "hr", menu: "team.roles" };
  if (pathname === "/finance/cash") return { feature: "finance", menu: "finance.cash", financial: true };
  if (pathname === "/finance/invoice" || pathname.startsWith("/finance/invoices")) return { feature: "finance", menu: "finance.invoices", financial: true };
  if (pathname === "/finance/transactions" || pathname === "/finance/transaction") return { feature: "finance", menu: "finance.transactions", financial: true };
  if (pathname === "/workorders" || pathname.startsWith("/workorders/")) return { feature: "finance", menu: "finance.workorders", financial: true };
  if (pathname === "/penzugy" || pathname === "/finance" || pathname.startsWith("/modules/finance")) return { feature: "finance", menu: "finance", financial: true };
  if (pathname === "/employees" || pathname.startsWith("/employees/")) return { feature: "hr", menu: "team.employees" };
  if (pathname === "/hr/positions") return { feature: "hr", menu: "team.positions" };
  if (pathname === "/timetable/update") return { feature: "hr", menu: "team.schedule" };
  if (pathname === "/hr/vacations" || pathname === "/masterdata/vacation-types") return { feature: "hr", menu: "team.vacations" };
  if (pathname === "/modules/team/payroll") return { feature: "payroll", menu: "finance.payroll", financial: true };
  if (pathname === "/modules/team/performance" || pathname === "/hr/evaluations") return { feature: "hr", menu: "team.performance" };
  if (pathname === "/hr" || pathname.startsWith("/hr/")) return { feature: "hr", menu: "team" };
  if (pathname === "/products" || pathname === "/warehouse/products") return { feature: "inventory", menu: "inventory.products" };
  if (pathname === "/warehouse/list" || pathname === "/logisztika") return { feature: "inventory", menu: "inventory.stock" };
  if (pathname === "/inventory/transfer") return { feature: "inventory", menu: "inventory.transfers" };
  if (pathname === "/inventory/usage") return { feature: "inventory", menu: "inventory.usage" };
  if (pathname === "/inventory/adjustment") return { feature: "inventory", menu: "inventory.adjustment" };
  if (pathname === "/warehouse") return { feature: "inventory", menu: "inventory" };
  if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/reports")) return { feature: "management_dashboard" };
  if (pathname.startsWith("/audit") || pathname.includes("audit")) return { feature: "audit", menu: "settings.audit" };
  return null;
}

function storeManagerPathAllowed(pathname:string,search:string){
  const q=new URLSearchParams(search);
  if(["/","/dashboard","/dashboard/summary","/dashboard/quick"].includes(pathname))return true;
  if(pathname==="/appointments/calendar"||pathname.startsWith("/modules/appointments/"))return true;
  if(pathname==="/modules/team/timetable"||pathname==="/modules/team/attendance"||pathname==="/timetable/update")return true;
  if(pathname==="/employees"||pathname.startsWith("/employees/")||pathname==="/hr"||pathname==="/hr/positions")return true;
  if(pathname.startsWith("/modules/customers/")||pathname==="/modules/clients"||pathname==="/modules/crm")return true;
  if(pathname==="/workorders"||pathname.startsWith("/workorders/"))return true;
  if(pathname==="/warehouse"||pathname==="/warehouse/list"||pathname==="/warehouse/products"||pathname==="/logisztika"){
    if(pathname!=="/warehouse"||q.get("view")!=="procurement")return true;
    return ["dashboard","suggestions","orders"].includes(q.get("section")||"dashboard");
  }
  if(pathname==="/knowledge-base/checklists"||pathname==="/knowledge-base")return true;
  return false;
}

export default function AccessBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user }=useCurrentUser();
  const userRoles=roles(user?.role);
  const customer=userRoles.some(r=>["customer","client","guest","ugyfel","ügyfél","vendeg","vendég"].includes(r));
  const storeManager=userRoles.some(r=>["location_manager","üzletvezető","uzletvezeto","store_manager","branch_manager"].includes(r));
  const elevated=storeManager||userRoles.some(r=>["admin","administrator","rendszergazda","superadmin","super_admin","manager","vezető","vezeto"].includes(r));
  const staff=!customer&&!elevated&&userRoles.some(r=>["employee","receptionist"].includes(r));
  const selfDashboard=["/","/dashboard","/dashboard/summary","/dashboard/quick"].includes(location.pathname);
  const customerAllowed=selfDashboard||location.pathname.startsWith("/customer/");
  const { loading, error, feature, menu } = useCapabilities();
  const rule = ruleFor(location.pathname, location.search);

  if(customer){
    if(customerAllowed)return <>{children}</>;
    return <Denied title="Ez nem ügyfélfunkció" detail="Az ügyfélfiókból csak a saját irányítópult és az időpontfoglalás érhető el."/>;
  }
  if(storeManager&&!storeManagerPathAllowed(location.pathname,location.search)){
    return <Denied title="Ez nem üzletvezetői funkció" detail="Az üzletvezető kizárólag a saját üzlet napi működéséhez tartozó dolgozókat, beosztást, időpontokat, ügyfeleket, munkalapokat, készletet, beszerzést és check listákat kezelheti."/>;
  }
  if(staff&&selfDashboard)return <>{children}</>;
  if (!rule) return <>{children}</>;
  if (loading) return <div style={{ padding: 32 }}>Jogosultság ellenőrzése…</div>;
  if (error) return <Denied title="A jogosultságok nem ellenőrizhetők" detail={error} />;

  const featureAllowed = !rule.feature || feature(rule.feature);
  const menuAllowed = !rule.menu || menu(rule.menu, "can_view");
  const financialAllowed = !rule.financial || !rule.menu || menu(rule.menu, "can_view_financial");
  if (!featureAllowed || !menuAllowed || !financialAllowed) {
    return <Denied title="Nincs hozzáférése ehhez a modulhoz" detail="A menüpont, funkció vagy érzékeny adat nincs engedélyezve az aktuális szerepkör számára. A jogosultság a Beállítások és adminisztráció → Jogosultságok oldalon módosítható." />;
  }
  return <>{children}</>;
}

function Denied({ title, detail }: { title: string; detail: string }) {
  return <main style={{ minHeight: "55vh", display: "grid", placeItems: "center", padding: 32 }}><section style={{ maxWidth: 620, width: "100%", border: "1px solid #eadde8", borderRadius: 18, padding: 28, background: "#fff", boxShadow: "0 14px 40px rgba(45,25,40,.08)" }}><ShieldAlert size={32} /><h2 style={{ margin: "14px 0 8px" }}>{title}</h2><p style={{ margin: 0, lineHeight: 1.6, opacity: .72 }}>{detail}</p></section></main>;
}
