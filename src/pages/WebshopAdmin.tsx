import React, { useEffect, useMemo, useState } from "react";
import "./WebshopAdmin.css";

const rawBase =
  (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || "").replace(/\/$/, "") ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api");

const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
const API_ROOT = API_BASE.replace(/\/api$/, "");
const STOREFRONT_URL = "https://weblap-o3g6.onrender.com/webshop";

const getToken = () => localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";

const buildImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_ROOT}/${imageUrl.replace(/^\/+/, "")}`;
};

async function adminFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}/admin/webshop/${path.replace(/^\/+/, "")}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text().catch(() => "");
  let data: any = undefined;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    throw new Error(data?.error || data?.message || (typeof data === "string" && data) || `Admin API hiba: ${response.status}`);
  }
  return data as T;
}

type Product = {
  id: string;
  name: string;
  retail_price_gross: number | null;
  sale_price: number | null;
  web_is_visible: boolean;
  is_retail: boolean;
  web_sort_order: number | null;
  web_description: string | null;
  image_url: string | null;
  main_category?: string | null;
  sub_category?: string | null;
  service_category?: string | null;
};

type NewProductForm = {
  name: string;
  retail_price_gross: string;
  sale_price: string;
  web_is_visible: boolean;
  is_retail: boolean;
  web_sort_order: string;
  web_description: string;
};

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_total: number | null;
  max_discount_value: number | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};

type CouponForm = {
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order_total: string;
  max_discount_value: string;
  valid_from: string;
  valid_until: string;
  usage_limit: string;
  is_active: boolean;
};

type WebshopOrder = {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_gross: number;
};

type TabKey = "overview" | "products" | "coupons" | "orders";
type ProductFilter = "all" | "visible" | "hidden" | "sale";
type OrderFilter = "all" | "new" | "processing" | "completed" | "cancelled";

const emptyProduct: NewProductForm = {
  name: "",
  retail_price_gross: "",
  sale_price: "",
  web_is_visible: true,
  is_retail: true,
  web_sort_order: "",
  web_description: "",
};

const emptyCoupon: CouponForm = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  min_order_total: "",
  max_discount_value: "",
  valid_from: "",
  valid_until: "",
  usage_limit: "",
  is_active: true,
};

const money = (value: number | null | undefined) => `${Math.round(Number(value || 0)).toLocaleString("hu-HU")} Ft`;
const numberFromInput = (value: string) => value.trim() ? Number(value.replace(",", ".")) : null;
const dateLabel = (value: string | null) => value ? new Date(value).toLocaleDateString("hu-HU") : "Nincs korlátozva";

const couponState = (coupon: Coupon) => {
  if (!coupon.is_active) return { label: "Kikapcsolva", tone: "muted" };
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return { label: "Ütemezett", tone: "info" };
  if (coupon.valid_until) {
    const end = new Date(coupon.valid_until);
    end.setHours(23, 59, 59, 999);
    if (end < now) return { label: "Lejárt", tone: "danger" };
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) return { label: "Limit elérve", tone: "warning" };
  return { label: "Aktív", tone: "success" };
};

const orderStatusLabel: Record<string, string> = {
  new: "Új",
  processing: "Feldolgozás",
  completed: "Teljesítve",
  cancelled: "Lemondva",
};

const WebshopAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<WebshopOrder[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [couponsError, setCouponsError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>(emptyProduct);
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [createProductLoading, setCreateProductLoading] = useState(false);

  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCoupon);
  const [couponSearch, setCouponSearch] = useState("");
  const [couponSaving, setCouponSaving] = useState(false);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const data = await adminFetch<Product[]>("products");
      setProducts((data || []).map((product) => ({ ...product, image_url: buildImageUrl(product.image_url) || null })));
    } catch (error: any) {
      setProductsError(error?.message || "Nem sikerült betölteni a termékeket.");
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    setCouponsError("");
    try {
      setCoupons((await adminFetch<Coupon[]>("coupons")) || []);
    } catch (error: any) {
      setCouponsError(error?.message || "Nem sikerült betölteni a kuponokat.");
    } finally {
      setCouponsLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      setOrders((await adminFetch<WebshopOrder[]>("orders")) || []);
    } catch (error: any) {
      setOrdersError(error?.message || "Nem sikerült betölteni a rendeléseket.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled([loadProducts(), loadCoupons(), loadOrders()]);
    setRefreshing(false);
  };

  useEffect(() => { void refreshAll(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const activeCoupons = coupons.filter((coupon) => couponState(coupon).label === "Aktív").length;
    const openOrders = orders.filter((order) => ["new", "processing"].includes(order.status)).length;
    const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today).length;
    const orderValue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total_gross || 0), 0);
    const paidValue = orders.filter((order) => order.status !== "cancelled" && order.payment_status === "paid").reduce((sum, order) => sum + Number(order.total_gross || 0), 0);
    return {
      products: products.length,
      visible: products.filter((product) => product.web_is_visible).length,
      sale: products.filter((product) => Number(product.sale_price || 0) > 0 && Number(product.sale_price || 0) < Number(product.retail_price_gross || 0)).length,
      activeCoupons,
      openOrders,
      todayOrders,
      orderValue,
      paidValue,
    };
  }, [products, coupons, orders]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const isSale = Number(product.sale_price || 0) > 0 && Number(product.sale_price || 0) < Number(product.retail_price_gross || 0);
      if (productFilter === "visible" && !product.web_is_visible) return false;
      if (productFilter === "hidden" && product.web_is_visible) return false;
      if (productFilter === "sale" && !isSale) return false;
      return !query || `${product.name} ${product.web_description || ""}`.toLowerCase().includes(query);
    });
  }, [products, productSearch, productFilter]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch.trim().toLowerCase();
    return coupons.filter((coupon) => !query || `${coupon.code} ${coupon.description || ""}`.toLowerCase().includes(query));
  }, [coupons, couponSearch]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderFilter !== "all" && order.status !== orderFilter) return false;
      if (paymentFilter !== "all" && order.payment_status !== paymentFilter) return false;
      const haystack = `${order.customer_name} ${order.customer_email} ${order.customer_phone || ""} ${order.id}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [orders, orderSearch, orderFilter, paymentFilter]);

  const updateProductField = <K extends keyof Product>(id: string, field: K, value: Product[K]) => {
    setProducts((previous) => previous.map((product) => product.id === id ? { ...product, [field]: value } : product));
  };

  const saveProduct = async (product: Product) => {
    setSavingProductId(product.id);
    try {
      await adminFetch(`products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: product.name,
          retail_price_gross: product.retail_price_gross,
          sale_price: product.sale_price,
          web_is_visible: product.web_is_visible,
          is_retail: product.is_retail,
          web_sort_order: product.web_sort_order,
          web_description: product.web_description,
          main_category: product.main_category || null,
          sub_category: product.sub_category || null,
          service_category: product.service_category || null,
        }),
      });
      setNotice({ type: "success", text: `Mentve: ${product.name}` });
      await loadProducts();
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "A termék mentése sikertelen." });
    } finally {
      setSavingProductId(null);
    }
  };

  const uploadImage = async (productId: string, file: File | null) => {
    if (!file) return;
    setUploadingProductId(productId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await adminFetch<{ image_url?: string | null }>(`products/${productId}/image`, { method: "POST", body: formData });
      const imageUrl = buildImageUrl(data?.image_url) || null;
      setProducts((previous) => previous.map((product) => product.id === productId ? { ...product, image_url: imageUrl } : product));
      setNotice({ type: "success", text: "Termékkép frissítve." });
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "A képfeltöltés sikertelen." });
    } finally {
      setUploadingProductId(null);
    }
  };

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProduct.name.trim()) return setNotice({ type: "error", text: "A terméknév kötelező." });
    setCreateProductLoading(true);
    try {
      const created = await adminFetch<Product>("products", {
        method: "POST",
        body: JSON.stringify({
          name: newProduct.name.trim(),
          retail_price_gross: numberFromInput(newProduct.retail_price_gross),
          sale_price: numberFromInput(newProduct.sale_price),
          web_is_visible: newProduct.web_is_visible,
          is_retail: newProduct.is_retail,
          web_sort_order: newProduct.web_sort_order.trim() ? Number.parseInt(newProduct.web_sort_order, 10) : null,
          web_description: newProduct.web_description.trim() || null,
        }),
      });
      if (newProductImage && created?.id) await uploadImage(created.id, newProductImage);
      setNewProduct(emptyProduct);
      setNewProductImage(null);
      setNotice({ type: "success", text: "Az új termék elkészült." });
      await loadProducts();
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "Nem sikerült létrehozni a terméket." });
    } finally {
      setCreateProductLoading(false);
    }
  };

  const createCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return setNotice({ type: "error", text: "A kuponkód kötelező." });
    const discountValue = numberFromInput(couponForm.discount_value);
    if (discountValue == null || discountValue <= 0) return setNotice({ type: "error", text: "Adj meg 0-nál nagyobb kedvezményértéket." });
    if (couponForm.discount_type === "percent" && discountValue > 100) return setNotice({ type: "error", text: "A százalékos kedvezmény nem lehet 100%-nál nagyobb." });

    setCouponSaving(true);
    try {
      await adminFetch<Coupon>("coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          description: couponForm.description.trim() || null,
          discount_type: couponForm.discount_type,
          discount_value: discountValue,
          min_order_total: numberFromInput(couponForm.min_order_total),
          max_discount_value: numberFromInput(couponForm.max_discount_value),
          valid_from: couponForm.valid_from || null,
          valid_until: couponForm.valid_until || null,
          usage_limit: couponForm.usage_limit.trim() ? Number.parseInt(couponForm.usage_limit, 10) : null,
          is_active: couponForm.is_active,
        }),
      });
      setCouponForm(emptyCoupon);
      setNotice({ type: "success", text: `Kupon létrehozva: ${code}` });
      await loadCoupons();
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "A kupon mentése sikertelen." });
    } finally {
      setCouponSaving(false);
    }
  };

  const updateOrder = async (id: string, patch: Partial<Pick<WebshopOrder, "status" | "payment_status">>) => {
    setSavingOrderId(id);
    try {
      const updated = await adminFetch<WebshopOrder>(`orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setOrders((previous) => previous.map((order) => order.id === id ? updated : order));
      setNotice({ type: "success", text: "Rendelés frissítve." });
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "A rendelés frissítése sikertelen." });
    } finally {
      setSavingOrderId(null);
    }
  };

  const renderOverview = () => (
    <div className="ws-admin__overview-grid">
      <section className="ws-admin__panel ws-admin__overview-wide">
        <div className="ws-admin__panel-head">
          <div><span>ÉRTÉKESÍTÉSI PULZUS</span><h2>Webshop állapot</h2></div>
          <button type="button" onClick={() => setActiveTab("orders")}>Rendelések megnyitása →</button>
        </div>
        <div className="ws-admin__pulse-grid">
          <div><small>Mai rendelések</small><strong>{stats.todayOrders}</strong><span>db</span></div>
          <div><small>Nyitott rendelések</small><strong>{stats.openOrders}</strong><span>db</span></div>
          <div><small>Rendelési érték</small><strong>{money(stats.orderValue)}</strong><span>lemondott nélkül</span></div>
          <div><small>Fizetett érték</small><strong>{money(stats.paidValue)}</strong><span>rögzített fizetések</span></div>
        </div>
      </section>

      <section className="ws-admin__panel">
        <div className="ws-admin__panel-head"><div><span>KÍNÁLAT</span><h2>Termékállapot</h2></div></div>
        <div className="ws-admin__mini-metrics">
          <div><b>{stats.visible}</b><span>Látható termék</span></div>
          <div><b>{products.length - stats.visible}</b><span>Rejtett termék</span></div>
          <div><b>{stats.sale}</b><span>Akciós termék</span></div>
        </div>
        <button className="ws-admin__panel-cta" type="button" onClick={() => setActiveTab("products")}>Termékkezelés →</button>
      </section>

      <section className="ws-admin__panel">
        <div className="ws-admin__panel-head"><div><span>PROMÓCIÓ</span><h2>Kuponok</h2></div></div>
        <div className="ws-admin__coupon-overview">
          <strong>{stats.activeCoupons}</strong><span>aktív kupon jelenleg</span>
          <p>{coupons.filter((coupon) => couponState(coupon).label === "Ütemezett").length} ütemezett · {coupons.filter((coupon) => couponState(coupon).label === "Lejárt").length} lejárt</p>
        </div>
        <button className="ws-admin__panel-cta" type="button" onClick={() => setActiveTab("coupons")}>Kuponkezelés →</button>
      </section>

      <section className="ws-admin__panel ws-admin__overview-wide">
        <div className="ws-admin__panel-head"><div><span>LEGUTÓBBI AKTIVITÁS</span><h2>Friss rendelések</h2></div></div>
        {ordersLoading ? <div className="ws-admin__loading">Betöltés…</div> : orders.slice(0, 6).length === 0 ? <div className="ws-admin__empty">Még nincs rendelés.</div> : (
          <div className="ws-admin__recent-orders">
            {orders.slice(0, 6).map((order) => (
              <button type="button" key={order.id} onClick={() => { setOrderSearch(order.id); setActiveTab("orders"); }}>
                <div><strong>{order.customer_name}</strong><small>{new Date(order.created_at).toLocaleString("hu-HU")}</small></div>
                <span className={`ws-admin__status ws-admin__status--${order.status}`}>{orderStatusLabel[order.status] || order.status}</span>
                <b>{money(order.total_gross)}</b>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderProducts = () => (
    <div className="ws-admin__stack">
      <section className="ws-admin__panel">
        <div className="ws-admin__panel-head ws-admin__panel-head--wrap">
          <div><span>TERMÉKTÖRZS</span><h2>{filteredProducts.length} webshop termék</h2></div>
          <div className="ws-admin__filter-chips">
            {(["all", "visible", "hidden", "sale"] as ProductFilter[]).map((value) => (
              <button key={value} type="button" className={productFilter === value ? "is-active" : ""} onClick={() => setProductFilter(value)}>
                {value === "all" ? "Összes" : value === "visible" ? "Látható" : value === "hidden" ? "Rejtett" : "Akciós"}
              </button>
            ))}
          </div>
        </div>
        <div className="ws-admin__searchbar"><span>⌕</span><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Keresés név vagy leírás alapján…" /></div>

        {productsLoading ? <div className="ws-admin__loading">Termékek betöltése…</div> : productsError ? <div className="ws-admin__error">{productsError}</div> : filteredProducts.length === 0 ? <div className="ws-admin__empty">Nincs a szűrésnek megfelelő termék.</div> : (
          <div className="ws-admin__product-table-wrap">
            <table className="ws-admin__table ws-admin__product-table">
              <thead><tr><th>Termék</th><th>Normál ár</th><th>Akciós ár</th><th>Web</th><th>Sorrend</th><th>Leírás</th><th>Kép</th><th></th></tr></thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="ws-admin__product-name-cell">
                      <div className="ws-admin__thumb">{product.image_url ? <img src={product.image_url} alt="" /> : <span>K</span>}</div>
                      <input value={product.name} onChange={(event) => updateProductField(product.id, "name", event.target.value)} />
                    </td>
                    <td><div className="ws-admin__money-input"><input type="number" min="0" value={product.retail_price_gross ?? ""} onChange={(event) => updateProductField(product.id, "retail_price_gross", event.target.value === "" ? null : Number(event.target.value))} /><span>Ft</span></div></td>
                    <td><div className="ws-admin__money-input"><input type="number" min="0" value={product.sale_price ?? ""} onChange={(event) => updateProductField(product.id, "sale_price", event.target.value === "" ? null : Number(event.target.value))} /><span>Ft</span></div></td>
                    <td><label className="ws-admin__switch"><input type="checkbox" checked={product.web_is_visible} onChange={(event) => updateProductField(product.id, "web_is_visible", event.target.checked)} /><span /></label></td>
                    <td><input className="ws-admin__order-input" type="number" value={product.web_sort_order ?? ""} onChange={(event) => updateProductField(product.id, "web_sort_order", event.target.value === "" ? null : Number(event.target.value))} /></td>
                    <td><textarea rows={2} value={product.web_description || ""} onChange={(event) => updateProductField(product.id, "web_description", event.target.value)} /></td>
                    <td>
                      <label className="ws-admin__upload">
                        <input type="file" accept="image/*" disabled={uploadingProductId === product.id} onChange={(event) => void uploadImage(product.id, event.target.files?.[0] || null)} />
                        <span>{uploadingProductId === product.id ? "Feltöltés…" : "Kép csere"}</span>
                      </label>
                    </td>
                    <td><button className="ws-admin__save" type="button" disabled={savingProductId === product.id} onClick={() => void saveProduct(product)}>{savingProductId === product.id ? "…" : "Mentés"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="ws-admin__panel ws-admin__create-panel" open>
        <summary><div><span>＋ ÚJ TERMÉK</span><strong>Új webshop tétel létrehozása</strong></div><b>Űrlap</b></summary>
        <form className="ws-admin__form" onSubmit={createProduct}>
          <div className="ws-admin__form-grid ws-admin__form-grid--3">
            <label><span>Terméknév *</span><input value={newProduct.name} onChange={(event) => setNewProduct((previous) => ({ ...previous, name: event.target.value }))} required /></label>
            <label><span>Bruttó ár</span><input inputMode="decimal" value={newProduct.retail_price_gross} onChange={(event) => setNewProduct((previous) => ({ ...previous, retail_price_gross: event.target.value }))} placeholder="0" /></label>
            <label><span>Akciós ár</span><input inputMode="decimal" value={newProduct.sale_price} onChange={(event) => setNewProduct((previous) => ({ ...previous, sale_price: event.target.value }))} placeholder="opcionális" /></label>
          </div>
          <div className="ws-admin__form-grid ws-admin__form-grid--2">
            <label><span>Rövid leírás</span><textarea rows={3} value={newProduct.web_description} onChange={(event) => setNewProduct((previous) => ({ ...previous, web_description: event.target.value }))} /></label>
            <label><span>Termékkép</span><input type="file" accept="image/*" onChange={(event) => setNewProductImage(event.target.files?.[0] || null)} /></label>
          </div>
          <div className="ws-admin__form-actions">
            <label className="ws-admin__check"><input type="checkbox" checked={newProduct.web_is_visible} onChange={(event) => setNewProduct((previous) => ({ ...previous, web_is_visible: event.target.checked }))} /><span>Webshopban látható</span></label>
            <label className="ws-admin__check"><input type="checkbox" checked={newProduct.is_retail} onChange={(event) => setNewProduct((previous) => ({ ...previous, is_retail: event.target.checked }))} /><span>Lakossági értékesítés</span></label>
            <label className="ws-admin__inline-field"><span>Sorrend</span><input type="number" value={newProduct.web_sort_order} onChange={(event) => setNewProduct((previous) => ({ ...previous, web_sort_order: event.target.value }))} /></label>
            <button className="ws-admin__primary" type="submit" disabled={createProductLoading}>{createProductLoading ? "Létrehozás…" : "Termék létrehozása"}</button>
          </div>
        </form>
      </details>
    </div>
  );

  const renderCoupons = () => (
    <div className="ws-admin__coupon-layout">
      <section className="ws-admin__panel ws-admin__coupon-form-panel">
        <div className="ws-admin__panel-head"><div><span>PROMÓCIÓ</span><h2>Új kupon</h2></div></div>
        <form className="ws-admin__form" onSubmit={createCoupon}>
          <label><span>Kuponkód *</span><input className="ws-admin__coupon-code-input" value={couponForm.code} onChange={(event) => setCouponForm((previous) => ({ ...previous, code: event.target.value.toUpperCase().replace(/\s+/g, "") }))} placeholder="KLEO10" required /></label>
          <label><span>Leírás</span><textarea rows={2} value={couponForm.description} onChange={(event) => setCouponForm((previous) => ({ ...previous, description: event.target.value }))} placeholder="Belső megjegyzés / kampány neve" /></label>
          <div className="ws-admin__form-grid ws-admin__form-grid--2">
            <label><span>Kedvezmény típusa</span><select value={couponForm.discount_type} onChange={(event) => setCouponForm((previous) => ({ ...previous, discount_type: event.target.value as CouponForm["discount_type"] }))}><option value="percent">Százalékos (%)</option><option value="fixed">Fix összeg (Ft)</option></select></label>
            <label><span>Kedvezmény értéke *</span><input inputMode="decimal" value={couponForm.discount_value} onChange={(event) => setCouponForm((previous) => ({ ...previous, discount_value: event.target.value }))} required /></label>
          </div>
          <div className="ws-admin__form-grid ws-admin__form-grid--2">
            <label><span>Minimum rendelés</span><input inputMode="decimal" value={couponForm.min_order_total} onChange={(event) => setCouponForm((previous) => ({ ...previous, min_order_total: event.target.value }))} placeholder="nincs minimum" /></label>
            <label><span>Max. kedvezmény</span><input inputMode="decimal" value={couponForm.max_discount_value} onChange={(event) => setCouponForm((previous) => ({ ...previous, max_discount_value: event.target.value }))} placeholder="nincs maximum" /></label>
          </div>
          <div className="ws-admin__form-grid ws-admin__form-grid--2">
            <label><span>Érvényes ettől</span><input type="date" value={couponForm.valid_from} onChange={(event) => setCouponForm((previous) => ({ ...previous, valid_from: event.target.value }))} /></label>
            <label><span>Érvényes eddig</span><input type="date" value={couponForm.valid_until} onChange={(event) => setCouponForm((previous) => ({ ...previous, valid_until: event.target.value }))} /></label>
          </div>
          <label><span>Felhasználási limit</span><input type="number" min="1" value={couponForm.usage_limit} onChange={(event) => setCouponForm((previous) => ({ ...previous, usage_limit: event.target.value }))} placeholder="korlátlan" /></label>
          <label className="ws-admin__check"><input type="checkbox" checked={couponForm.is_active} onChange={(event) => setCouponForm((previous) => ({ ...previous, is_active: event.target.checked }))} /><span>Létrehozás után azonnal aktív</span></label>
          <button className="ws-admin__primary" type="submit" disabled={couponSaving}>{couponSaving ? "Mentés…" : "Kupon létrehozása"}</button>
        </form>
      </section>

      <section className="ws-admin__panel ws-admin__coupon-list-panel">
        <div className="ws-admin__panel-head"><div><span>KUPONKÖNYVTÁR</span><h2>{filteredCoupons.length} kupon</h2></div></div>
        <div className="ws-admin__searchbar"><span>⌕</span><input value={couponSearch} onChange={(event) => setCouponSearch(event.target.value)} placeholder="Kuponkód vagy leírás keresése…" /></div>
        {couponsLoading ? <div className="ws-admin__loading">Kuponok betöltése…</div> : couponsError ? <div className="ws-admin__error">{couponsError}</div> : filteredCoupons.length === 0 ? <div className="ws-admin__empty">Nincs megjeleníthető kupon.</div> : (
          <div className="ws-admin__coupon-cards">
            {filteredCoupons.map((coupon) => {
              const state = couponState(coupon);
              const usage = coupon.usage_limit ? Math.min(100, (coupon.used_count / coupon.usage_limit) * 100) : 0;
              return (
                <article key={coupon.id} className="ws-admin__coupon-card">
                  <div className="ws-admin__coupon-card-top">
                    <code>{coupon.code}</code>
                    <span className={`ws-admin__pill ws-admin__pill--${state.tone}`}>{state.label}</span>
                  </div>
                  <strong>{coupon.discount_value.toLocaleString("hu-HU")}{coupon.discount_type === "percent" ? "%" : " Ft"} kedvezmény</strong>
                  <p>{coupon.description || "Nincs megjegyzés."}</p>
                  <dl>
                    <div><dt>Minimum</dt><dd>{coupon.min_order_total == null ? "—" : money(coupon.min_order_total)}</dd></div>
                    <div><dt>Max. kedvezmény</dt><dd>{coupon.max_discount_value == null ? "—" : money(coupon.max_discount_value)}</dd></div>
                    <div><dt>Érvényesség</dt><dd>{dateLabel(coupon.valid_from)} – {dateLabel(coupon.valid_until)}</dd></div>
                  </dl>
                  <div className="ws-admin__coupon-usage"><span><b>{coupon.used_count}</b> felhasználás {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ""}</span>{coupon.usage_limit && <div><i style={{ width: `${usage}%` }} /></div>}</div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  const renderOrders = () => (
    <section className="ws-admin__panel">
      <div className="ws-admin__panel-head ws-admin__panel-head--wrap">
        <div><span>RENDELÉSEK</span><h2>{filteredOrders.length} találat</h2></div>
        <div className="ws-admin__order-filters">
          <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value as OrderFilter)}>
            <option value="all">Minden státusz</option><option value="new">Új</option><option value="processing">Feldolgozás</option><option value="completed">Teljesítve</option><option value="cancelled">Lemondva</option>
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as "all" | "paid" | "unpaid")}>
            <option value="all">Minden fizetés</option><option value="paid">Fizetve</option><option value="unpaid">Nincs fizetve</option>
          </select>
        </div>
      </div>
      <div className="ws-admin__searchbar"><span>⌕</span><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Vevő, e-mail, telefon vagy rendelésazonosító…" /></div>
      {ordersLoading ? <div className="ws-admin__loading">Rendelések betöltése…</div> : ordersError ? <div className="ws-admin__error">{ordersError}</div> : filteredOrders.length === 0 ? <div className="ws-admin__empty">Nincs a szűrésnek megfelelő rendelés.</div> : (
        <div className="ws-admin__order-cards">
          {filteredOrders.map((order) => (
            <article key={order.id} className="ws-admin__order-card">
              <div className="ws-admin__order-main">
                <div className="ws-admin__order-id"><span>#{order.id.slice(0, 8).toUpperCase()}</span><small>{new Date(order.created_at).toLocaleString("hu-HU")}</small></div>
                <div className="ws-admin__customer"><strong>{order.customer_name}</strong><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a><small>{order.customer_phone || "Nincs telefonszám"}</small></div>
                <strong className="ws-admin__order-total">{money(order.total_gross)}</strong>
              </div>
              <div className="ws-admin__order-controls">
                <label><span>Rendelés státusza</span><select disabled={savingOrderId === order.id} value={order.status} onChange={(event) => void updateOrder(order.id, { status: event.target.value })}><option value="new">Új</option><option value="processing">Feldolgozás alatt</option><option value="completed">Teljesítve</option><option value="cancelled">Lemondva</option></select></label>
                <label><span>Fizetési státusz</span><select disabled={savingOrderId === order.id} value={order.payment_status} onChange={(event) => void updateOrder(order.id, { payment_status: event.target.value })}><option value="unpaid">Nincs fizetve</option><option value="paid">Fizetve</option></select></label>
                <span className={`ws-admin__status ws-admin__status--${order.status}`}>{savingOrderId === order.id ? "Mentés…" : orderStatusLabel[order.status] || order.status}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="ws-admin">
      <header className="ws-admin__hero">
        <div>
          <span className="ws-admin__eyebrow">KLEOPÁTRA · COMMERCE CONTROL CENTER</span>
          <h1>Webshop admin</h1>
          <p>Termékek, árak, képek, kuponkampányok és rendelések egy korszerű kezelőfelületen.</p>
        </div>
        <div className="ws-admin__hero-actions">
          <button type="button" className="ws-admin__refresh" onClick={() => void refreshAll()} disabled={refreshing}>{refreshing ? "Frissítés…" : "↻ Adatok frissítése"}</button>
          <a className="ws-admin__storefront" href={STOREFRONT_URL} target="_blank" rel="noreferrer">Webshop megnyitása ↗</a>
        </div>
      </header>

      <section className="ws-admin__kpis" aria-label="Webshop fő mutatók">
        <button type="button" onClick={() => setActiveTab("products")}><span>TERMÉKEK</span><strong>{stats.products}</strong><small>{stats.visible} publikus</small></button>
        <button type="button" onClick={() => setActiveTab("coupons")}><span>AKTÍV KUPON</span><strong>{stats.activeCoupons}</strong><small>{coupons.length} összesen</small></button>
        <button type="button" onClick={() => setActiveTab("orders")}><span>NYITOTT RENDELÉS</span><strong>{stats.openOrders}</strong><small>{stats.todayOrders} érkezett ma</small></button>
        <button type="button" onClick={() => setActiveTab("orders")}><span>FIZETETT ÉRTÉK</span><strong className="ws-admin__kpi-money">{money(stats.paidValue)}</strong><small>lemondott nélkül</small></button>
      </section>

      <nav className="ws-admin__tabs" aria-label="Webshop admin nézetek">
        {([
          ["overview", "Áttekintés", "⌁"],
          ["products", "Termékek", String(products.length)],
          ["coupons", "Kuponok", String(coupons.length)],
          ["orders", "Rendelések", String(orders.length)],
        ] as [TabKey, string, string][]).map(([key, label, badge]) => (
          <button key={key} type="button" className={activeTab === key ? "is-active" : ""} onClick={() => setActiveTab(key)}><span>{label}</span><b>{badge}</b></button>
        ))}
      </nav>

      <main className="ws-admin__content">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "coupons" && renderCoupons()}
        {activeTab === "orders" && renderOrders()}
      </main>

      {notice && <div className={`ws-admin__toast ws-admin__toast--${notice.type}`} role="status">{notice.type === "success" ? "✓" : "!"} {notice.text}</div>}
    </div>
  );
};

export default WebshopAdmin;
export { WebshopAdmin };
