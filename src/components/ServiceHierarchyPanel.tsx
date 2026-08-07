import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Layers3 } from "lucide-react";
import withBase from "../utils/apiBase";

type Service = {
  id: string | number;
  name: string;
  service_type_id?: string | null;
  service_type_name?: string | null;
  list_price?: number | null;
  base_price?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
  altegio_service_id?: number | null;
};

const getToken = () =>
  localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";

function money(value?: number | null) {
  if (value == null) return "—";
  return `${Number(value).toLocaleString("hu-HU")} Ft`;
}

export default function ServiceHierarchyPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = getToken();
        const res = await fetch(withBase("services?include_inactive=1"), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setServices(data);
      } catch {
        // A normál ServicesList saját hibakezelése továbbra is megmarad.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    services.forEach((service) => {
      const category = service.service_type_name || "Egyéb / kategória nélkül";
      const list = map.get(category) || [];
      list.push(service);
      map.set(category, list);
    });
    return Array.from(map.entries());
  }, [services]);

  if (loading || groups.length === 0) return null;

  return (
    <section style={{ margin: "12px 18px 4px", border: "1px solid #e8e5df", borderRadius: 14, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #eeeae3" }}>
        <Layers3 size={18} />
        <div>
          <div style={{ fontWeight: 800 }}>Szolgáltatási hierarchia</div>
          <div style={{ fontSize: 12, color: "#6f6b63", marginTop: 2 }}>
            {groups.length} kategória · {services.length} szolgáltatás. A kategóriák sorrendje az Altegio export sorrendjét követi.
          </div>
        </div>
      </div>

      <div style={{ maxHeight: 420, overflow: "auto" }}>
        {groups.map(([category, items]) => {
          const expanded = Boolean(open[category]);
          return (
            <div key={category} style={{ borderBottom: "1px solid #f2efe9" }}>
              <button
                type="button"
                onClick={() => setOpen((prev) => ({ ...prev, [category]: !prev[category] }))}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  border: 0, background: "transparent", padding: "11px 14px", cursor: "pointer", textAlign: "left",
                }}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <strong style={{ flex: 1 }}>{category}</strong>
                <span style={{ fontSize: 12, color: "#777" }}>{items.length} szolgáltatás</span>
              </button>

              {expanded && (
                <div style={{ padding: "0 14px 10px 38px" }}>
                  {items.map((service) => (
                    <div
                      key={String(service.id)}
                      style={{
                        display: "grid", gridTemplateColumns: "minmax(260px,1fr) 130px 95px 95px",
                        gap: 12, alignItems: "center", padding: "7px 0", borderTop: "1px dashed #eee9df", fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{service.name}</span>
                      <span>{money(service.list_price ?? service.base_price)}</span>
                      <span>{service.duration_minutes != null ? `${service.duration_minutes} perc` : "—"}</span>
                      <span style={{ color: service.is_active === false ? "#9a4c45" : "#357a55" }}>
                        {service.is_active === false ? "inaktív" : "aktív"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
