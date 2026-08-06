import React, { useMemo, useState } from "react";
import { CheckCircle2, Gauge, Pencil, Save, Target, X } from "lucide-react";
import "./DashboardTargets.css";

type Props = {
  stats: Record<string, number>;
  locationKey?: string;
};

type Targets = {
  revenue: number;
  capacity: number;
  newClients: number;
  completionRate: number;
};

const defaults: Targets = {
  revenue: 5000000,
  capacity: 75,
  newClients: 120,
  completionRate: 90,
};

const number = (value: unknown, digits = 0) =>
  Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: digits });

const money = (value: unknown) => `${number(value)} Ft`;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

export default function DashboardTargets({ stats, locationKey = "all" }: Props) {
  const storageKey = `kleo_dashboard_targets_${locationKey}`;
  const [editing, setEditing] = useState(false);
  const [targets, setTargets] = useState<Targets>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });
  const [draft, setDraft] = useState<Targets>(targets);

  const rows = useMemo(() => [
    {
      key: "revenue" as const,
      label: "Bevételi cél",
      current: Number(stats.totalRevenue || 0),
      target: targets.revenue,
      currentText: money(stats.totalRevenue),
      targetText: money(targets.revenue),
      icon: Target,
    },
    {
      key: "capacity" as const,
      label: "Kapacitáscél",
      current: Number(stats.averageCapacity || 0),
      target: targets.capacity,
      currentText: `${number(stats.averageCapacity, 1)}%`,
      targetText: `${number(targets.capacity, 1)}%`,
      icon: Gauge,
    },
    {
      key: "newClients" as const,
      label: "Új vendég cél",
      current: Number(stats.newClients || 0),
      target: targets.newClients,
      currentText: number(stats.newClients),
      targetText: number(targets.newClients),
      icon: Target,
    },
    {
      key: "completionRate" as const,
      label: "Teljesítési cél",
      current: Number(stats.completionRate || 0),
      target: targets.completionRate,
      currentText: `${number(stats.completionRate, 1)}%`,
      targetText: `${number(targets.completionRate, 1)}%`,
      icon: CheckCircle2,
    },
  ], [stats, targets]);

  const save = () => {
    const sanitized = {
      revenue: Math.max(0, Number(draft.revenue) || 0),
      capacity: clamp(Number(draft.capacity) || 0),
      newClients: Math.max(0, Number(draft.newClients) || 0),
      completionRate: clamp(Number(draft.completionRate) || 0),
    };
    setTargets(sanitized);
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    setEditing(false);
  };

  return (
    <section className="dashboard-targets">
      <header>
        <div>
          <span>KPI CÉLOK</span>
          <h2>Vezetői célkövetés</h2>
          <p>A célértékek szalononként a böngészőben kerülnek mentésre.</p>
        </div>
        {!editing ? (
          <button type="button" onClick={() => { setDraft(targets); setEditing(true); }}><Pencil/> Célok szerkesztése</button>
        ) : (
          <div className="dashboard-targets__actions">
            <button type="button" className="is-secondary" onClick={() => setEditing(false)}><X/> Mégse</button>
            <button type="button" onClick={save}><Save/> Mentés</button>
          </div>
        )}
      </header>

      {editing && (
        <div className="dashboard-targets__editor">
          <label>Bevételi cél (Ft)<input type="number" min="0" value={draft.revenue} onChange={e => setDraft({ ...draft, revenue: Number(e.target.value) })}/></label>
          <label>Kapacitáscél (%)<input type="number" min="0" max="100" value={draft.capacity} onChange={e => setDraft({ ...draft, capacity: Number(e.target.value) })}/></label>
          <label>Új vendég cél<input type="number" min="0" value={draft.newClients} onChange={e => setDraft({ ...draft, newClients: Number(e.target.value) })}/></label>
          <label>Teljesítési cél (%)<input type="number" min="0" max="100" value={draft.completionRate} onChange={e => setDraft({ ...draft, completionRate: Number(e.target.value) })}/></label>
        </div>
      )}

      <div className="dashboard-targets__grid">
        {rows.map(({ key, label, current, target, currentText, targetText, icon: Icon }) => {
          const progress = target > 0 ? clamp((current / target) * 100) : 0;
          return (
            <article key={key}>
              <div className="dashboard-targets__title"><Icon/><span>{label}</span><b>{number(progress, 0)}%</b></div>
              <div className="dashboard-targets__values"><strong>{currentText}</strong><small>Cél: {targetText}</small></div>
              <div className="dashboard-targets__track"><i style={{ width: `${progress}%` }}/></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
