import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Logisztika.css";

type Location = { id: string; name?: string; title?: string };
type Product = { id: string; name: string; internal_code?: string | null; brand?: string | null };
type Balance = {
  id: string | number;
  product_id: string;
  product_name: string;
  location_id: string | null;
  quantity: number | string;
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
  const [form, setForm] = useState({
    product_id: "",
    movement_type: "receipt" as MovementType,
    quantity: "",
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferenceData().catch((e: any) =>
      setError(e?.response?.data?.message || "A törzsadatok betöltése nem sikerült.")
    );
  }, []);

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const filteredBalances = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return balances;
    return balances.filter((x) => x.product_name.toLowerCase().includes(q));
  }, [balances, search]);

  const totalUnits = useMemo(
    () => balances.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [balances]
  );

  const lowStockCount = useMemo(
    () => balances.filter((row) => Number(row.quantity || 0) <= 3).length,
    [balances]
  );

  async function saveMovement(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const quantity = Number(form.quantity);
    if (!form.product_id) return setError("Válassz terméket.");
    if (!Number.isFinite(quantity)) return setError("A mennyiség csak szám lehet.");

    setSaving(true);
    try {
      await api.post("/api/transactions/inventory/movements", {
        product_id: form.product_id,
        location_id: locationId || null,
        movement_type: form.movement_type,
        quantity,
        note: form.note.trim() || null,
      });
      setSuccess("A készletmozgás sikeresen rögzítve.");
      setForm((prev) => ({ ...prev, quantity: "", note: "" }));
      await loadInventory();
    } catch (e: any) {
      setError(e?.response?.data?.message || "A készletmozgás mentése nem sikerült.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <div>
          <span className="inventory-eyebrow">LOGISZTIKA / RAKTÁR</span>
          <h1>Készletkezelés</h1>
          <p>Nyitókészlet, bevételezés, korrekció és teljes készletmozgás-napló.</p>
        </div>
        <div className="inventory-location">
          <label>Telephely</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">Központi készlet</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name || loc.title || loc.id}</option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="inventory-alert error">{error}</div>}
      {success && <div className="inventory-alert success">{success}</div>}

      <section className="inventory-kpis">
        <div><strong>{balances.length}</strong><span>Készleten lévő termék</span></div>
        <div><strong>{totalUnits.toLocaleString("hu-HU", { maximumFractionDigits: 3 })}</strong><span>Összes készletmennyiség</span></div>
        <div><strong>{lowStockCount}</strong><span>Alacsony készlet (≤ 3)</span></div>
        <div><strong>{movements.length}</strong><span>Betöltött mozgás</span></div>
      </section>

      <section className="inventory-grid">
        <div className="inventory-card movement-card">
          <div className="card-title">
            <div><h2>Készletmozgás rögzítése</h2><p>Az egyenleg és a mozgásnapló egy tranzakcióban frissül.</p></div>
          </div>
          <form onSubmit={saveMovement} className="movement-form">
            <label>Termék
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Válassz terméket…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>Mozgás típusa
              <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value as MovementType })}>
                <option value="opening">Nyitókészlet beállítása</option>
                <option value="receipt">Bevételezés</option>
                <option value="adjustment">Készletkorrekció</option>
              </select>
            </label>
            <label>Mennyiség
              <input type="number" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder={form.movement_type === "adjustment" ? "pl. -2,5 vagy 3" : "pl. 10"} />
            </label>
            <label>Megjegyzés
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Beszállító, leltár oka, bizonylatszám…" rows={3} />
            </label>
            <button type="submit" disabled={saving}>{saving ? "Mentés…" : "Mozgás rögzítése"}</button>
          </form>
        </div>

        <div className="inventory-card table-card">
          <div className="inventory-tabs">
            <button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>Készletlista</button>
            <button className={tab === "movements" ? "active" : ""} onClick={() => setTab("movements")}>Mozgástörténet</button>
            <button className="refresh" onClick={loadInventory}>Frissítés</button>
          </div>

          {tab === "stock" ? (
            <>
              <input className="inventory-search" placeholder="Keresés terméknévre…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Termék</th><th>Készlet</th><th>Állapot</th><th>Frissítve</th></tr></thead>
                  <tbody>
                    {filteredBalances.map((row) => {
                      const qty = Number(row.quantity || 0);
                      return <tr key={row.id}>
                        <td><strong>{row.product_name}</strong></td>
                        <td>{qty.toLocaleString("hu-HU", { maximumFractionDigits: 3 })}</td>
                        <td><span className={`stock-badge ${qty <= 0 ? "danger" : qty <= 3 ? "warning" : "ok"}`}>{qty <= 0 ? "Nincs készleten" : qty <= 3 ? "Alacsony" : "Rendben"}</span></td>
                        <td>{new Date(row.updated_at).toLocaleString("hu-HU")}</td>
                      </tr>;
                    })}
                    {!loading && filteredBalances.length === 0 && <tr><td colSpan={4} className="empty">Nincs megjeleníthető készlet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Időpont</th><th>Termék</th><th>Típus</th><th>Változás</th><th>Egyenleg</th><th>Megjegyzés</th></tr></thead>
                <tbody>
                  {movements.map((m) => <tr key={m.id}>
                    <td>{new Date(m.created_at).toLocaleString("hu-HU")}</td>
                    <td><strong>{m.product_name}</strong></td>
                    <td>{movementLabels[m.movement_type] || m.movement_type}</td>
                    <td className={Number(m.quantity) < 0 ? "qty-negative" : "qty-positive"}>{Number(m.quantity) > 0 ? "+" : ""}{Number(m.quantity).toLocaleString("hu-HU", { maximumFractionDigits: 3 })}</td>
                    <td>{m.balance_after == null ? "–" : Number(m.balance_after).toLocaleString("hu-HU", { maximumFractionDigits: 3 })}</td>
                    <td>{m.note || (m.work_order_id ? `Munkalap #${m.work_order_id}` : "–")}</td>
                  </tr>)}
                  {!loading && movements.length === 0 && <tr><td colSpan={6} className="empty">Nincs készletmozgás.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {loading && <div className="inventory-loading">Adatok betöltése…</div>}
        </div>
      </section>
    </div>
  );
}
