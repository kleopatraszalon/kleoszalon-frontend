import React from "react";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCapabilities } from "../hooks/useCapabilities";

type Rule = { feature?: string; menu?: string };

function ruleFor(pathname: string, search: string): Rule | null {
  const q = new URLSearchParams(search);
  const procurement = pathname === "/warehouse" && q.get("view") === "procurement";
  if (procurement) {
    const section = q.get("section") || "dashboard";
    const known = new Set(["dashboard","suggestions","approvals","orders","suppliers","prices","performance","deviations"]);
    return { feature: "procurement", menu: `procurement.${known.has(section) ? section : "dashboard"}` };
  }
  if (pathname === "/admin/access-control" || pathname === "/modules/team/roles") return { menu: "settings.access-control" };
  if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/reports")) return { feature: "management_dashboard" };
  if (pathname === "/penzugy" || pathname.startsWith("/finance")) return { feature: "finance" };
  if (pathname === "/hr" || pathname.startsWith("/hr/") || pathname.startsWith("/modules/team") || pathname.startsWith("/employees")) return { feature: "hr" };
  if (pathname === "/logisztika" || pathname.startsWith("/warehouse") || pathname.startsWith("/inventory")) return { feature: "inventory" };
  if (pathname.startsWith("/audit") || pathname.includes("audit")) return { feature: "audit" };
  return null;
}

export default function AccessBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, loading, error, feature, menu } = useCapabilities();
  const rule = ruleFor(location.pathname, location.search);

  if (!rule) return <>{children}</>;
  if (loading) return <div style={{ padding: 32 }}>Jogosultság ellenőrzése…</div>;
  if (error) return <Denied title="A jogosultságok nem ellenőrizhetők" detail={error} />;

  const featureAllowed = !rule.feature || feature(rule.feature);
  const menuAllowed = !rule.menu || menu(rule.menu, "can_view");
  if (!featureAllowed || !menuAllowed) {
    return <Denied title="Nincs hozzáférése ehhez a modulhoz" detail="A menüpont vagy funkció nincs engedélyezve az aktuális szerepkör számára. A jogosultság a Beállítások és adminisztráció → Jogosultságok oldalon módosítható." />;
  }

  // data felhasználása szándékos: a hook válaszának betöltése után engedünk tovább.
  void data;
  return <>{children}</>;
}

function Denied({ title, detail }: { title: string; detail: string }) {
  return <main style={{ minHeight: "55vh", display: "grid", placeItems: "center", padding: 32 }}>
    <section style={{ maxWidth: 620, width: "100%", border: "1px solid #eadde8", borderRadius: 18, padding: 28, background: "#fff", boxShadow: "0 14px 40px rgba(45,25,40,.08)" }}>
      <ShieldAlert size={32} />
      <h2 style={{ margin: "14px 0 8px" }}>{title}</h2>
      <p style={{ margin: 0, lineHeight: 1.6, opacity: .72 }}>{detail}</p>
    </section>
  </main>;
}
