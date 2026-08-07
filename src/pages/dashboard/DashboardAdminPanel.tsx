import React, { useEffect, useState } from "react";
import { Check, GripVertical, Settings2, X } from "lucide-react";
import api from "../../api/api";
import "./DashboardAdminPanel.css";

export type DashboardSettings = {
  executive_overview: boolean;
  period_insights: boolean;
  targets: boolean;
  live_business: boolean;
  classic_kpis: boolean;
  revenue_mix: boolean;
  location_performance: boolean;
  hr_performance: boolean;
  top_staff_alerts: boolean;
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  executive_overview: true,
  period_insights: true,
  targets: true,
  live_business: true,
  classic_kpis: true,
  revenue_mix: true,
  location_performance: true,
  hr_performance: true,
  top_staff_alerts: true,
};

export const DEFAULT_DASHBOARD_ORDER: Array<keyof DashboardSettings> = [
  "executive_overview",
  "period_insights",
  "targets",
  "live_business",
  "classic_kpis",
  "revenue_mix",
  "location_performance",
  "hr_performance",
  "top_staff_alerts",
];

const options: Array<{ key: keyof DashboardSettings; title: string; description: string }> = [
  { key: "executive_overview", title: "Vezetői összefoglaló", description: "Fő vezetői kártyák és figyelmeztetések." },
  { key: "period_insights", title: "Időszakos elemzés", description: "Trendek és időszaki összehasonlítások." },
  { key: "targets", title: "Célok", description: "Bevételi, kapacitás-, vendég- és teljesítési célok." },
  { key: "live_business", title: "Élő üzleti adatok", description: "Pénzügy, CRM, készlet és lezárt munkalapok." },
  { key: "classic_kpis", title: "Alap KPI-k", description: "Bevétel, átlagos számla, kapacitás, vendég- és hiányzási adatok." },
  { key: "revenue_mix", title: "Forgalom és bevételmix", description: "Bevételi trend és szolgáltatás/termék megoszlás." },
  { key: "location_performance", title: "Szalon- és szakmai teljesítmény", description: "Szalononkénti és munkakörönkénti bevételek." },
  { key: "hr_performance", title: "HR és munkaköri mutatók", description: "Szakmai eredményesség, betegségek és hiányzások." },
  { key: "top_staff_alerts", title: "Toplista és vezetői riasztások", description: "Legeredményesebb munkatársak és kockázati jelzések." },
];

const optionMap = new Map(options.map(item => [item.key, item]));
const roleOptions = [
  { key: "admin", label: "Admin" },
  { key: "manager", label: "Vezető" },
  { key: "receptionist", label: "Recepció" },
  { key: "employee", label: "Munkatárs" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  value: DashboardSettings;
  order: Array<keyof DashboardSettings>;
  currentLocationId?: string;
  locations: Array<{ id: string; name: string }>;
  onSaved: () => void;
};

export default function DashboardAdminPanel({ open, onClose, value, order, currentLocationId, locations, onSaved }: Props) {
  const [settings, setSettings] = useState<DashboardSettings>(value);
  const [widgetOrder, setWidgetOrder] = useState<Array<keyof DashboardSettings>>(order);
  const [roleKey, setRoleKey] = useState("admin");
  const [locationId, setLocationId] = useState(currentLocationId || "");
  const [dragKey, setDragKey] = useState<keyof DashboardSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRoleKey("admin");
    setLocationId(currentLocationId || "");
  }, [open, currentLocationId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError("");
    api.get("/transactions/dashboard-settings", { params: { role_key: roleKey, location_id: locationId || undefined } })
      .then(response => {
        setSettings({ ...DEFAULT_DASHBOARD_SETTINGS, ...(response.data?.settings || {}) });
        const incoming = Array.isArray(response.data?.order) ? response.data.order : DEFAULT_DASHBOARD_ORDER;
        setWidgetOrder(incoming.filter((key: string) => optionMap.has(key as keyof DashboardSettings)) as Array<keyof DashboardSettings>);
      })
      .catch(reason => setError(reason?.response?.data?.message || reason?.message || "A dashboard profil nem tölthető be."))
      .finally(() => setLoading(false));
  }, [open, roleKey, locationId]);

  useEffect(() => { if (!open) { setSettings(value); setWidgetOrder(order); } }, [open, value, order]);
  if (!open) return null;

  const move = (from: keyof DashboardSettings, to: keyof DashboardSettings) => {
    if (from === to) return;
    setWidgetOrder(current => {
      const next = [...current];
      const fromIndex = next.indexOf(from), toIndex = next.indexOf(to);
      if (fromIndex < 0 || toIndex < 0) return current;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, from);
      return next;
    });
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await api.put("/transactions/dashboard-settings", {
        role_key: roleKey,
        location_id: locationId || null,
        settings,
        order: widgetOrder,
      });
      onSaved();
      onClose();
    } catch (reason: any) {
      setError(reason?.response?.data?.message || reason?.message || "A dashboard beállításai nem menthetők.");
    } finally { setSaving(false); }
  };

  return <div className="dashboard-admin-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="dashboard-admin-panel" role="dialog" aria-modal="true">
      <header><div><span><Settings2 size={17}/> DASHBOARD ADMIN</span><h2>Dashboard profilok</h2><p>Állítsa be szerepkörönként és telephelyenként a látható blokkokat és azok sorrendjét.</p></div><button onClick={onClose} aria-label="Bezárás"><X/></button></header>
      <div className="dashboard-admin-scope">
        <label><span>Szerepkör</span><select value={roleKey} onChange={e => setRoleKey(e.target.value)}>{roleOptions.map(role => <option key={role.key} value={role.key}>{role.label}</option>)}</select></label>
        <label><span>Telephely</span><select value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Minden telephely / alapértelmezett</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      </div>
      {error && <div className="dashboard-admin-error">{error}</div>}
      {loading ? <div className="dashboard-admin-loading">Dashboard profil betöltése…</div> : <div className="dashboard-admin-options">
        {widgetOrder.map(key => {
          const option = optionMap.get(key)!;
          return <div key={key} className={`dashboard-admin-option ${settings[key] ? "is-enabled" : ""}`} draggable onDragStart={() => setDragKey(key)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragKey) move(dragKey, key); setDragKey(null); }} onDragEnd={() => setDragKey(null)}>
            <span className="dashboard-admin-grip" title="Húzza a sorrend módosításához"><GripVertical size={18}/></span>
            <label>
              <span className="dashboard-admin-check"><input type="checkbox" checked={settings[key]} onChange={e => setSettings(current => ({ ...current, [key]: e.target.checked }))}/><i>{settings[key] && <Check size={14}/>}</i></span>
              <span><b>{option.title}</b><small>{option.description}</small></span>
            </label>
          </div>;
        })}
      </div>}
      <footer><button onClick={() => { setSettings(DEFAULT_DASHBOARD_SETTINGS); setWidgetOrder(DEFAULT_DASHBOARD_ORDER); }}>Alapértelmezés</button><div><button onClick={onClose}>Mégse</button><button className="dashboard-admin-save" onClick={save} disabled={saving || loading}>{saving ? "Mentés…" : "Profil mentése"}</button></div></footer>
    </section>
  </div>;
}
