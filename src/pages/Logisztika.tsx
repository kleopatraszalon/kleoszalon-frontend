import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import InventoryOperationsPage from "./InventoryOperationsPage";
import ProcurementPanel from "./inventory/ProcurementPanel";
import ProcurementWorkflowPanel from "./inventory/ProcurementWorkflowPanel";
import InventoryControlDashboard from "./inventory/InventoryControlDashboard";
import "./Logisztika.css";

type Location = { id: string; name?: string; title?: string };
type Product = {
  id: string;
  name: string;
  internal_code?: string | null;
  brand?: string | null;
  product_type_name?: string | null;
  product_group_id?: string | null;
  product_group_name?: string | null;
  product_category_id?: string | null;
  product_category_name?: string | null;
};
type Balance = {
  id: string | number;
  product_id: string;
  product_name: string;
  internal_code?: string | null;
  brand?: string | null;
  product_type_name?: string | null;
  product_group_id?: string | null;
  product_group_name?: string | null;
  product_category_id?: string | null;
  product_category_name?: string | null;
  location_id: string | null;
  quantity: number | string;
  min_quantity: number | string;
  unit_cost: number | string;
  stock_value: number | string;
  updated_at: string;
};
type Movement = {
  id: string | number;
  product_name: string;
  product_group_name?: string | null;
  product_category_name?: string | null;
  movement_type: string;
  quantity: number | string;
  balance_after: number | string | null;
  unit_cost?: number | string | null;
  stock_value_after?: number | string | null;
  work_order_id?: string | number | null;
  note?: string | null;
  created_at: string;
};
type MovementType = "opening" | "receipt" | "adjustment";

