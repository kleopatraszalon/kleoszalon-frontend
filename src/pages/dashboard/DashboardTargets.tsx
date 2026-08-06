import React, { ChangeEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Gauge, Pencil, RotateCcw, Save, Target, Upload, X } from "lucide-react";
import "./DashboardTargets.css";

type Props = { stats: Record<string, number>; locationKey?: string | number };
type Targets = { revenue: number; capacity: number; newClients: number; completionRate: number };

const defaults: Targets = { revenue: 5000000, capacity: 75, newClients: 120, completionRate: 90 };
const number = (value: unknown, digits = 0) => Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: digits });
const money = (value: unknown) => `${number(value)} Ft`;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const sanitize = (value: Partial<Targets>): Targets => ({
  revenue: Math.max(0, Number(value.revenue) || 0),
  capacity: clamp(Number(value.capacity) || 0),
  newClients: Math.max(0, Number(value.newClients) || 0),
  completionRate: clamp(Number(value.completionRate) || 0),
});

export default function DashboardTargets({ stats, locationKey = "all" }: Props) {
  const storageKey = `kleo_dashboard_targets_${String(locationKey)}`;
  const importRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [targets, setTargets] = useState<Targets>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? sanitize({ ...defaults, ...JSON.parse(saved) }) : defaults;
    } catch { return defaults; }
  });
  const [draft, setDraft] = useState<Targets>(targets);

  const rows = useMemo(() => [
    { key: "revenue" as const, label: "Bevételi cél", current: Number(stats.totalRevenue || 0), target: targets.revenue, currentText: money(stats.totalRevenue), targetText: money(targets.revenue), icon: Target },
    { key: "capacity" as const, label: "Kapacitáscél", current: Number(stats.averageCapacity || 0), target: targets.capacity, currentText: `${number(stats.averageCapacity, 1)}%`, targetText: `${number(targets.capacity, 1)}%`, icon: Gauge },
    { key: "newClients" as const, label: "Új vendég cél", current: Number(stats.newClients || 0), target: targets.newClients, currentText: number(stats.newClients), targetText: number(targets.newClients), icon: Target },
    { key: "completionRate" as const, label: "Teljesítési cél", current: Number(stats.completionRate || 0), target: targets.completionRate, currentText: `${number(stats.completionRate, 1)}%`, targetText: `${number(targets.completionRate, 1)}%`, icon: CheckCircle2 },
  ], [stats, targets]);

  const achieved = rows.filter(row => row.target > 0 && row.current >= row.target).length;
  const averageProgress = rows.reduce((sum, row) => sum + (row.target > 0 ? clamp((row.current / row.target) * 100) : 0), 0) / rows.length;

  const persist = (next: Targets, feedback: string) => {
    setTargets(next); setDraft(next); localStorage.setItem(storageKey, JSON.stringify(next)); setMessage(feedback);
    window.setTimeout(() => setMessage(""), 2600);
  };
  const save = () => { persist(sanitize(draft), "A célértékek mentése sikerült."); setEditing(false); };
  const reset = () => { persist(defaults, "Az alapértelmezett célértékek visszaálltak."); setEditing(false); };
  const exportTargets = () => {
    const blob = new Blob([JSON.stringify({ locationKey: String(locationKey), targets }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `kleo-kpi-celok-${String(locationKey)}.json`; link.click(); URL.revokeObjectURL(url);
    setMessage("A célértékek exportálása elkészült.");
  };
  const importTargets = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try { const parsed = JSON.parse(await file.text()); persist(sanitize(parsed.targets || parsed), "A célértékek importálása sikerült."); setEditing(false); }
    catch { setMessage("Az importfájl nem érvényes KPI célfájl."); window.setTimeout(() => setMessage(""), 3000); }
  };

  return <section className="dashboard-targets">
    <header><div><span>KPI CÉLOK</span><h2>Vezetői célkövetés</h2><p>A célértékek szalononként a böngészőben kerülnek mentésre.</p></div>
      <div className="dashboard-targets__toolbar">
        <button type="button" className="is-secondary" onClick={exportTargets}><Download/> Export</button>
        <button type="button" className="is-secondary" onClick={() => importRef.current?.click()}><Upload/> Import</button>
        {!editing ? <button type="button" onClick={() => { setDraft(targets); setEditing(true); }}><Pencil/> Célok szerkesztése</button> :
          <div className="dashboard-targets__actions"><button type="button" className="is-secondary" onClick={() => setEditing(false)}><X/> Mégse</button><button type="button" onClick={save}><Save/> Mentés</button></div>}
        <input ref={importRef} className="dashboard-targets__file" type="file" accept="application/json,.json" onChange={importTargets}/>
      </div>
    </header>

    <div className="dashboard-targets__summary"><div><strong>{achieved}/{rows.length}</strong><small>teljesített cél</small></div><div><strong>{number(averageProgress)}%</strong><small>átlagos teljesülés</small></div><button type="button" className="is-secondary" onClick={reset}><RotateCcw/> Alapértékek</button></div>
    {message && <div className="dashboard-targets__message" role="status">{message}</div>}

    {editing && <div className="dashboard-targets__editor">
      <label>Bevételi cél (Ft)<input type="number" min="0" value={draft.revenue} onChange={e => setDraft({ ...draft, revenue: Number(e.target.value) })}/></label>
      <label>Kapacitáscél (%)<input type="number" min="0" max="100" value={draft.capacity} onChange={e => setDraft({ ...draft, capacity: Number(e.target.value) })}/></label>
      <label>Új vendég cél<input type="number" min="0" value={draft.newClients} onChange={e => setDraft({ ...draft, newClients: Number(e.target.value) })}/></label>
      <label>Teljesítési cél (%)<input type="number" min="0" max="100" value={draft.completionRate} onChange={e => setDraft({ ...draft, completionRate: Number(e.target.value) })}/></label>
    </div>}

    <div className="dashboard-targets__grid">{rows.map(({ key, label, current, target, currentText, targetText, icon: Icon }) => {
      const progress = target > 0 ? clamp((current / target) * 100) : 0; const complete = target > 0 && current >= target;
      return <article key={key} className={complete ? "is-complete" : ""}><div className="dashboard-targets__title"><Icon/><span>{label}</span><b>{number(progress)}%</b></div><div className="dashboard-targets__values"><strong>{currentText}</strong><small>Cél: {targetText}</small></div><div className="dashboard-targets__track"><i style={{ width: `${progress}%` }}/></div><small className="dashboard-targets__status">{complete ? "Cél teljesítve" : "Folyamatban"}</small></article>;
    })}</div>
  </section>;
}
