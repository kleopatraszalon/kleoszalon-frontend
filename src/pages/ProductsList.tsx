import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import withBase from "../utils/apiBase";
import Modal from "react-modal";
import ProductNewModal from "../components/ProductNewModal";

Modal.setAppElement("#root");

type UUID = string;

type Product = {
  id: string | number;
  name: string;
  internal_code?: string | null;
  barcode?: string | null;
  brand?: string | null;
  line_name?: string | null;

  product_group_id?: UUID | null;
  product_group_name?: string | null;
  product_category_id?: UUID | null;
  product_category_name?: string | null;

  base_unit_symbol?: string | null;
  package_size?: number | null;

  vat_rate?: number | null;
  purchase_price_net?: number | null;
  retail_price_gross?: number | null;

  is_active?: boolean | null;
  is_service_material?: boolean | null;
  is_retail?: boolean | null;
  is_cleaning?: boolean | null;
  is_hospitality?: boolean | null;
  is_merchandise?: boolean | null;

  size_label?: string | null;
  color_text?: string | null;
  target_gender?: string | null;
};

type ProductGroup = {
  id: UUID | string;
  name: string;
  code?: string | null;
};

type ProductCategory = {
  id: UUID | string;
  product_group_id?: UUID | null;
  group_name?: string | null;
  name: string;
  code?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type ApiError = { error?: string; message?: string };

const getToken = () =>
  localStorage.getItem("kleo_token") ||
  localStorage.getItem("token") ||
  "";

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const safeParse = <T,>(txt: string, fallback: T): T => {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
};

async function parseJson<T>(
  res: Response,
  fallback: T
): Promise<T> {
  const txt = await res.text();
  if (!txt) return fallback;
  return safeParse<T>(txt, fallback);
}

/* =================================================================== */
/*                           TERMÉK ADMIN OLDAL                        */
/* =================================================================== */

const ProductsList: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [onlyMerch, setOnlyMerch] = useState(false);
  const [onlyServiceMaterials, setOnlyServiceMaterials] =
    useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [categories, setCategories] = useState<
    ProductCategory[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<
    string | null
  >(null);

  // Kategória admin
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  // CSV import
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  /* ---------- Segédfüggvények ---------- */

  const loadGroupsAndCategories = async () => {
    try {
      const headers = authHeaders();
      const [grpRes, catRes] = await Promise.all([
        fetch(withBase("product-groups"), { headers }),
        fetch(withBase("product-categories"), { headers }),
      ]);

      const grpData = await parseJson<ProductGroup[]>(
        grpRes,
        []
      );
      const catData =
        await parseJson<ProductCategory[]>(
          catRes,
          []
        );

      setGroups(Array.isArray(grpData) ? grpData : []);
      setCategories(
        Array.isArray(catData) ? catData : []
      );
    } catch (e) {
      console.error(
        "Termékcsoportok / kategóriák betöltése hiba:",
        e
      );
    }
  };

  const loadProducts = async () => {
    const token = getToken();

    if (!token) {
      setAuthError(
        "Nincs token – jelentkezz be először a termékek megtekintéséhez."
      );
      setAllProducts([]);
      return;
    }

    const path = includeInactive
      ? "products?include_inactive=1"
      : "products";

    try {
      setLoading(true);
      setAuthError("");

      const res = await fetch(withBase(path), {
        headers: authHeaders(),
      });

      if (res.status === 401 || res.status === 403) {
        setAuthError(
          "Nincs jogosultság vagy lejárt a bejelentkezés."
        );
        setAllProducts([]);
        return;
      }

      const data = await parseJson<unknown>(res, []);
      if (!res.ok) {
        throw new Error(
          `HTTP hiba! státusz: ${res.status}`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "Nem tömb érkezett a /products végpontról."
        );
      }

      setAllProducts(data as Product[]);
    } catch (e) {
      console.error("Termékek betöltése hiba:", e);
      setAuthError(
        "Termékek betöltése nem sikerült. Ellenőrizd a hálózatot vagy a szervert."
      );
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupsAndCategories();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  /* ---------- Szűrt lista ---------- */

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return allProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const code = (p.internal_code || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const groupName = (
        p.product_group_name || ""
      ).toLowerCase();
      const catName = (
        p.product_category_name || ""
      ).toLowerCase();

      const price = p.retail_price_gross ?? 0;

      if (
        s &&
        !name.includes(s) &&
        !code.includes(s) &&
        !brand.includes(s) &&
        !groupName.includes(s) &&
        !catName.includes(s)
      ) {
        return false;
      }

      if (
        filterGroupId &&
        String(p.product_group_id || "") !==
          filterGroupId
      ) {
        return false;
      }

      if (
        filterCategoryId &&
        String(p.product_category_id || "") !==
          filterCategoryId
      ) {
        return false;
      }

      if (onlyMerch && !p.is_merchandise) {
        return false;
      }

      if (
        onlyServiceMaterials &&
        !p.is_service_material
      ) {
        return false;
      }

      if (minPrice && price < Number(minPrice)) {
        return false;
      }

      if (maxPrice && price > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [
    allProducts,
    search,
    filterGroupId,
    filterCategoryId,
    onlyMerch,
    onlyServiceMaterials,
    minPrice,
    maxPrice,
  ]);

  /* ---------- Sor kattintás: szerkesztés ---------- */

  const handleRowClick = (p: Product) => {
    setEditingProductId(String(p.id));
  };

  /* ---------- Export CSV ---------- */

  const exportCsv = () => {
    const rows = [
      [
        "id",
        "name",
        "internal_code",
        "barcode",
        "brand",
        "line_name",
        "group",
        "category",
        "retail_price_gross",
        "purchase_price_net",
        "vat_rate",
        "is_active",
        "is_merchandise",
        "is_service_material",
      ],
      ...filtered.map((p) => [
        String(p.id ?? ""),
        p.name ?? "",
        p.internal_code ?? "",
        p.barcode ?? "",
        p.brand ?? "",
        p.line_name ?? "",
        p.product_group_name ?? "",
        p.product_category_name ?? "",
        p.retail_price_gross != null
          ? String(p.retail_price_gross)
          : "",
        p.purchase_price_net != null
          ? String(p.purchase_price_net)
          : "",
        p.vat_rate != null ? String(p.vat_rate) : "",
        p.is_active ? "1" : "0",
        p.is_merchandise ? "1" : "0",
        p.is_service_material ? "1" : "0",
      ]),
    ];

    const csv = rows
      .map((r) =>
        r
          .map((v) => {
            const needQuote =
              v.includes(";") ||
              v.includes('"') ||
              v.includes("\n");
            let w = v.replace(/"/g, '""');
            return needQuote ? `"${w}"` : w;
          })
          .join(";")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Import CSV (egyszerű) ---------- */

  const handleCsvImport = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result || "");
        const lines = text
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          throw new Error(
            "A CSV fájl üres vagy csak fejlécet tartalmaz."
          );
        }

        // első sor: fejléc
        const header = lines[0]
          .split(";")
          .map((h) => h.trim().toLowerCase());

        const idxName = header.indexOf("name");
        if (idxName === -1) {
          throw new Error(
            'A "name" oszlop kötelező a CSV-ben.'
          );
        }

        const idxCode =
          header.indexOf("internal_code");
        const idxBarcode =
          header.indexOf("barcode");
        const idxBrand =
          header.indexOf("brand");
        const idxCategory =
          header.indexOf("category");
        const idxGroup = header.indexOf("group");
        const idxRetail =
          header.indexOf("retail_price_gross");

        const items: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";");
          const get = (idx: number) =>
            idx >= 0 && idx < cols.length
              ? cols[idx].trim()
              : "";

          const name = get(idxName);
          if (!name) continue;

          const code = idxCode >= 0 ? get(idxCode) : "";
          const barcode =
            idxBarcode >= 0 ? get(idxBarcode) : "";
          const brand =
            idxBrand >= 0 ? get(idxBrand) : "";
          const groupName =
            idxGroup >= 0 ? get(idxGroup) : "";
          const categoryName =
            idxCategory >= 0 ? get(idxCategory) : "";
          const retailStr =
            idxRetail >= 0 ? get(idxRetail) : "";

          const retail = retailStr
            ? Number(retailStr.replace(",", "."))
            : null;

          // minimális payload
          items.push({
            name,
            internal_code: code || null,
            barcode: barcode || null,
            brand: brand || null,
            product_group_name: groupName || null,
            product_category_name:
              categoryName || null,
            retail_price_gross: retail,
          });
        }

        if (items.length === 0) {
          throw new Error(
            "Nem találtam importálható sort."
          );
        }

        // Feltételezünk egy bulk-import végpontot
        const res = await fetch(
          withBase("products/bulk-import"),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...authHeaders(),
            },
            body: JSON.stringify({ items }),
          }
        );

        const data = await parseJson<any>(
          res,
          {}
        );

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "Nem sikerült az import."
          );
        }

        setImportMsg(
          `Sikeres import: ${items.length} sor elküldve.`
        );
        loadProducts();
      } catch (err: any) {
        setImportMsg(
          err?.message ||
            "Hiba történt az import során."
        );
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  };

  /* ---------- Kategória szerkesztés / új ---------- */

  const startNewCategory = () => {
    setEditingCategory({
      id: "",
      name: "",
      code: "",
      product_group_id: groups[0]
        ? (groups[0].id as string)
        : undefined,
      sort_order: 100,
      is_active: true,
    });
    setCategoryError("");
    setCategorySuccess("");
  };

  const startEditCategory = (cat: ProductCategory) => {
    setEditingCategory({
      ...cat,
      id: cat.id,
    });
    setCategoryError("");
    setCategorySuccess("");
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    if (!editingCategory.name?.trim()) {
      setCategoryError("A kategória neve kötelező.");
      return;
    }
    if (!editingCategory.product_group_id) {
      setCategoryError(
        "Válassz termékcsoportot a kategóriához."
      );
      return;
    }

    try {
      setSavingCategory(true);
      setCategoryError("");
      setCategorySuccess("");

      const payload: any = {
        name: editingCategory.name.trim(),
        code:
          editingCategory.code?.trim() ||
          null,
        product_group_id:
          editingCategory.product_group_id,
        sort_order:
          editingCategory.sort_order ?? 100,
        is_active:
          editingCategory.is_active ?? true,
      };

      const isNew =
        !editingCategory.id ||
        String(editingCategory.id).length === 0;

      const url = isNew
        ? withBase("product-categories")
        : withBase(
            `product-categories/${editingCategory.id}`
          );
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data =
        await parseJson<ProductCategory | any>(
          res,
          {} as any
        );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Nem sikerült menteni a kategóriát."
        );
      }

      const saved = data as ProductCategory;

      setCategories((prev) => {
        const list = [...prev];
        const idx = list.findIndex(
          (c) =>
            String(c.id) === String(saved.id)
        );
        if (idx >= 0) {
          list[idx] = saved;
        } else {
          list.push(saved);
        }
        return list;
      });

      setCategorySuccess("Kategória elmentve.");
      setEditingCategory(null);
    } catch (e: any) {
      setCategoryError(
        e?.message ||
          "Hiba történt kategória mentésekor."
      );
    } finally {
      setSavingCategory(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar />

      <main className="calendar-container">
        {/* Fejléc */}
        <div className="employees-header">
          <div>
            <h2 className="employees-title">
              Termékek
            </h2>
            <p className="employees-subtitle">
              Termékek listája, keresés, árazás, készlet
              szempontok, kategóriák és import/export.
            </p>
            {authError && (
              <div className="employees-error">
                {authError}
              </div>
            )}
          </div>

          <div className="employees-header-buttons">
            <button
              type="button"
              className="employees-primary-btn"
              onClick={() => setShowNewModal(true)}
            >
              + Új termék
            </button>

            <button
              type="button"
              className="employees-secondary-btn"
              onClick={exportCsv}
            >
              CSV export
            </button>

            <label className="employees-secondary-btn cursor-pointer">
              {importing
                ? "CSV import…"
                : "CSV import"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvImport}
              />
            </label>

            <button
              type="button"
              className={
                "employees-secondary-btn" +
                (includeInactive
                  ? " employees-secondary-btn--active"
                  : "")
              }
              onClick={() =>
                setIncludeInactive((prev) => !prev)
              }
            >
              {includeInactive
                ? "Csak aktív termékek"
                : "Inaktívak is"}
            </button>
          </div>
        </div>

        {/* Szűrők */}
        <div className="employees-filters">
          <div className="employees-filters-row">
            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Keresés név / kód / márka
              </label>
              <input
                className="employees-filter-input"
                placeholder="pl. hajfesték, szérum, póló…"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Termékcsoport
              </label>
              <select
                className="employees-filter-input"
                value={filterGroupId}
                onChange={(e) =>
                  setFilterGroupId(e.target.value)
                }
              >
                <option value="">
                  Összes csoport
                </option>
                {groups.map((g) => (
                  <option
                    key={String(g.id)}
                    value={String(g.id)}
                  >
                    {g.name}
                    {g.code ? ` (${g.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Kategória
              </label>
              <select
                className="employees-filter-input"
                value={filterCategoryId}
                onChange={(e) =>
                  setFilterCategoryId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Összes kategória
                </option>
                {categories.map((c) => (
                  <option
                    key={String(c.id)}
                    value={String(c.id)}
                  >
                    {c.name}
                    {c.code ? ` (${c.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Min. fogy. ár (Ft)
              </label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Max. fogy. ár (Ft)
              </label>
              <input
                type="number"
                min={0}
                className="employees-filter-input"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
              />
            </div>

            <div className="employees-filter-field">
              <label className="employees-filter-label">
                Szűrők
              </label>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={onlyMerch}
                    onChange={(e) =>
                      setOnlyMerch(
                        e.target.checked
                      )
                    }
                  />
                  Csak forgalmazott termék
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={
                      onlyServiceMaterials
                    }
                    onChange={(e) =>
                      setOnlyServiceMaterials(
                        e.target.checked
                      )
                    }
                  />
                  Csak szolg. anyag
                </label>
              </div>
            </div>

            <div className="employees-filter-summary">
              {filtered.length} találat
            </div>
          </div>

          {importMsg && (
            <div className="employees-error">
              {importMsg}
            </div>
          )}
        </div>

        {/* Termék lista */}
        {loading ? (
          <div className="employees-loading">
            Termékek betöltése…
          </div>
        ) : (
          <div className="employees-list-card">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Név</th>
                  <th>Kód</th>
                  <th>Márka / vonal</th>
                  <th>Csoport</th>
                  <th>Kategória</th>
                  <th>Fogy. ár (Ft)</th>
                  <th>Besz. ár (Ft)</th>
                  <th>ÁFA %</th>
                  <th>Flags</th>
                  <th>Aktív?</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={String(p.id)}
                    className="employees-row"
                    onClick={() =>
                      handleRowClick(p)
                    }
                  >
                    <td>
                      <span className="employees-name-link">
                        {p.name}
                      </span>
                    </td>
                    <td>{p.internal_code || "—"}</td>
                    <td>
                      {p.brand || "—"}
                      {p.line_name
                        ? ` / ${p.line_name}`
                        : ""}
                    </td>
                    <td>
                      {p.product_group_name || "—"}
                    </td>
                    <td>
                      {p.product_category_name ||
                        "—"}
                    </td>
                    <td>
                      {p.retail_price_gross != null
                        ? `${p.retail_price_gross.toLocaleString()} Ft`
                        : "—"}
                    </td>
                    <td>
                      {p.purchase_price_net != null
                        ? `${p.purchase_price_net.toLocaleString()} Ft`
                        : "—"}
                    </td>
                    <td>
                      {p.vat_rate != null
                        ? `${p.vat_rate}%`
                        : "—"}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {p.is_merchandise && (
                          <span className="employees-badge employees-badge--active">
                            merch
                          </span>
                        )}
                        {p.is_service_material && (
                          <span className="employees-badge employees-badge--active">
                            anyag
                          </span>
                        )}
                        {p.is_cleaning && (
                          <span className="employees-badge employees-badge--inactive">
                            tisztító
                          </span>
                        )}
                        {p.is_hospitality && (
                          <span className="employees-badge employees-badge--inactive">
                            vendéglátás
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {p.is_active ? (
                        <span className="employees-badge employees-badge--active">
                          aktív
                        </span>
                      ) : (
                        <span className="employees-badge employees-badge--inactive">
                          inaktív
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="employees-loading"
                    >
                      Nincs találat a megadott
                      szűrőkre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Kategória admin blokk */}
        <section className="employees-list-card mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">
                Termékkategóriák
              </h3>
              <p className="text-xs text-gray-600">
                Főkategóriák és alkategóriák
                karbantartása.
              </p>
            </div>
            <button
              type="button"
              className="employees-secondary-btn"
              onClick={startNewCategory}
            >
              + Új kategória
            </button>
          </div>

          <table className="employees-table">
            <thead>
              <tr>
                <th>Név</th>
                <th>Kód</th>
                <th>Termékcsoport</th>
                <th>Sorrend</th>
                <th>Aktív?</th>
                <th>Művelet</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .slice()
                .sort(
                  (a, b) =>
                    (a.sort_order ?? 0) -
                    (b.sort_order ?? 0)
                )
                .map((c) => (
                  <tr key={String(c.id)}>
                    <td>{c.name}</td>
                    <td>{c.code || "—"}</td>
                    <td>{c.group_name || "—"}</td>
                    <td>{c.sort_order ?? "—"}</td>
                    <td>
                      {c.is_active ? (
                        <span className="employees-badge employees-badge--active">
                          aktív
                        </span>
                      ) : (
                        <span className="employees-badge employees-badge--inactive">
                          inaktív
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="employees-link-btn"
                        onClick={() =>
                          startEditCategory(c)
                        }
                      >
                        Szerkesztés
                      </button>
                    </td>
                  </tr>
                ))}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="employees-loading"
                  >
                    Nincs még kategória rögzítve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {categoryError && (
            <div className="mt-2 text-xs text-red-600">
              {categoryError}
            </div>
          )}
          {categorySuccess && (
            <div className="mt-2 text-xs text-emerald-600">
              {categorySuccess}
            </div>
          )}
        </section>

        {/* Új termék modal */}
        <ProductNewModal
          isOpen={showNewModal}
          groups={groups}
          categories={categories}
          onRequestClose={() =>
            setShowNewModal(false)
          }
          onProductCreated={(newProd) => {
            setShowNewModal(false);
            if (newProd) {
              setAllProducts((prev) => [
                newProd as unknown as Product,
                ...prev,
              ]);
            } else {
              loadProducts();
            }
          }}
        />

        {/* Termék szerkesztő modal */}
        <ProductEditModal
          isOpen={!!editingProductId}
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSaved={(updated) => {
            setAllProducts((prev) =>
              prev.map((p) =>
                String(p.id) ===
                String(updated.id)
                  ? updated
                  : p
              )
            );
            setEditingProductId(null);
          }}
          groups={groups}
          categories={categories}
        />

        {/* Kategória szerkesztő modal */}
        <Modal
          isOpen={!!editingCategory}
          onRequestClose={() =>
            setEditingCategory(null)
          }
          contentLabel="Kategória szerkesztése"
          style={{
            overlay: {
              backgroundColor:
                "rgba(0,0,0,0.5)",
              zIndex: 9999,
            },
            content: {
              inset: "40px auto auto",
              maxWidth: "500px",
              width: "calc(100% - 80px)",
              margin: "0 auto",
              border: "none",
              background: "transparent",
              padding: 0,
              overflow: "visible",
            },
          }}
        >
          {editingCategory && (
            <div className="bg-white text-gray-800 border border-gray-200 rounded-xl shadow-xl overflow-visible">
              <div className="flex items-center justify-end gap-2 p-3 border-b border-gray-200">
                <button
                  onClick={() =>
                    setEditingCategory(null)
                  }
                  className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
                >
                  Bezár
                </button>
                <button
                  onClick={saveCategory}
                  disabled={savingCategory}
                  className={`px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 ${
                    savingCategory
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {savingCategory
                    ? "Mentés…"
                    : "Mentés"}
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="text-sm font-semibold">
                  Kategória adatok
                </div>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Név
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={editingCategory.name || ""}
                    onChange={(e) =>
                      setEditingCategory(
                        (prev) =>
                          prev && {
                            ...prev,
                            name: e.target.value,
                          }
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Kód
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      editingCategory.code || ""
                    }
                    onChange={(e) =>
                      setEditingCategory(
                        (prev) =>
                          prev && {
                            ...prev,
                            code: e.target.value,
                          }
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Termékcsoport
                  </span>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      editingCategory.product_group_id
                        ? String(
                            editingCategory.product_group_id
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setEditingCategory(
                        (prev) =>
                          prev && {
                            ...prev,
                            product_group_id:
                              e.target
                                .value || null,
                          }
                      )
                    }
                  >
                    <option value="">
                      — Válassz termékcsoportot —
                    </option>
                    {groups.map((g) => (
                      <option
                        key={String(g.id)}
                        value={String(g.id)}
                      >
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Sorrend
                  </span>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      editingCategory.sort_order !=
                      null
                        ? String(
                            editingCategory.sort_order
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setEditingCategory(
                        (prev) =>
                          prev && {
                            ...prev,
                            sort_order: e.target
                              .value
                              ? Number(
                                  e.target.value
                                )
                              : null,
                          }
                      )
                    }
                  />
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      !!editingCategory.is_active
                    }
                    onChange={(e) =>
                      setEditingCategory(
                        (prev) =>
                          prev && {
                            ...prev,
                            is_active:
                              e.target.checked,
                          }
                      )
                    }
                  />
                  Aktív
                </label>

                {categoryError && (
                  <div className="mt-2 text-xs text-red-600">
                    {categoryError}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

/* =================================================================== */
/*                         TERMÉK SZERKESZTŐ MODAL                     */
/* =================================================================== */

type ProductEditModalProps = {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onSaved: (p: Product) => void;
  groups: ProductGroup[];
  categories: ProductCategory[];
};

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  productId,
  onClose,
  onSaved,
  groups,
  categories,
}) => {
  const [form, setForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const headers = authHeaders();

        const res = await fetch(
          withBase(`products/${productId}`),
          { headers }
        );

        if (!res.ok) {
          const d =
            await parseJson<ApiError>(res, {});
          throw new Error(
            d.error ||
              d.message ||
              "Nem sikerült betölteni a terméket."
          );
        }

        const prod =
          await parseJson<Product>(
            res,
            {} as Product
          );

        if (!cancelled) {
          setForm(prod);
          setDirty(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(
            e?.message ||
              "Hiba történt a termék betöltésekor."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);

  const onChange = <K extends keyof Product>(
    key: K,
    value: Product[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      setDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.name?.trim()) {
      setErrorMsg("A termék neve kötelező.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload: any = {
        ...form,
      };

      const res = await fetch(
        withBase(`products/${form.id}`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      const data =
        await parseJson<Product | ApiError>(
          res,
          {} as any
        );

      if (!res.ok) {
        throw new Error(
          (data as ApiError)?.error ||
            (data as ApiError)?.message ||
            "Nem sikerült menteni a terméket."
        );
      }

      const updated = data as Product;
      setForm(updated);
      setDirty(false);
      onSaved(updated);
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Hiba történt mentés közben."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Termék szerkesztése"
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 9999,
        },
        content: {
          inset: "40px auto auto",
          maxWidth: "1100px",
          width: "calc(100% - 80px)",
          margin: "0 auto",
          border: "none",
          background: "transparent",
          padding: 0,
          overflow: "visible",
        },
      }}
    >
      <div className="bg-white text-gray-800 border border-gray-200 rounded-xl shadow-xl overflow-visible">
        {/* Felső gombsor */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
          >
            Bezár
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form}
            className={`px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 ${
              saving
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>

        {loading || !form ? (
          <div className="p-4 employees-loading">
            Betöltés…
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Fejléc */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden">
                <span className="text-gray-400 text-xs leading-tight text-center">
                  Termék
                </span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {form.name}
                </div>
                <div className="text-xs text-gray-500">
                  {form.brand ||
                    "Termék szerkesztése"}
                </div>
              </div>
            </div>

            {/* Bal: alapadatok, jobb: árak + flag-ek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alapadatok */}
              <section className="bg-[#faf7f0] border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="text-sm font-semibold">
                  Alapadatok
                </div>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Név
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.name || ""}
                    onChange={(e) =>
                      onChange(
                        "name",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Belső kód
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.internal_code || ""
                    }
                    onChange={(e) =>
                      onChange(
                        "internal_code",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Vonalkód
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.barcode || ""}
                    onChange={(e) =>
                      onChange(
                        "barcode",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Márka
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.brand || ""}
                    onChange={(e) =>
                      onChange(
                        "brand",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Termékcsalád / vonal
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.line_name || ""
                    }
                    onChange={(e) =>
                      onChange(
                        "line_name",
                        e.target.value
                      )
                    }
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Termékcsoport
                    </span>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.product_group_id
                          ? String(
                              form.product_group_id
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "product_group_id",
                          e.target.value || null
                        )
                      }
                    >
                      <option value="">
                        — nincs beállítva —
                      </option>
                      {groups.map((g) => (
                        <option
                          key={String(g.id)}
                          value={String(g.id)}
                        >
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Kategória
                    </span>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.product_category_id
                          ? String(
                              form.product_category_id
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "product_category_id",
                          e.target.value || null
                        )
                      }
                    >
                      <option value="">
                        — nincs kategória —
                      </option>
                      {categories.map((c) => (
                        <option
                          key={String(c.id)}
                          value={String(c.id)}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Méret jelölés
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.size_label || ""
                      }
                      onChange={(e) =>
                        onChange(
                          "size_label",
                          e.target.value
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Szín / árnyalat
                    </span>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.color_text || ""
                      }
                      onChange={(e) =>
                        onChange(
                          "color_text",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Célcsoport
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.target_gender || ""
                    }
                    onChange={(e) =>
                      onChange(
                        "target_gender",
                        e.target.value
                      )
                    }
                    placeholder="pl. női / férfi / unisex"
                  />
                </label>
              </section>

              {/* Árak + flag-ek */}
              <section className="bg-[#faf7f0] border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="text-sm font-semibold">
                  Árazás
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Beszerzési ár netto (Ft)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.purchase_price_net !=
                        null
                          ? String(
                              form.purchase_price_net
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "purchase_price_net",
                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : null
                        )
                      }
                    />
                  </label>

                  <label className="text-xs block">
                    <span className="text-gray-500 block mb-1">
                      Fogyasztói ár bruttó (Ft)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={
                        form.retail_price_gross !=
                        null
                          ? String(
                              form
                                .retail_price_gross
                            )
                          : ""
                      }
                      onChange={(e) =>
                        onChange(
                          "retail_price_gross",
                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : null
                        )
                      }
                    />
                  </label>
                </div>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    ÁFA %
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={
                      form.vat_rate != null
                        ? String(
                            form.vat_rate
                          )
                        : ""
                    }
                    onChange={(e) =>
                      onChange(
                        "vat_rate",
                        e.target.value
                          ? Number(
                              e.target.value
                            )
                          : null
                      )
                    }
                  />
                </label>

                <div className="text-sm font-semibold mt-3">
                  Jelleg / flags
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.is_active}
                    onChange={(e) =>
                      onChange(
                        "is_active",
                        e.target.checked
                      )
                    }
                  />
                  Aktív
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      !!form.is_merchandise
                    }
                    onChange={(e) =>
                      onChange(
                        "is_merchandise",
                        e.target.checked
                      )
                    }
                  />
                  Forgalmazott termék (merch /
                  retail)
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      !!form.is_service_material
                    }
                    onChange={(e) =>
                      onChange(
                        "is_service_material",
                        e.target.checked
                      )
                    }
                  />
                  Szolgáltatás anyag (fogyóanyag)
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.is_cleaning}
                    onChange={(e) =>
                      onChange(
                        "is_cleaning",
                        e.target.checked
                      )
                    }
                  />
                  Tisztítószer / higiénia
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={
                      !!form.is_hospitality
                    }
                    onChange={(e) =>
                      onChange(
                        "is_hospitality",
                        e.target.checked
                      )
                    }
                  />
                  Vendéglátás (ital / édesség)
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!form.is_retail}
                    onChange={(e) =>
                      onChange(
                        "is_retail",
                        e.target.checked
                      )
                    }
                  />
                  Pénztárnál értékesíthető
                  vendégnek
                </label>
              </section>
            </div>

            {dirty && (
              <div className="mt-2 text-xs text-amber-700">
                Vannak el nem mentett
                módosítások.
              </div>
            )}
            {errorMsg && (
              <div className="mt-2 text-xs text-red-600">
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductsList;
