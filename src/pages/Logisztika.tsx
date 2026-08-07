import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Logisztika.css";

type Location = { id: string; name?: string; title?: string };
type Product = { id: string; name: string; internal_code?: string | null; brand?: string | null };
type Balance = {
  id: string | number;
  product_id: string;
  product_name: string;
  internal_code?: string | null;
  brand?: string | null;
  location_id: string | null;
  quantity: number | string;
  min_quantity: number | string;
  unit_cost: number | string;
  stock_value: number | string;
  stock_status?: "ok" | "low" | "out";
  updated_at: string;
};
type Movement = {
  id: string | number;
  product_id: string;
  product_name: string;
  location_id: string | null;
  work_order_id?: string | number | null;
  movement_type: string;
  quantity: number | string;
  balance_after: number | string | null;
  unit_cost?: number | string | null;
  stock_value_after?: number | string | null;
  note?: string | null;
  created_at: string;
};

type MovementType = "opening" | "receipt" | "adjustment";

const movementLabels: Record<string, string> = {
  opening: "Nyitókészlet",
  receipt: "Bevételezés",
  adjustment: "Korrekció",
  work_order_consumption: "Munkalap felhasználás",
  work_order_reversal: "Munkalap visszaforgatás",
};

const toArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};
const huf = (value: unknown) => `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;

export default function Logisztika() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"stock" | "movements">("stock");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [settingsForm, setSettingsForm] = useState({ min_quantity: "", unit_cost: "" });
  const [form, setForm] = useState({
    product_id: "",
    movement_type: "receipt" as MovementType,
    quantity: "",
    unit_cost: "",
    min_quantity: "",
    note: "",
  });

  const locationQuery = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";

  async function loadReferenceData() {
    const [locRes, productRes] = await Promise.all([
      api.get("/api/locations"),
      api.get("/api/products?include_inactive=1"),
    ]);
    setLocations(toArray<Location>(locRes.data));
    setProducts(toArray<Product>(productRes.data));
  }

  async function loadInventory() {
    setLoading(true);
    setError("");
    try {
      const [balanceRes, movementRes] = await Promise.all([
        api.get(`/api/transactions/inventory${locationQuery}`),
        api.get(`/api/transactions/inventory/movements${locationId ? `?location_id=${encodeURIComponent(locationId)}&limit=200` : "?limit=200"}`),
      ]);
      setBalances(toArray<Balance>(balanceRes.data));
      setMovements(toArray<Movement>(movementRes.data));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "A készletadatok betöltése nem sikerült.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadReferenceData().catch((e: any) => setError(e?.response?.data?.message || "A törzsadatok betöltése nem sikerült.")); }, []);
  useEffect(() => { loadInventory(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [locationId]);

  const filteredBalances = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return balances;
    return balances.filter((x) => `${x.product_name} ${x.internal_code || ""} ${x.brand || ""}`.toLowerCase().includes(q));
  }, [balances, search]);

  const totalUnits = useMemo(() => balances.reduce((sum, row) => sum + Number(row.quantity || 0), 0), [balances]);
  const totalValue = useMemo(() => balances.reduce((sum, row) => sum + Number(row.stock_value || 0), 0), [balances]);
  const lowStockCount = useMemo(() => balances.filter((row) => Number(row.quantity || 0) > 0 && Number(row.quantity || 0) <= Number(row.min_quantity || 0)).length, [balances]);
  const outStockCount = useMemo(() => balances.filter((row) => Number(row.quantity || 0) <= 0).length, [balances]);

  async function saveMovement(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    const quantity = Number(form.quantity);
    const unitCost = form.unit_cost === "" ? null : Number(form.unit_cost);
    const minQuantity = form.min_quantity === "" ? null : Number(form.min_quantity);
    if (!form.product_id) return setError("Válassz terméket.");
    if (!Number.isFinite(quantity)) return setError("A mennyiség csak szám lehet.");
    if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) return setError("A beszerzési ár hibás.");
    if (minQuantity !== null && (!Number.isFinite(minQuantity) || minQuantity < 0)) return setError("A minimum készlet hibás.");

    setSaving(true);
    try {
      await api.post("/api/transactions/inventory/movements", {
        product_id: form.product_id,
        location_id: locationId || null,
        movement_type: form.movement_type,
        quantity,
        unit_cost: unitCost,
        min_quantity: minQuantity,
        note: form.note.trim() || null,
      });
      setSuccess(form.movement_type === "receipt" && unitCost !== null ? "A bevételezés elkészült, a súlyozott átlagos beszerzési ár frissült." : "A készletmozgás sikeresen rögzítve.");
      setForm((prev) => ({ ...prev, quantity: "", unit_cost: "", min_quantity: "", note: "" }));
      await loadInventory();
    } catch (e: any) { setError(e?.response?.data?.message || "A készletmozgás mentése nem sikerült."); }
    finally { setSaving(false); }
  }

  function startEdit(row: Balance) {
    setEditingId(row.id);
    setSettingsForm({ min_quantity: String(row.min_quantity ?? 0), unit_cost: String(row.unit_cost ?? 0) });
  }

  async function saveSettings(row: Balance) {
    const minQuantity = Number(settingsForm.min_quantity);
    const unitCost = Number(settingsForm.unit_cost);
    if (!Number.isFinite(minQuantity) || minQuantity < 0 || !Number.isFinite(unitCost) || unitCost < 0) return setError("A minimum készlet és a beszerzési ár nem lehet negatív.");
    setSaving(true); setError("");
    try {
      await api.patch(`/api/transactions/inventory/balances/${row.id}/settings`, { min_quantity: minQuantity, unit_cost: unitCost });
      setEditingId(null); setSuccess("A készletparaméterek frissültek."); await loadInventory();
    } catch (e: any) { setError(e?.response?.data?.message || "A készletparaméterek mentése nem sikerült."); }
    finally { setSaving(false); }
  }

  return <div className="inventory-page">
    <header className="inventory-header"><div><span className="inventory-eyebrow">LOGISZTIKA / RAKTÁR</span><h1>Készletkezelés</h1><p>Nyitókészlet, bevételezés, súlyozott beszerzési ár, minimum készlet és teljes mozgásnapló.</p></div><div className="inventory-location"><label>Telephely</label><select value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">Központi készlet</option>{locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name || loc.title || loc.id}</option>)}</select></div></header>

    {error && <div className="inventory-alert error">{error}</div>}{success && <div className="inventory-alert success">{success}</div>}

    <section className="inventory-kpis inventory-kpis--five"><div><strong>{balances.length}</strong><span>Készletezett termék</span></div><div><strong>{totalUnits.toLocaleString("hu-HU", { maximumFractionDigits: 3 })}</strong><span>Összes mennyiség</span></div><div><strong>{huf(totalValue)}</strong><span>Aktuális készletérték</span></div><div><strong>{lowStockCount}</strong><span>Minimum alatt</span></div><div><strong>{outStockCount}</strong><span>Kifogyott</span></div></section>

    <section className="inventory-grid"><div className="inventory-card movement-card"><div className="card-title"><div><h2>Készletmozgás rögzítése</h2><p>Bevételezésnél a rendszer súlyozott átlagos beszerzési árat számol.</p></div></div><form onSubmit={saveMovement} className="movement-form">
      <label>Termék<select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Válassz terméket…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Mozgás típusa<select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value as MovementType })}><option value="opening">Nyitókészlet beállítása</option><option value="receipt">Bevételezés</option><option value="adjustment">Készletkorrekció</option></select></label>
      <label>Mennyiség<input type="number" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder={form.movement_type === "adjustment" ? "pl. -2,5 vagy 3" : "pl. 10"}/></label>
      {(form.movement_type === "receipt" || form.movement_type === "opening") && <label>Beszerzési egységár (Ft)<input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} placeholder="pl. 2490"/></label>}
      <label>Minimum készletszint <small>Ha üres, a jelenlegi érték marad.</small><input type="number" min="0" step="0.001" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} placeholder="pl. 3"/></label>
      <label>Megjegyzés<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Beszállító, számla/bizonylatszám, leltár oka…" rows={3}/></label><button type="submit" disabled={saving}>{saving ? "Mentés…" : "Mozgás rögzítése"}</button>
    </form></div>

    <div className="inventory-card table-card"><div className="inventory-tabs"><button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>Készletlista</button><button className={tab === "movements" ? "active" : ""} onClick={() => setTab("movements")}>Mozgástörténet</button><button className="refresh" onClick={loadInventory}>Frissítés</button></div>
      {tab === "stock" ? <><input className="inventory-search" placeholder="Keresés névre, cikkszámra vagy márkára…" value={search} onChange={(e) => setSearch(e.target.value)}/><div className="table-wrap"><table><thead><tr><th>Termék</th><th>Készlet</th><th>Minimum</th><th>Beszerzési ár</th><th>Készletérték</th><th>Állapot</th><th>Beállítás</th></tr></thead><tbody>{filteredBalances.map((row) => {
        const qty=Number(row.quantity||0), min=Number(row.min_quantity||0), isEdit=editingId===row.id;
        return <tr key={row.id}><td><strong>{row.product_name}</strong>{row.internal_code&&<small className="inventory-subline">{row.internal_code}{row.brand?` · ${row.brand}`:""}</small>}</td><td>{qty.toLocaleString("hu-HU",{maximumFractionDigits:3})}</td><td>{isEdit?<input className="inventory-inline-input" type="number" min="0" step="0.001" value={settingsForm.min_quantity} onChange={e=>setSettingsForm({...settingsForm,min_quantity:e.target.value})}/>:min.toLocaleString("hu-HU",{maximumFractionDigits:3})}</td><td>{isEdit?<input className="inventory-inline-input" type="number" min="0" step="0.01" value={settingsForm.unit_cost} onChange={e=>setSettingsForm({...settingsForm,unit_cost:e.target.value})}/>:huf(row.unit_cost)}</td><td><strong>{huf(row.stock_value)}</strong></td><td><span className={`stock-badge ${qty<=0?"danger":qty<=min?"warning":"ok"}`}>{qty<=0?"Nincs készleten":qty<=min?"Minimum alatt":"Rendben"}</span></td><td>{isEdit?<div className="inventory-inline-actions"><button onClick={()=>saveSettings(row)} disabled={saving}>Mentés</button><button className="secondary" onClick={()=>setEditingId(null)}>Mégse</button></div>:<button className="inventory-edit" onClick={()=>startEdit(row)}>Szerkesztés</button>}</td></tr>;
      })}{!loading&&filteredBalances.length===0&&<tr><td colSpan={7} className="empty">Nincs megjeleníthető készlet.</td></tr>}</tbody></table></div></> : <div className="table-wrap"><table><thead><tr><th>Időpont</th><th>Termék</th><th>Típus</th><th>Változás</th><th>Egyenleg</th><th>Egységár</th><th>Készletérték</th><th>Megjegyzés</th></tr></thead><tbody>{movements.map((m)=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString("hu-HU")}</td><td><strong>{m.product_name}</strong></td><td>{movementLabels[m.movement_type]||m.movement_type}</td><td className={Number(m.quantity)<0?"qty-negative":"qty-positive"}>{Number(m.quantity)>0?"+":""}{Number(m.quantity).toLocaleString("hu-HU",{maximumFractionDigits:3})}</td><td>{m.balance_after==null?"–":Number(m.balance_after).toLocaleString("hu-HU",{maximumFractionDigits:3})}</td><td>{huf(m.unit_cost)}</td><td>{huf(m.stock_value_after)}</td><td>{m.note||(m.work_order_id?`Munkalap #${m.work_order_id}`:"–")}</td></tr>)}{!loading&&movements.length===0&&<tr><td colSpan={8} className="empty">Nincs készletmozgás.</td></tr>}</tbody></table></div>}
      {loading&&<div className="inventory-loading">Adatok betöltése…</div>}
    </div></section>
  </div>;
}
