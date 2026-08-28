import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import api from "../api/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "./ChecklistsPage.css";

type Frequency = "daily" | "weekly" | "monthly";
type State = "green" | "amber" | "red";

type Status = {
  frequency: Frequency;
  total: number;
  completed: number;
  missing: number;
  percent: number;
  warning: boolean;
  state: State;
};

type Item = {
  id: string;
  item_key?: string;
  frequency: Frequency;
  section?: string | null;
  title: string;
  description?: string | null;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  completed?: boolean;
  completed_at?: string | null;
};

type Position = { id: string; name: string; code?: string | null };
type Checklist = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  daily_warning_time?: string;
  weekly_warning_weekday?: number;
  monthly_warning_days?: number;
  is_active?: boolean;
  positions?: Position[];
  items: Item[];
  status?: Record<Frequency, Status>;
};

type MyResponse = {
  employee: { id: string; full_name: string; position_name?: string | null };
  checklists: Checklist[];
  summary: Record<Frequency, Status>;
};

type AdminStatus = {
  employee_id: string;
  full_name: string;
  position_name?: string | null;
  daily?: { total: number; completed: number; missing: number; percent: number } | null;
  weekly?: { total: number; completed: number; missing: number; percent: number } | null;
  monthly?: { total: number; completed: number; missing: number; percent: number } | null;
};

