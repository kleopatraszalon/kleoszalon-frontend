import React, { useEffect, useState } from "react";
import { Check, Settings2, X } from "lucide-react";
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

type Props = {
  open: boolean;
  onClose: () => void;
  value: DashboardSettings;
  onSaved: (settings: DashboardSettings) => void;
};

export default function DashboardAdminPanel({ open, onClose, value, onSaved }: Props) {
  const [settings, setSettings] = useState<DashboardSettings>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setSettings(value), [value]);
  if (!open) return null;

  const save = async () => {
    setSaving(true); setError("");
    try {
      const response = await api.put("/transactions/dashboard-settings", { settings });
      const next = { ...DEFAULT_DASHBOARD_SETTINGS, ...(response.data?.settings || settings) } as DashboardSettings;
      onSaved(next);
      onClose();
    } catch (reason: any) {
      setError(reason?.response?.data?.message || reason?.message || "A dashboard beállításai nem menthetők.");
    } finally { setSaving(false); }
  };

  return <div className="dashboard-admin-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="dashboard-admin-panel" role="dialog" aria-modal="true">
      <header><div><span><Settings2 size={17}/> DASHBOARD ADMIN</span><h2>Mit mutasson az irányítópult?</h2><p>Kapcsolja be vagy ki a vezetői dashboard fő blokkjait.</p></div><button onClick={onClose} aria-label="Bezárás"><X/></button></header>
      {error && <div className="dashboard-admin-error">{error}</div>}
      <div className="dashboard-admin-options">
        {options.map(option => <label key={option.key} className={settings[option.key] ? "is-enabled" : ""}>
          <span className="dashboard-admin-check"><input type="checkbox" checked={settings[option.key]} onChange={e => setSettings(current => ({ ...current, [option.key]: e.target.checked }))}/><i>{settings[option.key] && <Check size={14}/>}</i></span>
          <span><b>{option.title}</b><small>{option.description}</small></span>
        </label>)}
      </div>
      <footer><button onClick={() => setSettings(DEFAULT_DASHBOARD_SETTINGS)}>Minden bekapcsolása</button><div><button onClick={onClose}>Mégse</button><button className="dashboard-admin-save" onClick={save} disabled={saving}>{saving ? "Mentés…" : "Beállítások mentése"}</button></div></footer>
    </section>
  </div>;
}
