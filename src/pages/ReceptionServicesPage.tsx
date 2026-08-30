import React, { useEffect, useMemo, useState } from "react";
import { Clock3, Search, Tag } from "lucide-react";
import withBase from "../utils/apiBase";

type Service = {
  id: string | number;
  name: string;
  code?: string | null;
  service_type_name?: string | null;
  list_price?: number | null;
  base_price?: number | null;
  promo_price?: number | null;
  duration_minutes?: number | null;
  duration_min?: number | null;
  duration?: number | null;
  is_active?: boolean | null;
};

const authHeaders = () => {
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

export default function ReceptionServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(withBase("services"), { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (active) setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => active && setError("A szolgáltatások betöltése nem sikerült."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("hu-HU");
    return services
      .filter((service) => service.is_active !== false)
      .filter((service) => !needle || `${service.name} ${service.code || ""} ${service.service_type_name || ""}`.toLocaleLowerCase("hu-HU").includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, "hu"));
  }, [query, services]);

  return (
    <main style={{ maxWidth: 1500, margin: "0 auto", padding: "20px 24px 36px" }}>
      <section style={{ background: "#fff", border: "1px solid #eee7df", borderRadius: 18, overflow: "hidden" }}>
        <header style={{ padding: "22px 24px", borderBottom: "1px solid #eee7df", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>Szolgáltatások</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.68 }}>Aktív szolgáltatások, árak és időtartamok. A recepciós felület innen nem módosít törzsadatot.</p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #ddd4ca", borderRadius: 10, padding: "9px 12px", minWidth: 300 }}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés név, kód vagy kategória szerint" style={{ border: 0, outline: 0, width: "100%" }} />
          </label>
        </header>

        {error && <div style={{ margin: 20, padding: 12, borderRadius: 10, background: "#fff1f1", color: "#9b2c2c" }}>{error}</div>}
        {loading ? <div style={{ padding: 28 }}>Szolgáltatások betöltése…</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", background: "#faf8f5" }}><th style={th}>Szolgáltatás</th><th style={th}>Kategória</th><th style={th}>Ár</th><th style={th}>Időtartam</th></tr></thead>
              <tbody>{visible.map((service) => {
                const price = service.promo_price ?? service.list_price ?? service.base_price;
                const duration = service.duration_minutes ?? service.duration_min ?? service.duration;
                return <tr key={String(service.id)} style={{ borderTop: "1px solid #eee7df" }}>
                  <td style={td}><strong>{service.name}</strong>{service.code && <div style={{ fontSize: 12, opacity: 0.6 }}>{service.code}</div>}</td>
                  <td style={td}>{service.service_type_name || "—"}</td>
                  <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Tag size={14} />{price == null ? "—" : `${Number(price).toLocaleString("hu-HU")} Ft`}</span></td>
                  <td style={td}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock3 size={14} />{duration == null ? "—" : `${duration} perc`}</span></td>
                </tr>;
              })}</tbody>
            </table>
            {!visible.length && !error && <div style={{ padding: 28, textAlign: "center", opacity: 0.65 }}>Nincs találat.</div>}
          </div>
        )}
      </section>
    </main>
  );
}

const th: React.CSSProperties = { padding: "12px 16px", fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7 };
const td: React.CSSProperties = { padding: "14px 16px", verticalAlign: "middle" };