const labels: Record<Frequency, string> = { daily: "Napi", weekly: "Heti", monthly: "Havi" };
const weekdayLabels = ["", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

function roleList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map(v => v.toLowerCase());
  const text = String(raw ?? "");
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).map(v => v.toLowerCase());
  } catch {}
  return text.split(",").map(v => v.replace(/[[\]"]/g, "").trim().toLowerCase()).filter(Boolean);
}

function isAdminRole(raw: unknown) {
  return roleList(raw).some(r => ["admin", "administrator", "rendszergazda", "superadmin", "super_admin"].includes(r));
}

function errorMessage(error: any, fallback: string) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;
}

function statusMessage(status?: Status) {
  if (!status) return "Nincs kiosztott feladat.";
  if (status.state === "green") return "Minden kötelező feladat elkészült.";
  if (status.state === "red") {
    if (status.frequency === "daily") return `Nap végi figyelmeztetés: még ${status.missing} napi feladat hiányzik.`;
    if (status.frequency === "weekly") return `Heti figyelmeztetés: még ${status.missing} heti feladat hiányzik.`;
    return `Hónap végi figyelmeztetés: még ${status.missing} havi feladat hiányzik.`;
  }
  if (status.frequency === "daily") return `Folyamatban: még ${status.missing} napi feladat van hátra.`;
  if (status.frequency === "weekly") return `Folyamatban: szerdától figyelmeztet, ha marad hiányzó tétel.`;
  return `Folyamatban: a hónap vége előtti 7 napban figyelmeztet, ha marad hiányzó tétel.`;
}

function SummaryCard({ status }: { status?: Status }) {
  const s = status || { frequency: "daily" as Frequency, total: 0, completed: 0, missing: 0, percent: 100, warning: false, state: "green" as State };
  return <div className={`checklist-summary-card is-${s.state}`}>
    <div className="checklist-summary-head">
      <span>{s.state === "green" ? <CheckCircle2 size={21}/> : <AlertTriangle size={21}/>}</span>
      <b>{labels[s.frequency]}</b>
      <strong>{s.percent}%</strong>
    </div>
    <div className="checklist-progress"><span style={{ width: `${Math.max(0, Math.min(100, s.percent))}%` }}/></div>
    <div className="checklist-summary-numbers"><span>{s.completed}/{s.total} kész</span><span>{s.missing} hiányzik</span></div>
    <p>{statusMessage(s)}</p>
  </div>;
}

const blankItem = (): Omit<Item, "id"> => ({
  frequency: "daily",
  section: "",
  title: "",
  description: "",
  sort_order: 10,
  is_required: true,
  is_active: true,
});

export default function ChecklistsPage() {
  const { user } = useCurrentUser();
  const admin = isAdminRole(user?.role);
  const [tab, setTab] = useState<"tasks" | "admin">("tasks");
  const [myData, setMyData] = useState<MyResponse | null>(null);
  const [myMessage, setMyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [overview, setOverview] = useState<AdminStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<Partial<Checklist>>({});
  const [assignedPositionIds, setAssignedPositionIds] = useState<string[]>([]);
  const [itemDraft, setItemDraft] = useState<Omit<Item,"id"> & { id?: string }>(blankItem());
  const [adminBusy, setAdminBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => checklists.find(c => c.id === selectedId) || null, [checklists, selectedId]);

  async function loadMy() {
    setLoading(true);
    setMyMessage(null);
    try {
      const { data } = await api.get<MyResponse>("/checklists/my");
      setMyData(data);
    } catch (e: any) {
      setMyData(null);
      setMyMessage(errorMessage(e, "A kiosztott check listák nem tölthetők be."));
    } finally {
      setLoading(false);
    }
  }

  const loadAdmin = useCallback(async (keepSelection = true) => {
    if (!admin) return;
    const [c, p, s] = await Promise.all([
      api.get<Checklist[]>("/checklists/admin/checklists"),
      api.get<Position[]>("/checklists/admin/positions"),
      api.get<AdminStatus[]>("/checklists/admin/status"),
    ]);
    setChecklists(c.data || []);
    setPositions(p.data || []);
    setOverview(s.data || []);
    const nextId = keepSelection && selectedId && (c.data || []).some(x => x.id === selectedId)
      ? selectedId
      : (c.data?.[0]?.id || "");
    setSelectedId(nextId);
  }, [admin, selectedId]);

  useEffect(() => { void loadMy(); }, []);
  useEffect(() => { if (admin) loadAdmin(false).catch(e => setError(errorMessage(e,"Az admin adatok nem tölthetők be."))); }, [admin, loadAdmin]);
  useEffect(() => {
    if (!selected) return;
    setDraft({
      name:selected.name,
      description:selected.description || "",
      daily_warning_time:String(selected.daily_warning_time || "18:00").slice(0,5),
      weekly_warning_weekday:Number(selected.weekly_warning_weekday || 3),
      monthly_warning_days:Number(selected.monthly_warning_days || 7),
      is_active:selected.is_active !== false,
    });
    setAssignedPositionIds((selected.positions || []).map(p => String(p.id)));
    setItemDraft(blankItem());
  }, [selected]);

  async function toggleItem(item: Item) {
    setTogglingId(item.id);
    setError(null);
    try {
      await api.patch(`/checklists/my/items/${item.id}`, { completed: !item.completed });
      await loadMy();
      if (admin) await loadAdmin(true);
    } catch (e) {
      setError(errorMessage(e,"A feladat állapotát nem sikerült menteni."));
    } finally { setTogglingId(null); }
  }

  function taskGroups(frequency: Frequency) {
    const groups: Array<{ checklist: Checklist; section: string; items: Item[] }> = [];
    for (const checklist of myData?.checklists || []) {
      const sectionMap = new Map<string, Item[]>();
      checklist.items.filter(i => i.frequency === frequency && i.is_active !== false).forEach(i => {
        const section = i.section || labels[frequency];
        if (!sectionMap.has(section)) sectionMap.set(section, []);
        sectionMap.get(section)!.push(i);
      });
      for (const [section, items] of sectionMap) groups.push({ checklist, section, items });
    }
    return groups;
  }

  async function saveChecklist() {
    if (!selected) return;
    setAdminBusy(true); setError(null); setNotice(null);
    try {
      await api.patch(`/checklists/admin/checklists/${selected.id}`, draft);
      await api.put(`/checklists/admin/checklists/${selected.id}/positions`, { position_ids: assignedPositionIds });
      setNotice("A check lista és a munkakör-hozzárendelések mentve.");
      await loadAdmin(true);
      await loadMy();
    } catch (e) { setError(errorMessage(e,"A check lista mentése nem sikerült.")); }
    finally { setAdminBusy(false); }
  }

  async function createChecklist() {
    const name = window.prompt("Új check lista neve:", "Új check lista")?.trim();
    if (!name) return;
    setAdminBusy(true); setError(null); setNotice(null);
    try {
      const { data } = await api.post<Checklist>("/checklists/admin/checklists", { name });
      await loadAdmin(false);
      setSelectedId(String(data.id));
      setNotice("Az új check lista létrejött.");
    } catch (e) { setError(errorMessage(e,"A check lista létrehozása nem sikerült.")); }
    finally { setAdminBusy(false); }
  }

  async function saveItem() {
    if (!selected || !itemDraft.title.trim()) return;
    setAdminBusy(true); setError(null); setNotice(null);
    try {
      if (itemDraft.id) await api.patch(`/checklists/admin/items/${itemDraft.id}`, itemDraft);
      else await api.post(`/checklists/admin/checklists/${selected.id}/items`, itemDraft);
      setItemDraft(blankItem());
      setNotice("A feladat mentve.");
      await loadAdmin(true);
      await loadMy();
    } catch (e) { setError(errorMessage(e,"A feladat mentése nem sikerült.")); }
    finally { setAdminBusy(false); }
  }

  async function archiveItem(item: Item) {
    if (!window.confirm(`Biztosan inaktiválja ezt a feladatot?\n\n${item.title}`)) return;
    setAdminBusy(true); setError(null);
    try {
      await api.delete(`/checklists/admin/items/${item.id}`);
      setNotice("A feladat inaktiválva.");
      await loadAdmin(true);
      await loadMy();
    } catch (e) { setError(errorMessage(e,"A feladat inaktiválása nem sikerült.")); }
    finally { setAdminBusy(false); }
  }

  return <div className="checklists-page">
    <section className="checklists-hero">
      <div>
        <div className="checklists-eyebrow"><ClipboardCheck size={16}/> Tudásbázis</div>
        <h1>Check listák</h1>
        <p>A munkakörhöz rendelt napi, heti és havi feladatok teljesítése és követése.</p>
      </div>
      {admin && <div className="checklists-tabs">
        <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}><ClipboardCheck size={16}/> Saját feladatok</button>
        <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}><Settings2 size={16}/> Adminisztráció</button>
      </div>}
    </section>

    {error && <div className="checklists-alert error"><AlertTriangle size={18}/>{error}</div>}
    {notice && <div className="checklists-alert success"><CheckCircle2 size={18}/>{notice}</div>}

    {tab === "tasks" && <>
      {loading ? <div className="checklists-panel">Check listák betöltése…</div> : myData ? <>
        <div className="checklists-userline"><ShieldCheck size={17}/><b>{myData.employee.full_name}</b><span>{myData.employee.position_name || "Munkakör nincs megadva"}</span></div>
        <div className="checklist-summary-grid">
          <SummaryCard status={myData.summary.daily}/>
          <SummaryCard status={myData.summary.weekly}/>
          <SummaryCard status={myData.summary.monthly}/>
        </div>
        {(myData.checklists || []).length === 0 && <div className="checklists-empty"><ClipboardCheck size={28}/><h3>Nincs kiosztott check lista</h3><p>Az adminisztrátor munkakör alapján tud check listát hozzárendelni.</p></div>}
        {(["daily","weekly","monthly"] as Frequency[]).map(frequency => {
          const groups = taskGroups(frequency);
          if (!groups.length) return null;
          return <section className="checklists-panel checklist-frequency" key={frequency}>
            <div className="checklists-section-title"><div><CalendarClock size={19}/><h2>{labels[frequency]} feladatok</h2></div><span>{myData.summary[frequency]?.completed || 0}/{myData.summary[frequency]?.total || 0} kész</span></div>
            {groups.map((group, gi) => <div className="checklist-task-group" key={`${group.checklist.id}-${frequency}-${group.section}-${gi}`}>
              <div className="checklist-task-group-head"><div><small>{group.checklist.name}</small><b>{group.section}</b></div></div>
              <div className="checklist-task-list">
                {group.items.map(item => <label className={`checklist-task ${item.completed ? "is-done" : ""}`} key={item.id}>
                  <input type="checkbox" checked={Boolean(item.completed)} disabled={togglingId === item.id} onChange={() => void toggleItem(item)}/>
                  <span className="checklist-box">{item.completed && <CheckCircle2 size={18}/>}</span>
                  <span className="checklist-task-copy"><b>{item.title}</b>{item.description && <small>{item.description}</small>}</span>
                  {item.is_required && <em>Kötelező</em>}
                </label>)}
              </div>
            </div>)}
          </section>;
        })}
      </> : <div className="checklists-empty"><AlertTriangle size={28}/><h3>A saját check lista nem érhető el</h3><p>{myMessage}</p>{admin && <p>Adminisztrátorként az Adminisztráció fül ettől még használható.</p>}</div>}
    </>}

    {admin && tab === "admin" && <section className="checklists-admin">
      <div className="checklists-admin-sidebar checklists-panel">
        <div className="checklists-admin-sidehead"><div><Settings2 size={18}/><b>Check listák</b></div><button onClick={() => void createChecklist()} disabled={adminBusy}><Plus size={16}/> Új</button></div>
        <div className="checklists-admin-list">{checklists.map(c => <button key={c.id} className={selectedId === c.id ? "active" : ""} onClick={() => setSelectedId(c.id)}><span>{c.name}</span><small>{c.items?.filter(i=>i.is_active!==false).length || 0} feladat</small></button>)}</div>
      </div>

      <div className="checklists-admin-main">
        {!selected ? <div className="checklists-empty">Válasszon vagy hozzon létre check listát.</div> : <>
          <div className="checklists-panel">
            <div className="checklists-section-title"><div><Settings2 size={19}/><h2>Alapbeállítások</h2></div><button className="checklists-primary" onClick={() => void saveChecklist()} disabled={adminBusy}><Save size={16}/> Mentés</button></div>
            <div className="checklists-form-grid">
              <label><span>Név</span><input value={String(draft.name || "")} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
              <label><span>Napi figyelmeztetés</span><input type="time" value={String(draft.daily_warning_time || "18:00")} onChange={e=>setDraft(d=>({...d,daily_warning_time:e.target.value}))}/></label>
              <label><span>Heti figyelmeztetés kezdete</span><select value={Number(draft.weekly_warning_weekday || 3)} onChange={e=>setDraft(d=>({...d,weekly_warning_weekday:Number(e.target.value)}))}>{weekdayLabels.slice(1).map((x,i)=><option value={i+1} key={x}>{x}</option>)}</select></label>
              <label><span>Havi figyelmeztetés</span><div className="checklists-inline-input"><input type="number" min={1} max={31} value={Number(draft.monthly_warning_days || 7)} onChange={e=>setDraft(d=>({...d,monthly_warning_days:Number(e.target.value)}))}/><em>nappal hónap vége előtt</em></div></label>
              <label className="checklists-form-wide"><span>Leírás</span><textarea rows={3} value={String(draft.description || "")} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label>
              <label className="checklists-toggle"><input type="checkbox" checked={draft.is_active !== false} onChange={e=>setDraft(d=>({...d,is_active:e.target.checked}))}/><span>Aktív check lista</span></label>
            </div>
          </div>

          <div className="checklists-panel">
            <div className="checklists-section-title"><div><Users size={19}/><h2>Munkakörök hozzárendelése</h2></div><span>{assignedPositionIds.length} kiválasztva</span></div>
            <div className="checklists-position-grid">{positions.map(p => {
              const checked=assignedPositionIds.includes(String(p.id));
              return <label key={p.id} className={checked?"selected":""}><input type="checkbox" checked={checked} onChange={e=>setAssignedPositionIds(ids=>e.target.checked?[...ids,String(p.id)]:ids.filter(id=>id!==String(p.id)))}/><span><b>{p.name}</b>{p.code&&<small>{p.code}</small>}</span></label>;
            })}</div>
          </div>

          <div className="checklists-panel">
            <div className="checklists-section-title"><div><Plus size={19}/><h2>{itemDraft.id ? "Feladat szerkesztése" : "Új feladat"}</h2></div>{itemDraft.id && <button className="checklists-quiet" onClick={()=>setItemDraft(blankItem())}>Mégse</button>}</div>
            <div className="checklists-form-grid">
              <label><span>Gyakoriság</span><select value={itemDraft.frequency} onChange={e=>setItemDraft(d=>({...d,frequency:e.target.value as Frequency}))}><option value="daily">Napi</option><option value="weekly">Heti</option><option value="monthly">Havi</option></select></label>
              <label><span>Sorrend</span><input type="number" value={itemDraft.sort_order} onChange={e=>setItemDraft(d=>({...d,sort_order:Number(e.target.value)}))}/></label>
              <label className="checklists-form-wide"><span>Szakasz / csoport</span><input value={String(itemDraft.section || "")} onChange={e=>setItemDraft(d=>({...d,section:e.target.value}))}/></label>
              <label className="checklists-form-wide"><span>Feladat</span><input value={itemDraft.title} onChange={e=>setItemDraft(d=>({...d,title:e.target.value}))} placeholder="Mit kell elvégezni?"/></label>
              <label className="checklists-form-wide"><span>Megjegyzés / részletezés</span><textarea rows={2} value={String(itemDraft.description || "")} onChange={e=>setItemDraft(d=>({...d,description:e.target.value}))}/></label>
              <label className="checklists-toggle"><input type="checkbox" checked={itemDraft.is_required} onChange={e=>setItemDraft(d=>({...d,is_required:e.target.checked}))}/><span>Kötelező</span></label>
              <label className="checklists-toggle"><input type="checkbox" checked={itemDraft.is_active} onChange={e=>setItemDraft(d=>({...d,is_active:e.target.checked}))}/><span>Aktív</span></label>
            </div>
            <div className="checklists-form-actions"><button className="checklists-primary" disabled={adminBusy || !itemDraft.title.trim()} onClick={()=>void saveItem()}><Save size={16}/> {itemDraft.id ? "Módosítás mentése" : "Feladat hozzáadása"}</button></div>
          </div>

          <div className="checklists-panel">
            <div className="checklists-section-title"><div><ClipboardCheck size={19}/><h2>Feladatlista</h2></div><span>{selected.items?.filter(i=>i.is_active!==false).length || 0} aktív</span></div>
            <div className="checklists-admin-items">{(["daily","weekly","monthly"] as Frequency[]).map(f => <div key={f}>
              <h3>{labels[f]}</h3>
              {(selected.items || []).filter(i=>i.frequency===f).map(item => <div className={`checklists-admin-item ${item.is_active===false?"inactive":""}`} key={item.id}>
                <div><small>{item.section || "–"} · #{item.sort_order}</small><b>{item.title}</b></div>
                <span>{item.is_required ? "Kötelező" : "Opcionális"}</span>
                <button title="Szerkesztés" onClick={()=>setItemDraft({...item})}><Edit3 size={16}/></button>
                <button title="Inaktiválás" onClick={()=>void archiveItem(item)} disabled={item.is_active===false}><Trash2 size={16}/></button>
              </div>)}
            </div>)}</div>
          </div>
        </>}

        <div className="checklists-panel">
          <div className="checklists-section-title"><div><Users size={19}/><h2>Aktuális teljesítési áttekintés</h2></div></div>
          <div className="checklists-status-table-wrap"><table className="checklists-status-table"><thead><tr><th>Munkatárs</th><th>Munkakör</th><th>Napi</th><th>Heti</th><th>Havi</th></tr></thead><tbody>{overview.map(row=><tr key={row.employee_id}><td><b>{row.full_name}</b></td><td>{row.position_name || "–"}</td>{(["daily","weekly","monthly"] as Frequency[]).map(f=>{const st=row[f];return <td key={f}><span className={`checklists-mini-status ${(st?.percent??100)===100?"done":"open"}`}>{st?.percent ?? 100}%</span></td>})}</tr>)}</tbody></table></div>
        </div>
      </div>
    </section>}
  </div>;
}
