// src/pages/WebshopAdmin.tsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

/* =================================================================== */
/*                      API ALAP + SEGÉDFÜGGVÉNYEK                     */
/* =================================================================== */

const rawBase =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:5000/api";

// Gondoskodunk róla, hogy mindig /api végződés legyen
const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

// statikus fájlok (képek) alap URL-je
const API_ROOT = API_BASE.replace(/\/api$/, "");

const buildImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const cleaned = imageUrl.replace(/^\/+/, "");
  // Ha csak fájlnév van (pl. "kep.png"), akkor tipikusan az /uploads alatt van kiszolgálva
  const normalized = cleaned.includes("/") ? cleaned : `uploads/${cleaned}`;
  return `${API_ROOT}/${normalized}`;
};

const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

// Egységes admin fetch a /api/admin/webshop/... endpointokra
async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}/admin/webshop/${path.replace(/^\/+/, "")}`;
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const baseHeaders: Record<string, string> = {};

  // FormData esetén NEM állítunk Content-Type-ot (a böngésző megteszi)
  if (!isFormData) {
    baseHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }

  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // nem JSON – ilyenkor is visszaadjuk a nyers szöveget data helyett
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Admin API hiba: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return (data ?? undefined) as T;
}

/* =================================================================== */
/*                                 TÍPUSOK                              */
/* =================================================================== */

type Product = {
  id: string;
  name: string;
  retail_price_gross: number | null;
  sale_price: number | null;
  web_is_visible: boolean;
  is_retail: boolean;
  web_sort_order: number | null;
  web_description: string | null;
  image_url: string | null; // state-ben már teljes URL-t tárolunk
};

type NewProductForm = {
  name: string;
  product_group_id: string;
  product_category_id: string;
  retail_price_gross: string;
  sale_price: string;
  web_is_visible: boolean;
  is_retail: boolean;
  web_sort_order: string;
  web_description: string;
};

type ProductGroup = {
  id: string;
  name?: string | null;
  name_hu?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  label?: string | null;
  label_hu?: string | null;
  label_en?: string | null;
  label_ru?: string | null;
};

type ProductCategory = {
  id: string;
  product_group_id?: string | null;
  group_id?: string | null;
  name?: string | null;
  name_hu?: string | null;
  name_en?: string | null;
  name_ru?: string | null;
  label?: string | null;
  label_hu?: string | null;
  label_en?: string | null;
  label_ru?: string | null;
};

const pickLabel = (o: any): string => {
  return (
    o?.name_hu ||
    o?.label_hu ||
    o?.name ||
    o?.label ||
    o?.code ||
    o?.title ||
    (o?.id ? String(o.id) : "")
  );
};

const getCategoryGroupId = (c: any): string | null => {
  return (c?.product_group_id || c?.group_id || c?.productGroupId || null) as any;
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
  status: string; // pl. 'new' | 'processing' | 'completed' | 'cancelled'
  payment_status: string; // pl. 'unpaid' | 'paid'
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_gross: number;
};

/* =================================================================== */
/*                           KOMPONENS – OLDAL                         */
/* =================================================================== */

const WebshopAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "products" | "coupons" | "orders"
  >("products");

  // TERMÉKEK
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(
    null
  );

  // Szűrés / keresés
  const [productSearch, setProductSearch] = useState("");
  const [filterVisibleOnly, setFilterVisibleOnly] = useState(false);
  const [filterRetailOnly, setFilterRetailOnly] = useState(false);

  // ÚJ TERMÉK ŰRLAP
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    product_group_id: "",
    product_category_id: "",
    retail_price_gross: "",
    sale_price: "",
    web_is_visible: true,
    is_retail: true,
    web_sort_order: "",
    web_description: "",
  });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductError, setNewProductError] = useState<string | null>(null);
  const [createProductLoading, setCreateProductLoading] = useState(false);
  const [createProductMessage, setCreateProductMessage] = useState<
    string | null
  >(null);

  // FŐKATEGÓRIÁK + KATEGÓRIÁK (kötelező a termék létrehozásához)
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);

  const [newGroupNameHu, setNewGroupNameHu] = useState("");
  const [newGroupNameEn, setNewGroupNameEn] = useState("");
  const [newGroupNameRu, setNewGroupNameRu] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [newCategoryNameHu, setNewCategoryNameHu] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [newCategoryNameRu, setNewCategoryNameRu] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // KUPONOK
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>({
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
  });
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // RENDELÉSEK
  const [orders, setOrders] = useState<WebshopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  /* --------------------------- Betöltések --------------------------- */

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await adminFetch<Product[]>("products");
      const normalized = (data || []).map((p) => ({
        ...p,
        image_url: p.image_url ? buildImageUrl(p.image_url) || p.image_url : null,
      }));
      setProducts(normalized);
    } catch (err: any) {
      console.error("Termékek betöltési hiba:", err);
      setProductsError(
        err?.message || "Nem sikerült betölteni a termékeket."
      );
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const data = await adminFetch<Coupon[]>("coupons");
      setCoupons(data || []);
    } catch (err: any) {
      console.error("Kuponok betöltési hiba:", err);
      setCouponsError(err?.message || "Nem sikerült betölteni a kuponokat.");
    } finally {
      setCouponsLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await adminFetch<WebshopOrder[]>("orders");
      setOrders(data || []);
    } catch (err: any) {
      console.error("Rendelések betöltési hiba:", err);
      setOrdersError(
        err?.message || "Nem sikerült betölteni a rendeléseket."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const tryAdminFetch = async <T,>(paths: string[]): Promise<T> => {
    let lastErr: any = null;
    for (const p of paths) {
      try {
        return await adminFetch<T>(p);
      } catch (e: any) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Nem sikerült betölteni az adatokat.");
  };

const normalizeArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
};

const getLang = (): string => {
  const raw =
    localStorage.getItem("lang") ||
    localStorage.getItem("i18nextLng") ||
    "hu";
  return String(raw).toLowerCase().slice(0, 2);
};

const publicFetch = async <T,>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const cleaned = path.replace(/^\/+/, "");
  const url = `${API_BASE}/public/webshop/${cleaned}`;
  const res = await fetch(url, {
    ...options,
    credentials: "omit",
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Public API hiba: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return (data ?? undefined) as T;
};

const tryPublicFetch = async <T,>(paths: string[]): Promise<T> => {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      return await publicFetch<T>(p);
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Nem sikerült betölteni az adatokat.");
};

const deriveTaxonomiesFromProducts = (
  items: any[]
): { groups: ProductGroup[]; categories: ProductCategory[] } => {
  const groups = new Map<string, ProductGroup>();
  const categories = new Map<string, ProductCategory>();

  const pickText = (...vals: any[]) => {
    for (const v of vals) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return "";
  };

  for (const p of items || []) {
    const gObj = p?.product_group || p?.group || p?.productGroup || null;
    const cObj = p?.product_category || p?.category || p?.productCategory || null;

    const groupId = pickText(
      p?.product_group_id,
      p?.group_id,
      p?.productGroupId,
      gObj?.id
    );
    const categoryId = pickText(
      p?.product_category_id,
      p?.category_id,
      p?.productCategoryId,
      cObj?.id
    );

    if (groupId && !groups.has(groupId)) {
      const name = pickText(
        p?.product_group_name_hu,
        p?.group_name_hu,
        p?.product_group_label_hu,
        p?.group_label_hu,
        gObj?.name_hu,
        gObj?.label_hu,
        p?.product_group_name,
        p?.group_name,
        gObj?.name,
        gObj?.label
      );
      groups.set(groupId, {
        id: groupId,
        name_hu: name || groupId,
        label_hu: name || groupId,
      });
    }

    if (categoryId && !categories.has(categoryId)) {
      const gid = pickText(
        p?.product_group_id,
        p?.group_id,
        p?.productGroupId,
        cObj?.product_group_id,
        cObj?.group_id,
        gObj?.id
      );
      const name = pickText(
        p?.product_category_name_hu,
        p?.category_name_hu,
        p?.product_category_label_hu,
        p?.category_label_hu,
        cObj?.name_hu,
        cObj?.label_hu,
        p?.product_category_name,
        p?.category_name,
        cObj?.name,
        cObj?.label
      );
      categories.set(categoryId, {
        id: categoryId,
        product_group_id: gid || null,
        group_id: gid || null,
        name_hu: name || categoryId,
        label_hu: name || categoryId,
      });
    }
  }

  return {
    groups: Array.from(groups.values()),
    categories: Array.from(categories.values()),
  };
};



  const loadTaxonomies = async () => {
    setTaxLoading(true);
    setTaxError(null);

    try {
      let loaded = false;

      // 1) Admin taxonómia endpointok (ha léteznek)
      try {
        const groupsRaw = await tryAdminFetch<any>([
          "product-groups",
          "product_groups",
          "groups",
        ]);
        const catsRaw = await tryAdminFetch<any>([
          "product-categories",
          "product_categories",
          "categories",
        ]);

        const groups = normalizeArray<ProductGroup>(groupsRaw);
        const cats = normalizeArray<ProductCategory>(catsRaw);

        if (groups.length || cats.length) {
          setProductGroups(groups);
          setProductCategories(cats);
          loaded = true;
        }
      } catch (errAdmin: any) {
        console.warn("Admin taxonómia endpointok nem elérhetők:", errAdmin);
      }

      // 2) Public taxonómia endpointok (ha léteznek)
      if (!loaded) {
        try {
          const groupsRaw = await tryPublicFetch<any>([
            "product-groups",
            "product_groups",
            "groups",
            "categories/groups",
            "taxonomy/groups",
            "menu/groups",
          ]);

          const catsRaw = await tryPublicFetch<any>([
            "product-categories",
            "product_categories",
            "categories",
            "taxonomy/categories",
            "menu/categories",
          ]);

          const groups = normalizeArray<ProductGroup>(groupsRaw);
          const cats = normalizeArray<ProductCategory>(catsRaw);

          if (groups.length || cats.length) {
            setProductGroups(groups);
            setProductCategories(cats);
            loaded = true;
          }
        } catch (errPublic: any) {
          console.warn("Public taxonómia endpointok nem elérhetők:", errPublic);
        }
      }

      // 3) Deriválás admin terméklistából (ha a termékek endpoint működik)
      if (!loaded) {
        try {
          const productsRaw = await adminFetch<any>("products");
          const items = normalizeArray<any>(productsRaw);
          const derived = deriveTaxonomiesFromProducts(items);

          if (derived.groups.length || derived.categories.length) {
            setProductGroups(derived.groups);
            setProductCategories(derived.categories);
            setTaxError(
              "Figyelem: a kategóriákat a terméklistából állítottuk elő (nincs külön taxonómia endpoint)."
            );
            loaded = true;
          }
        } catch (errDeriveAdmin: any) {
          console.warn(
            "Admin terméklistából nem sikerült deriválni:",
            errDeriveAdmin
          );
        }
      }

      // 4) Deriválás public webshop terméklistából
      if (!loaded) {
        const lang = getLang();
        const productsRaw = await publicFetch<any>(
          `products?lang=${encodeURIComponent(lang)}`
        );
        const items = normalizeArray<any>(productsRaw);
        const derived = deriveTaxonomiesFromProducts(items);

        setProductGroups(derived.groups);
        setProductCategories(derived.categories);

        if (!derived.groups.length || !derived.categories.length) {
          setTaxError(
            "Nem sikerült betölteni a kategóriákat. A backend oldalon hiányozhat a kategória/főkategória endpoint, vagy a terméklista nem tartalmazza a szükséges mezőket."
          );
        } else {
          setTaxError(
            "Figyelem: a kategóriákat a public terméklistából állítottuk elő (nincs külön taxonómia endpoint)."
          );
        }
      }
    } catch (errFinal: any) {
      console.error("Kategóriák betöltési hiba:", errFinal);
      setTaxError(
        errFinal?.message ||
          "Nem sikerült betölteni a kategóriákat. (Ellenőrizd a kategória endpointokat és a terméklista mezőit.)"
      );
    } finally {
      setTaxLoading(false);
    }
  };

  const tryAdminPost = async <T,>(paths: string[], body: any): Promise<T> => {
    let lastErr: any = null;
    for (const p of paths) {
      try {
        return await adminFetch<T>(p, {
          method: "POST",
          body: JSON.stringify(body),
        });
      } catch (e: any) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Sikertelen mentés.");
  };

  const handleCreateGroup = async () => {
    setTaxError(null);
    if (!newGroupNameHu.trim()) {
      setTaxError("Az új főkategória magyar neve kötelező.");
      return;
    }
    setCreatingGroup(true);
    try {
      const payload = {
        name_hu: newGroupNameHu.trim(),
        name_en: newGroupNameEn.trim() || null,
        name_ru: newGroupNameRu.trim() || null,
        // kompatibilitás különböző backend mezőnevekhez
        label_hu: newGroupNameHu.trim(),
        label_en: newGroupNameEn.trim() || null,
        label_ru: newGroupNameRu.trim() || null,
      };

      const created = await tryAdminPost<any>([
        "product-groups",
        "product_groups",
        "groups",
      ], payload);

      const newId = created?.id || created?.group_id || created?.product_group_id;
      await loadTaxonomies();
      if (newId) {
        handleNewProductChange("product_group_id", String(newId));
        // új főkategória esetén a kategóriát nullázzuk
        handleNewProductChange("product_category_id", "");
      }
      setNewGroupNameHu("");
      setNewGroupNameEn("");
      setNewGroupNameRu("");
    } catch (err: any) {
      console.error("Főkategória létrehozási hiba:", err);
      setTaxError(err?.message || "Nem sikerült létrehozni a főkategóriát.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCreateCategory = async () => {
    setTaxError(null);
    if (!newProduct.product_group_id) {
      setTaxError("Előbb válassz főkategóriát a kategória létrehozásához.");
      return;
    }
    if (!newCategoryNameHu.trim()) {
      setTaxError("Az új kategória magyar neve kötelező.");
      return;
    }
    setCreatingCategory(true);
    try {
      const payload = {
        product_group_id: newProduct.product_group_id,
        group_id: newProduct.product_group_id,
        name_hu: newCategoryNameHu.trim(),
        name_en: newCategoryNameEn.trim() || null,
        name_ru: newCategoryNameRu.trim() || null,
        label_hu: newCategoryNameHu.trim(),
        label_en: newCategoryNameEn.trim() || null,
        label_ru: newCategoryNameRu.trim() || null,
      };

      const created = await tryAdminPost<any>([
        "product-categories",
        "product_categories",
        "categories",
      ], payload);

      const newId = created?.id || created?.category_id || created?.product_category_id;
      await loadTaxonomies();
      if (newId) {
        handleNewProductChange("product_category_id", String(newId));
      }
      setNewCategoryNameHu("");
      setNewCategoryNameEn("");
      setNewCategoryNameRu("");
    } catch (err: any) {
      console.error("Kategória létrehozási hiba:", err);
      setTaxError(err?.message || "Nem sikerült létrehozni a kategóriát.");
    } finally {
      setCreatingCategory(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCoupons();
    loadOrders();
    loadTaxonomies();
  }, []);

  /* --------------------------- Szűrt lista -------------------------- */

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (filterVisibleOnly && !p.web_is_visible) return false;
      if (filterRetailOnly && !p.is_retail) return false;

      if (q) {
        const haystack = `${p.name} ${p.web_description || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, productSearch, filterVisibleOnly, filterRetailOnly]);

  /* ---------------------- Termék szerkesztés ------------------------ */

  const handleProductFieldChange = <K extends keyof Product>(
    productId: string,
    field: K,
    value: Product[K]
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveProduct = async (product: Product) => {
    setSavingProductId(product.id);
    try {
      await adminFetch<void>(`products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: product.name,
          retail_price_gross: product.retail_price_gross,
          sale_price: product.sale_price,
          web_is_visible: product.web_is_visible,
          is_retail: product.is_retail,
          web_sort_order: product.web_sort_order,
          web_description: product.web_description,
        }),
      });
      await loadProducts();
    } catch (err) {
      console.error("Termék mentési hiba:", err);
      alert("Nem sikerült elmenteni a terméket.");
    } finally {
      setSavingProductId(null);
    }
  };

  /* ----------------------- Új termék + kép -------------------------- */

  const handleNewProductChange = <K extends keyof NewProductForm>(
    field: K,
    value: NewProductForm[K]
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProductError(null);
    setCreateProductMessage(null);

    if (!newProduct.name.trim()) {
      setNewProductError("A terméknév kötelező.");
      return;
    }

    if (!newProduct.product_group_id) {
      setNewProductError("Főkategória (product_group_id) kötelező.");
      return;
    }

    if (!newProduct.product_category_id) {
      setNewProductError("Kategória (product_category_id) kötelező.");
      return;
    }


    const payload = {
      name: newProduct.name.trim(),
      product_group_id: newProduct.product_group_id,
      product_category_id: newProduct.product_category_id,
      // kompatibilitás különböző backend elnevezésekkel
      group_id: newProduct.product_group_id,
      category_id: newProduct.product_category_id,
      retail_price_gross: newProduct.retail_price_gross
        ? parseFloat(newProduct.retail_price_gross.replace(",", "."))
        : null,
      sale_price: newProduct.sale_price
        ? parseFloat(newProduct.sale_price.replace(",", "."))
        : null,
      web_is_visible: newProduct.web_is_visible,
      is_retail: newProduct.is_retail,
      web_sort_order: newProduct.web_sort_order
        ? parseInt(newProduct.web_sort_order, 10)
        : null,
      web_description: newProduct.web_description || null,
    };

    setCreateProductLoading(true);

    try {
      const created = await adminFetch<Product>("products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // ha azonnal képet is akarunk, feltöltjük
      if (newProductImage && created?.id) {
        await handleUploadImage(created.id, newProductImage);
      }

      setNewProduct((prev) => ({
        ...prev,
        name: "",
        retail_price_gross: "",
        sale_price: "",
        web_is_visible: true,
        is_retail: true,
        web_sort_order: "",
        web_description: "",
      }));
      setNewProductImage(null);
      setCreateProductMessage("Új termék sikeresen létrehozva.");
      await loadProducts();
    } catch (err: any) {
      console.error("Új termék létrehozási hiba:", err);
      setNewProductError(
        err?.message || "Nem sikerült létrehozni az új terméket."
      );
    } finally {
      setCreateProductLoading(false);
    }
  };

  const handleUploadImage = async (productId: string, file: File | null) => {
    if (!file) return;
    setUploadingProductId(productId);

    try {
      const formData = new FormData();
      // BACKEND: upload.single("file") → itt is "file" legyen a mezőnév
      formData.append("file", file);

      const data = await adminFetch<{ image_url?: string | null }>(
        `products/${productId}/image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const fullUrl = buildImageUrl(data?.image_url) || null;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, image_url: fullUrl } : p
        )
      );
    } catch (err) {
      console.error("Képfeltöltés hiba:", err);
      alert("Nem sikerült feltölteni a képet.");
    } finally {
      setUploadingProductId(null);
    }
  };

  /* --------------------------- Kuponkezelés ------------------------ */

  const handleCouponFormChange = <K extends keyof CouponForm>(
    field: K,
    value: CouponForm[K]
  ) => {
    setCouponForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponMessage(null);

    if (!couponForm.code.trim()) {
      setCouponError("A kuponkód kötelező.");
      return;
    }

    const payload = {
      code: couponForm.code.trim(),
      description: couponForm.description || null,
      discount_type: couponForm.discount_type,
      discount_value: couponForm.discount_value
        ? parseFloat(couponForm.discount_value.replace(",", "."))
        : 0,
      min_order_total: couponForm.min_order_total
        ? parseFloat(couponForm.min_order_total.replace(",", "."))
        : null,
      max_discount_value: couponForm.max_discount_value
        ? parseFloat(couponForm.max_discount_value.replace(",", "."))
        : null,
      valid_from: couponForm.valid_from || null,
      valid_until: couponForm.valid_until || null,
      usage_limit: couponForm.usage_limit
        ? parseInt(couponForm.usage_limit, 10)
        : null,
      is_active: couponForm.is_active,
    };

    setCouponSaving(true);

    try {
      await adminFetch<Coupon>("coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCouponMessage("Kupon sikeresen elmentve.");
      setCouponForm({
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
      });
      await loadCoupons();
    } catch (err: any) {
      console.error("Kupon mentési hiba:", err);
      setCouponError(
        err?.message ||
          "Nem sikerült elmenteni a kupont. (400-as hiba esetén a backend validáció szól bele.)"
      );
    } finally {
      setCouponSaving(false);
    }
  };

  /* --------------------------- Rendeléskezelés --------------------- */

  const handleUpdateOrder = async (
    orderId: string,
    updates: Partial<Pick<WebshopOrder, "status" | "payment_status">>
  ) => {
    try {
      const updated = await adminFetch<WebshopOrder>(`orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
    } catch (err: any) {
      console.error("Rendelés frissítési hiba:", err);
      alert("Nem sikerült frissíteni a rendelést.");
    }
  };

  /* =================================================================== */
  /*                                  JSX                                */
  /* =================================================================== */

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar />
      <main className="calendar-container">
        {/* 95% szélesség */}
        <div className="page" style={{ maxWidth: "95vw" }}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Webshop admin</h1>
              <p className="page-subtitle">
                Termékek, kuponok és online rendelések kezelése.
              </p>
            </div>
          </div>

          <div className="tabs tabs-outline mb-4">
            <button
              className={
                "tab" + (activeTab === "products" ? " tab--active" : "")
              }
              onClick={() => setActiveTab("products")}
            >
              Termékek
            </button>
            <button
              className={
                "tab" + (activeTab === "coupons" ? " tab--active" : "")
              }
              onClick={() => setActiveTab("coupons")}
            >
              Kuponok
            </button>
            <button
              className={
                "tab" + (activeTab === "orders" ? " tab--active" : "")
              }
              onClick={() => setActiveTab("orders")}
            >
              Rendelések
            </button>
          </div>

          {/* --------------------- TERMÉKEK TAB ------------------------ */}
          {activeTab === "products" && (
            <>
              {/* SZŰRŐ + KERESŐ */}
              <section className="card mb-4">
                <div className="card-header">
                  <h2>Webshop termékek szűrése</h2>
                  <p className="card-subtitle">
                    Keresés név és leírás alapján, láthatóság és lakossági
                    termék szűrése.
                  </p>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <label style={{ flex: 2 }}>
                      Keresés
                      <input
                        type="text"
                        className="input"
                        placeholder="Terméknév vagy leírás..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </label>
                    <label className="checkbox-label" style={{ flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={filterVisibleOnly}
                        onChange={(e) =>
                          setFilterVisibleOnly(e.target.checked)
                        }
                      />
                      Csak webshopban látható
                    </label>
                    <label className="checkbox-label" style={{ flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={filterRetailOnly}
                        onChange={(e) => setFilterRetailOnly(e.target.checked)}
                      />
                      Csak lakossági termékek
                    </label>
                  </div>
                </div>
              </section>

              {/* ÚJ TERMÉK FELVITELE */}
              <section className="card mb-4">
                <div className="card-header">
                  <h2>Új termék felvitele a webshopba</h2>
                </div>
                <div className="card-body">
                  {newProductError && (
                    <p className="error-text">{newProductError}</p>
                  )}
                  {createProductMessage && (
                    <p className="success-text">{createProductMessage}</p>
                  )}

                  <form className="form-grid" onSubmit={handleCreateProduct}>
                    <div className="form-row">
                      <label>
                        Terméknév*
                        <input
                          type="text"
                          className="input"
                          value={newProduct.name}
                          onChange={(e) =>
                            handleNewProductChange("name", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Ár (bruttó Ft)
                        <input
                          type="text"
                          className="input"
                          value={newProduct.retail_price_gross}
                          onChange={(e) =>
                            handleNewProductChange(
                              "retail_price_gross",
                              e.target.value
                            )
                          }
                        />
                      </label>
                      <label>
                        Akciós ár (Ft)
                        <input
                          type="text"
                          className="input"
                          value={newProduct.sale_price}
                          onChange={(e) =>
                            handleNewProductChange(
                              "sale_price",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    {taxError && (
                      <p className="error-text">{taxError}</p>
                    )}
                    {taxLoading && <p>Főkategóriák/kategóriák betöltése…</p>}

                    <div className="form-row">
                      <label>
                        Főkategória*
                        <select
                          className="input"
                          value={newProduct.product_group_id}
                          onChange={(e) => {
                            const nextGroupId = e.target.value;
                            handleNewProductChange("product_group_id", nextGroupId);
                            // ha a kiválasztott kategória nem ehhez tartozik, ürítsük
                            const currentCat = productCategories.find(
                              (c) => String(c.id) === String(newProduct.product_category_id)
                            );
                            const catGroup = currentCat ? getCategoryGroupId(currentCat) : null;
                            if (currentCat && catGroup && String(catGroup) !== String(nextGroupId)) {
                              handleNewProductChange("product_category_id", "");
                            }
                          }}
                        >
                          <option value="">Válassz főkategóriát…</option>
                          {productGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {pickLabel(g) || g.id}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Kategória*
                        <select
                          className="input"
                          value={newProduct.product_category_id}
                          disabled={!newProduct.product_group_id}
                          onChange={(e) => {
                            const nextCatId = e.target.value;
                            handleNewProductChange("product_category_id", nextCatId);
                            const cat = productCategories.find(
                              (c) => String(c.id) === String(nextCatId)
                            );
                            const gid = cat ? getCategoryGroupId(cat) : null;
                            if (gid && String(gid) !== String(newProduct.product_group_id)) {
                              handleNewProductChange("product_group_id", String(gid));
                            }
                          }}
                        >
                          <option value="">Válassz kategóriát…</option>
                          {productCategories
                            .filter((c) => {
                              if (!newProduct.product_group_id) return true;
                              const gid = getCategoryGroupId(c);
                              return gid ? String(gid) === String(newProduct.product_group_id) : true;
                            })
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {pickLabel(c) || c.id}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>

                    <div className="form-row" style={{ gap: 12 }}>
                      <div
                        style={{
                          flex: 1,
                          border: "1px solid rgba(0,0,0,0.12)",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                          Új főkategória
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            type="text"
                            className="input"
                            placeholder="HU név *"
                            value={newGroupNameHu}
                            onChange={(e) => setNewGroupNameHu(e.target.value)}
                            style={{ minWidth: 180, flex: 1 }}
                          />
                          <input
                            type="text"
                            className="input"
                            placeholder="EN név"
                            value={newGroupNameEn}
                            onChange={(e) => setNewGroupNameEn(e.target.value)}
                            style={{ minWidth: 160, flex: 1 }}
                          />
                          <input
                            type="text"
                            className="input"
                            placeholder="RU név"
                            value={newGroupNameRu}
                            onChange={(e) => setNewGroupNameRu(e.target.value)}
                            style={{ minWidth: 160, flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCreateGroup}
                            disabled={creatingGroup}
                          >
                            {creatingGroup ? "Mentés…" : "Létrehozás"}
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          flex: 1,
                          border: "1px solid rgba(0,0,0,0.12)",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>
                          Új kategória
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            type="text"
                            className="input"
                            placeholder="HU név *"
                            value={newCategoryNameHu}
                            onChange={(e) => setNewCategoryNameHu(e.target.value)}
                            style={{ minWidth: 180, flex: 1 }}
                          />
                          <input
                            type="text"
                            className="input"
                            placeholder="EN név"
                            value={newCategoryNameEn}
                            onChange={(e) => setNewCategoryNameEn(e.target.value)}
                            style={{ minWidth: 160, flex: 1 }}
                          />
                          <input
                            type="text"
                            className="input"
                            placeholder="RU név"
                            value={newCategoryNameRu}
                            onChange={(e) => setNewCategoryNameRu(e.target.value)}
                            style={{ minWidth: 160, flex: 1 }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCreateCategory}
                            disabled={creatingCategory || !newProduct.product_group_id}
                          >
                            {creatingCategory ? "Mentés…" : "Létrehozás"}
                          </button>
                        </div>
                        {!newProduct.product_group_id && (
                          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                            Kategória létrehozáshoz előbb válassz főkategóriát.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.web_is_visible}
                          onChange={(e) =>
                            handleNewProductChange(
                              "web_is_visible",
                              e.target.checked
                            )
                          }
                        />
                        Webshopban látható
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newProduct.is_retail}
                          onChange={(e) =>
                            handleNewProductChange(
                              "is_retail",
                              e.target.checked
                            )
                          }
                        />
                        Lakossági értékesítésre
                      </label>
                      <label>
                        Webes sorrend
                        <input
                          type="text"
                          className="input"
                          value={newProduct.web_sort_order}
                          onChange={(e) =>
                            handleNewProductChange(
                              "web_sort_order",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-row">
                      <label style={{ flex: 2 }}>
                        Rövid leírás
                        <textarea
                          className="input"
                          rows={2}
                          value={newProduct.web_description}
                          onChange={(e) =>
                            handleNewProductChange(
                              "web_description",
                              e.target.value
                            )
                          }
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        Termékkép (opcionális)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setNewProductImage(
                              e.target.files && e.target.files[0]
                                ? e.target.files[0]
                                : null
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={createProductLoading}
                      >
                        {createProductLoading
                          ? "Mentés…"
                          : "Új termék létrehozása"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* TERMÉKLISTA */}
              <section className="card">
                <div className="card-header">
                  <h2>Webshop termékek</h2>
                </div>
                <div className="card-body">
                  {productsLoading ? (
                    <p>Betöltés…</p>
                  ) : productsError ? (
                    <p className="error-text">{productsError}</p>
                  ) : filteredProducts.length === 0 ? (
                    <p>Nincs a szűrésnek megfelelő termék.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Termék</th>
                            <th>Ár (bruttó Ft)</th>
                            <th>Akciós ár</th>
                            <th>Látható</th>
                            <th>Lakossági</th>
                            <th>Web sorrend</th>
                            <th>Leírás</th>
                            <th>Kép</th>
                            <th>Művelet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <input
                                  className="input"
                                  value={p.name}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input"
                                  value={
                                    p.retail_price_gross ?? ""
                                  }
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "retail_price_gross",
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input"
                                  value={p.sale_price ?? ""}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "sale_price",
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={p.web_is_visible}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "web_is_visible",
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={p.is_retail}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "is_retail",
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input"
                                  value={p.web_sort_order ?? ""}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "web_sort_order",
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <textarea
                                  className="input"
                                  rows={2}
                                  value={p.web_description || ""}
                                  onChange={(e) =>
                                    handleProductFieldChange(
                                      p.id,
                                      "web_description",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  {p.image_url && (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      style={{
                                        width: 48,
                                        height: 48,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                      }}
                                    />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingProductId === p.id}
                                    onChange={(e) =>
                                      handleUploadImage(
                                        p.id,
                                        e.target.files && e.target.files[0]
                                          ? e.target.files[0]
                                          : null
                                      )
                                    }
                                  />
                                  {uploadingProductId === p.id && (
                                    <span style={{ fontSize: 12 }}>
                                      Kép feltöltése…
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm"
                                  disabled={savingProductId === p.id}
                                  onClick={() => handleSaveProduct(p)}
                                >
                                  {savingProductId === p.id
                                    ? "Mentés…"
                                    : "Mentés"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ---------------------- KUPONOK TAB ----------------------- */}
          {activeTab === "coupons" && (
            <>
              <section className="card mb-4">
                <div className="card-header">
                  <h2>Új kupon létrehozása</h2>
                </div>
                <div className="card-body">
                  {couponError && (
                    <p className="error-text">{couponError}</p>
                  )}
                  {couponMessage && (
                    <p className="success-text">{couponMessage}</p>
                  )}

                  <form className="form-grid" onSubmit={handleCreateCoupon}>
                    <div className="form-row two-cols">
                      <label>
                        Kuponkód*
                        <input
                          type="text"
                          className="input"
                          value={couponForm.code}
                          onChange={(e) =>
                            handleCouponFormChange("code", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Típus
                        <select
                          className="input"
                          value={couponForm.discount_type}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "discount_type",
                              e.target.value as CouponForm["discount_type"]
                            )
                          }
                        >
                          <option value="percent">Százalékos (%)</option>
                          <option value="fixed">Fix összeg (Ft)</option>
                        </select>
                      </label>
                    </div>

                    <div className="form-row two-cols">
                      <label>
                        Kedvezmény értéke
                        <input
                          type="text"
                          className="input"
                          value={couponForm.discount_value}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "discount_value",
                              e.target.value
                            )
                          }
                        />
                      </label>
                      <label>
                        Minimum rendelési összeg (Ft)
                        <input
                          type="text"
                          className="input"
                          value={couponForm.min_order_total}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "min_order_total",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-row two-cols">
                      <label>
                        Max. kedvezmény (Ft)
                        <input
                          type="text"
                          className="input"
                          value={couponForm.max_discount_value}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "max_discount_value",
                              e.target.value
                            )
                          }
                        />
                      </label>
                      <label>
                        Felhasználási limit (db)
                        <input
                          type="text"
                          className="input"
                          value={couponForm.usage_limit}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "usage_limit",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-row two-cols">
                      <label>
                        Érvényesség kezdete
                        <input
                          type="date"
                          className="input"
                          value={couponForm.valid_from}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "valid_from",
                              e.target.value
                            )
                          }
                        />
                      </label>
                      <label>
                        Érvényesség vége
                        <input
                          type="date"
                          className="input"
                          value={couponForm.valid_until}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "valid_until",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={couponForm.is_active}
                          onChange={(e) =>
                            handleCouponFormChange(
                              "is_active",
                              e.target.checked
                            )
                          }
                        />
                        Aktív kupon
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={couponSaving}
                      >
                        {couponSaving ? "Mentés…" : "Kupon mentése"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>Mentett kuponok</h2>
                </div>
                <div className="card-body">
                  {couponsLoading ? (
                    <p>Betöltés…</p>
                  ) : couponsError ? (
                    <p className="error-text">{couponsError}</p>
                  ) : coupons.length === 0 ? (
                    <p>Még nincs mentett kupon.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Kód</th>
                            <th>Leírás</th>
                            <th>Típus</th>
                            <th>Érték</th>
                            <th>Min. összeg</th>
                            <th>Max. kedvezmény</th>
                            <th>Érvényesség</th>
                            <th>Felhasználás</th>
                            <th>Aktív</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((c) => (
                            <tr key={c.id}>
                              <td>{c.code}</td>
                              <td>{c.description}</td>
                              <td>
                                {c.discount_type === "percent"
                                  ? "Százalékos"
                                  : "Fix összeg"}
                              </td>
                              <td>
                                {c.discount_value}
                                {c.discount_type === "percent" ? " %" : " Ft"}
                              </td>
                              <td>{c.min_order_total ?? "-"}</td>
                              <td>{c.max_discount_value ?? "-"}</td>
                              <td>
                                {c.valid_from || "-"} –{" "}
                                {c.valid_until || "-"}
                              </td>
                              <td>
                                {c.used_count} /{" "}
                                {c.usage_limit ?? "∞"}
                              </td>
                              <td>{c.is_active ? "Igen" : "Nem"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* ---------------------- RENDELÉSEK TAB --------------------- */}
          {activeTab === "orders" && (
            <section className="card">
              <div className="card-header">
                <h2>Online rendelések</h2>
              </div>
              <div className="card-body">
                {ordersLoading ? (
                  <p>Betöltés…</p>
                ) : ordersError ? (
                  <p className="error-text">{ordersError}</p>
                ) : orders.length === 0 ? (
                  <p>Jelenleg nincs rendelés.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Dátum</th>
                          <th>Vevő</th>
                          <th>Email</th>
                          <th>Telefon</th>
                          <th>Végösszeg (Ft)</th>
                          <th>Státusz</th>
                          <th>Fizetés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td>
                              {new Date(o.created_at).toLocaleString(
                                "hu-HU"
                              )}
                            </td>
                            <td>{o.customer_name}</td>
                            <td>{o.customer_email}</td>
                            <td>{o.customer_phone || "-"}</td>
                            <td>{o.total_gross}</td>
                            <td>
                              <select
                                className="input"
                                value={o.status}
                                onChange={(e) =>
                                  handleUpdateOrder(o.id, {
                                    status: e.target.value,
                                  })
                                }
                              >
                                <option value="new">
                                  Új
                                </option>
                                <option value="processing">
                                  Feldolgozás alatt
                                </option>
                                <option value="completed">
                                  Teljesítve
                                </option>
                                <option value="cancelled">
                                  Lemondva
                                </option>
                              </select>
                            </td>
                            <td>
                              <select
                                className="input"
                                value={o.payment_status}
                                onChange={(e) =>
                                  handleUpdateOrder(o.id, {
                                    payment_status: e.target.value,
                                  })
                                }
                              >
                                <option value="unpaid">
                                  Nincs fizetve
                                </option>
                                <option value="paid">
                                  Fizetve
                                </option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default WebshopAdmin;
export { WebshopAdmin };