const labels: Record<string, string> = {
  opening: "Nyitókészlet",
  receipt: "Bevételezés",
  adjustment: "Korrekció",
  work_order_consumption: "Munkalap felhasználás",
  work_order_reversal: "Munkalap visszaforgatás",
  transfer_in: "Központi beérkezés",
  transfer_out: "Központi kiadás",
};
const arr = <T,>(v: any): T[] => Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.data) ? v.data : [];
const huf = (v: unknown) => `${Number(v || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;
const q = (v: unknown) => Number(v || 0).toLocaleString("hu-HU", { maximumFractionDigits: 3 });
const roleList = (raw: any) => {
  if (Array.isArray(raw)) return raw.map(String).map((x) => x.toLowerCase());
  try {
    const p = JSON.parse(String(raw || ""));
    if (Array.isArray(p)) return p.map(String).map((x) => x.toLowerCase());
  } catch {}
  return String(raw || "").split(",").map((x) => x.replace(/[\[\]"]/g, "").trim().toLowerCase()).filter(Boolean);
};
const ADMIN = ["admin", "administrator", "rendszergazda", "superadmin", "super_admin"];
const taxonomyLabel = (x: { product_type_name?: string | null; product_group_name?: string | null; product_category_name?: string | null }) =>
  [x.product_type_name, x.product_group_name, x.product_category_name].filter(Boolean).join(" › ") || "Nincs besorolva";

export default function Logisztika() {
  const route = useLocation();
  const { user, loading: userLoading } = useCurrentUser();
  const routeParams = useMemo(() => new URLSearchParams(route.search), [route.search]);
  const procurementRequested = routeParams.get("view") === "procurement";
  const procurementSection = routeParams.get("section") || "dashboard";
  const roles = useMemo(() => roleList(user?.role), [user?.role]);
  const isAdmin = roles.some((r) => ADMIN.includes(r));
  const ownLocation = user?.location_id ? String(user.location_id) : "";

  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [locationId, setLocationId] = useState("");
  const [tab, setTab] = useState<"stock" | "movements" | "procurement">(procurementRequested ? "procurement" : "stock");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [settingsForm, setSettingsForm] = useState({ min_quantity: "", unit_cost: "" });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", movement_type: "receipt" as MovementType, quantity: "", unit_cost: "", min_quantity: "", note: "" });

  const locationQuery = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";
  const visibleLocations = useMemo(() => isAdmin ? locations : locations.filter((l) => String(l.id) === ownLocation), [isAdmin, locations, ownLocation]);
  const selectedLocationName = locations.find((l) => String(l.id) === locationId)?.name || locations.find((l) => String(l.id) === locationId)?.title || user?.location_name || "";

  async function loadRefs() {
    const [l, p] = await Promise.all([api.get("/api/locations"), api.get("/api/products?include_inactive=1")]);
    setLocations(arr<Location>(l.data));
    setProducts(arr<Product>(p.data));
  }
  async function loadInventory() {
    setLoading(true);
    setError("");
    try {
      const [b, m] = await Promise.all([
        api.get(`/api/transactions/inventory${locationQuery}`),
        api.get(`/api/transactions/inventory/movements${locationId ? `?location_id=${encodeURIComponent(locationId)}&limit=200` : "?limit=200"}`),
      ]);
      setBalances(arr<Balance>(b.data));
      setMovements(arr<Movement>(m.data));
      setInventoryRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "A készletadatok betöltése nem sikerült.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRefs().catch(() => setError("A törzsadatok betöltése nem sikerült.")); }, []);
  useEffect(() => { if (!userLoading && !isAdmin && ownLocation && locationId !== ownLocation) setLocationId(ownLocation); }, [userLoading, isAdmin, ownLocation, locationId]);
  useEffect(() => { if (!userLoading && (isAdmin || Boolean(ownLocation))) void loadInventory(); }, [locationId, userLoading, isAdmin, ownLocation]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (procurementRequested) setTab("procurement"); }, [procurementRequested, procurementSection]);

  const groupOptions = useMemo(() => {
    const map = new Map<string, string>();
    balances.forEach((x) => { if (x.product_group_id && x.product_group_name) map.set(String(x.product_group_id), x.product_group_name); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "hu"));
  }, [balances]);
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    balances.forEach((x) => {
      if (groupFilter && String(x.product_group_id || "") !== groupFilter) return;
      if (x.product_category_id && x.product_category_name) map.set(String(x.product_category_id), x.product_category_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "hu"));
  }, [balances, groupFilter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return balances.filter((x) => {
      const haystack = `${x.product_name} ${x.internal_code || ""} ${x.brand || ""} ${x.product_type_name || ""} ${x.product_group_name || ""} ${x.product_category_name || ""}`.toLowerCase();
      if (s && !haystack.includes(s)) return false;
      if (groupFilter && String(x.product_group_id || "") !== groupFilter) return false;
      if (categoryFilter && String(x.product_category_id || "") !== categoryFilter) return false;
      return true;
    });
  }, [balances, search, groupFilter, categoryFilter]);

  const productOptionGroups = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    products.slice().sort((a, b) => taxonomyLabel(a).localeCompare(taxonomyLabel(b), "hu") || a.name.localeCompare(b.name, "hu")).forEach((p) => {
      const key = taxonomyLabel(p);
      grouped.set(key, [...(grouped.get(key) || []), p]);
    });
    return Array.from(grouped.entries());
  }, [products]);

  const totalUnits = balances.reduce((a, x) => a + Number(x.quantity || 0), 0);
  const totalValue = balances.reduce((a, x) => a + Number(x.stock_value || 0), 0);
  const low = balances.filter((x) => Number(x.quantity) > 0 && Number(x.quantity) <= Number(x.min_quantity)).length;
  const out = balances.filter((x) => Number(x.quantity) <= 0).length;

  async function saveMovement(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const quantity = Number(form.quantity);
    const unitCost = form.unit_cost === "" ? null : Number(form.unit_cost);
    const minQuantity = form.min_quantity === "" ? null : Number(form.min_quantity);
    if (!form.product_id) return setError("Válassz terméket.");
    if (!Number.isFinite(quantity)) return setError("A mennyiség csak szám lehet.");
    if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) return setError("A beszerzési ár hibás.");
    if (minQuantity !== null && (!Number.isFinite(minQuantity) || minQuantity < 0)) return setError("A minimum készlet hibás.");
    setSaving(true);
    try {
      await api.post("/api/transactions/inventory/movements", { product_id: form.product_id, location_id: locationId || null, movement_type: form.movement_type, quantity, unit_cost: unitCost, min_quantity: minQuantity, note: form.note.trim() || null });
      setSuccess("A készletmozgás sikeresen rögzítve.");
      setForm((x) => ({ ...x, quantity: "", unit_cost: "", min_quantity: "", note: "" }));
      await loadInventory();
    } catch (e: any) {
      setError(e?.response?.data?.message || "A mentés nem sikerült.");
    } finally {
      setSaving(false);
    }
  }
  function startEdit(r: Balance) {
    setEditingId(r.id);
    setSettingsForm({ min_quantity: String(r.min_quantity ?? 0), unit_cost: String(r.unit_cost ?? 0) });
  }
  async function saveSettings(r: Balance) {
    const min = Number(settingsForm.min_quantity), cost = Number(settingsForm.unit_cost);
    if (!Number.isFinite(min) || min < 0 || !Number.isFinite(cost) || cost < 0) return setError("A készletparaméterek hibásak.");
    setSaving(true);
    try {
      await api.patch(`/api/transactions/inventory/balances/${r.id}/settings`, { min_quantity: min, unit_cost: cost });
      setEditingId(null);
      setSuccess("A készletparaméterek frissültek.");
      await loadInventory();
    } catch (e: any) {
      setError(e?.response?.data?.message || "A mentés nem sikerült.");
    } finally {
      setSaving(false);
    }
  }

  const sectionLabel: Record<string, string> = { dashboard: "Beszerzési dashboard", suggestions: "Rendelési javaslatok", approvals: "Jóváhagyásra vár", orders: "Beszerzési rendelések", suppliers: "Beszállítók", prices: "Beszállítói árak", performance: "Beszállítói teljesítmény", deviations: "Eltérések" };

  if (!procurementRequested) return <InventoryOperationsPage />;

  return <div className="inventory-page">
    <header className="inventory-header">
      <div><span className="inventory-eyebrow">LOGISZTIKA / RAKTÁR</span><h1>{tab === "procurement" ? sectionLabel[procurementSection] || "Beszerzés" : "Készlet és beszerzés"}</h1><p>{tab === "procurement" ? "Beszerzési javaslatok, beszállítók, jóváhagyások, rendelések és teljesítmény külön, áttekinthető nézetekben." : "Készletezés, csoportosított terméktörzs, munkalap-anyagfogyás, utánrendelés és bevételezés egy folyamatban."}</p></div>
      <div className="inventory-location"><label>Telephely</label><select value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!isAdmin || userLoading}>{isAdmin && <option value="">Központi készlet</option>}{visibleLocations.map((l) => <option key={l.id} value={l.id}>{l.name || l.title || l.id}</option>)}</select></div>
    </header>
    {!isAdmin && !userLoading && <div className="inventory-alert success">Saját telephely nézet: <b>{selectedLocationName || "a bejelentkezett felhasználó szalonja"}</b>. Más szalon készlete ebből a nézetből nem választható.</div>}
    {error && <div className="inventory-alert error">{error}</div>}{success && <div className="inventory-alert success">{success}</div>}
    {(isAdmin || Boolean(ownLocation)) && <InventoryControlDashboard locationId={locationId} refreshKey={inventoryRefreshKey} />}
    <section className="inventory-kpis inventory-kpis--five"><div><strong>{balances.length}</strong><span>Készletezett termék</span></div><div><strong>{q(totalUnits)}</strong><span>Összes mennyiség</span></div><div><strong>{huf(totalValue)}</strong><span>Készletérték</span></div><div><strong>{low}</strong><span>Minimum alatt</span></div><div><strong>{out}</strong><span>Kifogyott</span></div></section>
    <div className="inventory-main-tabs"><button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>Készlet</button><button className={tab === "movements" ? "active" : ""} onClick={() => setTab("movements")}>Mozgástörténet</button><button className={tab === "procurement" ? "active" : ""} onClick={() => setTab("procurement")}>Beszerzés</button></div>
    {tab === "procurement" ? <><ProcurementWorkflowPanel locationId={locationId} section={procurementSection} onChanged={loadInventory} /><ProcurementPanel locationId={locationId} section={procurementSection} onInventoryChanged={loadInventory} /></> : <section className="inventory-grid">
      <div className="inventory-card movement-card">
        <div className="card-title"><h2>Készletmozgás rögzítése</h2><p>A termékek típus, csoport és kategória szerint vannak rendezve. Bevételezésnél súlyozott átlagos beszerzési ár számolódik.</p></div>
        <form onSubmit={saveMovement} className="movement-form">
          <label>Termék<select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Válassz terméket…</option>{productOptionGroups.map(([label, items]) => <optgroup key={label} label={label}>{items.map((p) => <option key={p.id} value={p.id}>{p.name}{p.internal_code ? ` · ${p.internal_code}` : ""}</option>)}</optgroup>)}</select></label>
          <label>Mozgás típusa<select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value as MovementType })}><option value="opening">Nyitókészlet</option><option value="receipt">Bevételezés</option><option value="adjustment">Korrekció</option></select></label>
          <label>Mennyiség<input type="number" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
          {form.movement_type !== "adjustment" && <label>Beszerzési egységár (Ft)<input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></label>}
          <label>Minimum készletszint<input type="number" min="0" step="0.001" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} /></label>
          <label>Megjegyzés<textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <button disabled={saving}>{saving ? "Mentés…" : "Mozgás rögzítése"}</button>
        </form>
      </div>
      <div className="inventory-card table-card">
        {tab === "stock" ? <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,2fr) minmax(180px,1fr) minmax(180px,1fr)", gap: 10, marginBottom: 12 }}>
            <input className="inventory-search" placeholder="Keresés név / kód / márka / kategória…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="inventory-search" value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCategoryFilter(""); }}><option value="">Összes termékcsoport</option>{groupOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            <select className="inventory-search" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Összes kategória</option>{categoryOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          </div>
          <div className="table-wrap"><table><thead><tr><th>Termék</th><th>Csoport / kategória</th><th>Készlet</th><th>Minimum</th><th>Beszerzési ár</th><th>Készletérték</th><th>Állapot</th><th></th></tr></thead><tbody>
            {loading && <tr><td colSpan={8}>Készlet betöltése…</td></tr>}
            {!loading && filtered.map((r) => { const isEdit = editingId === r.id, qty = Number(r.quantity), min = Number(r.min_quantity); return <tr key={r.id}><td><b>{r.product_name}</b><small className="inventory-subline">{[r.brand, r.internal_code].filter(Boolean).join(" · ")}</small></td><td><b>{r.product_group_name || "Nincs csoport"}</b><small className="inventory-subline">{r.product_category_name || "Nincs kategória"}</small></td><td>{q(qty)}</td><td>{isEdit ? <input className="inventory-inline-input" type="number" value={settingsForm.min_quantity} onChange={(e) => setSettingsForm({ ...settingsForm, min_quantity: e.target.value })} /> : q(min)}</td><td>{isEdit ? <input className="inventory-inline-input" type="number" value={settingsForm.unit_cost} onChange={(e) => setSettingsForm({ ...settingsForm, unit_cost: e.target.value })} /> : huf(r.unit_cost)}</td><td><b>{huf(r.stock_value)}</b></td><td><span className={`stock-badge ${qty <= 0 ? "danger" : qty <= min ? "warning" : "ok"}`}>{qty <= 0 ? "Kifogyott" : qty <= min ? "Minimum alatt" : "Rendben"}</span></td><td>{isEdit ? <div className="inventory-inline-actions"><button onClick={() => saveSettings(r)}>Mentés</button><button className="secondary" onClick={() => setEditingId(null)}>Mégse</button></div> : <button className="inventory-edit" onClick={() => startEdit(r)}>Szerkesztés</button>}</td></tr>; })}
            {!loading && filtered.length === 0 && <tr><td colSpan={8}>Nincs találat a kiválasztott csoportban vagy kategóriában.</td></tr>}
          </tbody></table></div>
        </> : <div className="table-wrap"><table><thead><tr><th>Időpont</th><th>Termék</th><th>Típus</th><th>Változás</th><th>Egyenleg</th><th>Egységár</th><th>Készletérték</th><th>Megjegyzés</th></tr></thead><tbody>{movements.map((m) => <tr key={m.id}><td>{new Date(m.created_at).toLocaleString("hu-HU")}</td><td><b>{m.product_name}</b><small className="inventory-subline">{[m.product_group_name, m.product_category_name].filter(Boolean).join(" › ")}</small></td><td>{labels[m.movement_type] || m.movement_type}</td><td className={Number(m.quantity) < 0 ? "qty-negative" : "qty-positive"}>{Number(m.quantity) > 0 ? "+" : ""}{q(m.quantity)}</td><td>{q(m.balance_after)}</td><td>{huf(m.unit_cost)}</td><td>{huf(m.stock_value_after)}</td><td>{m.note || (m.work_order_id ? `Munkalap #${m.work_order_id}` : "—")}</td></tr>)}</tbody></table></div>}
      </div>
    </section>}
  </div>;
}
