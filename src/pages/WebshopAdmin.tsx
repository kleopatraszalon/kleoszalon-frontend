import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api"; // nálad már létező helper

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

export const WebshopAdmin: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(
    null
  );

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
  const [couponFormError, setCouponFormError] = useState<string | null>(null);

  // ===== Termékek betöltése =====

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = (await apiFetch(
        "/api/admin/webshop/products"
      )) as Response;
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setProductsError("Nem sikerült betölteni a webshop termékeket.");
    } finally {
      setProductsLoading(false);
    }
  };

  // ===== Kuponok betöltése =====

  const loadCoupons = async () => {
    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const res = (await apiFetch(
        "/api/admin/webshop/coupons"
      )) as Response;
      const data = await res.json();
      setCoupons(data);
    } catch (err: any) {
      console.error(err);
      setCouponsError("Nem sikerült betölteni a kuponokat.");
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCoupons();
  }, []);

  // ===== Termék módosítás (lokálisan) =====

  const handleProductChange = <K extends keyof Product>(
    id: string,
    field: K,
    value: Product[K]
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveProduct = async (product: Product) => {
    setSavingProductId(product.id);
    try {
      await apiFetch(`/api/admin/webshop/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      console.error(err);
      alert("Nem sikerült elmenteni a terméket.");
    } finally {
      setSavingProductId(null);
    }
  };

  // ===== Termékkép feltöltés =====

  const handleUploadImage = async (productId: string, file: File | null) => {
    if (!file) return;

    setUploadingProductId(productId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = (await apiFetch(
        `/api/admin/webshop/products/${productId}/image`,
        {
          method: "POST",
          body: formData,
        }
      )) as Response;

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, image_url: data.image_url || p.image_url }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Nem sikerült feltölteni a képet.");
    } finally {
      setUploadingProductId(null);
    }
  };

  // ===== Kupon űrlap kezelése =====

  const handleCouponFormChange = (
    field: keyof CouponForm,
    value: string | boolean
  ) => {
    setCouponForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormError(null);
    setCouponMessage(null);
    setCouponSaving(true);

    try {
      if (!couponForm.code || !couponForm.discount_value) {
        throw new Error("Kuponkód és kedvezmény értéke kötelező.");
      }

      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description || null,
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value.replace(",", ".")),
        min_order_total: couponForm.min_order_total
          ? parseFloat(couponForm.min_order_total.replace(",", "."))
          : 0,
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

      const res = (await apiFetch("/api/admin/webshop/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })) as Response;

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Nem sikerült létrehozni a kupont.");
      }

      setCouponMessage("A kupon sikeresen létrejött.");
      setCouponForm({
        code: "",
        description: "",
        discount_type: couponForm.discount_type,
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
      console.error(err);
      setCouponFormError(
        err.message || "Ismeretlen hiba a kupon mentése közben."
      );
    } finally {
      setCouponSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Webshop admin</h1>
        <p className="page-subtitle">
          Webshop termékek, kuponok és képek kezelése.
        </p>
      </div>

      {/* TERMÉKEK */}
      <section className="card">
        <div className="card-header">
          <h2>Webshop termékek</h2>
        </div>

        {productsLoading && <p>Termékek betöltése…</p>}
        {productsError && <p className="text-error">{productsError}</p>}

        {!productsLoading && !productsError && (
          <div className="table-wrapper">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Kép</th>
                  <th>Név</th>
                  <th>Ár (bruttó)</th>
                  <th>Akciós ár</th>
                  <th>Web látható</th>
                  <th>Retail</th>
                  <th>Sorrend</th>
                  <th>Leírás</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="webshop-admin-image-cell">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="webshop-admin-image-thumb"
                          />
                        ) : (
                          <span className="text-muted">Nincs kép</span>
                        )}
                        <label className="btn btn-xs">
                          {uploadingProductId === p.id
                            ? "Feltöltés…"
                            : "Kép feltöltése"}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              handleUploadImage(
                                p.id,
                                e.target.files?.[0] ?? null
                              )
                            }
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input-xs"
                        value={p.name}
                        onChange={(e) =>
                          handleProductChange(p.id, "name", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-xs"
                        value={p.retail_price_gross ?? ""}
                        onChange={(e) =>
                          handleProductChange(
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
                        className="input input-xs"
                        value={p.sale_price ?? ""}
                        onChange={(e) =>
                          handleProductChange(
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
                        checked={!!p.web_is_visible}
                        onChange={(e) =>
                          handleProductChange(
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
                        checked={!!p.is_retail}
                        onChange={(e) =>
                          handleProductChange(
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
                        className="input input-xs"
                        value={p.web_sort_order ?? ""}
                        onChange={(e) =>
                          handleProductChange(
                            p.id,
                            "web_sort_order",
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <textarea
                        className="input input-xs"
                        rows={2}
                        value={p.web_description ?? ""}
                        onChange={(e) =>
                          handleProductChange(
                            p.id,
                            "web_description",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleSaveProduct(p)}
                        disabled={savingProductId === p.id}
                      >
                        {savingProductId === p.id ? "Mentés…" : "Mentés"}
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-muted">
                      Nincs megjeleníthető termék.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* KUPONOK */}
      <section className="card">
        <div className="card-header">
          <h2>Kuponok</h2>
        </div>

        <div className="card-body">
          <form className="form-grid" onSubmit={handleCreateCoupon}>
            <div className="form-row">
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
                Kedvezmény típusa
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
                  <option value="percent">Százalék (%)</option>
                  <option value="fixed">Fix összeg (Ft)</option>
                </select>
              </label>
              <label>
                Kedvezmény értéke*
                <input
                  type="number"
                  step="0.01"
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
            </div>

            <div className="form-row">
              <label>
                Minimum rendelés (Ft)
                <input
                  type="number"
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
              <label>
                Max. kedvezmény (Ft)
                <input
                  type="number"
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
                  type="number"
                  className="input"
                  value={couponForm.usage_limit}
                  onChange={(e) =>
                    handleCouponFormChange("usage_limit", e.target.value)
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Érvényesség kezdete
                <input
                  type="date"
                  className="input"
                  value={couponForm.valid_from}
                  onChange={(e) =>
                    handleCouponFormChange("valid_from", e.target.value)
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
                    handleCouponFormChange("valid_until", e.target.value)
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={couponForm.is_active}
                  onChange={(e) =>
                    handleCouponFormChange("is_active", e.target.checked)
                  }
                />
                Aktív kupon
              </label>
            </div>

            <div className="form-row">
              <label>
                Leírás
                <textarea
                  className="input"
                  rows={2}
                  value={couponForm.description}
                  onChange={(e) =>
                    handleCouponFormChange("description", e.target.value)
                  }
                />
              </label>
            </div>

            {couponFormError && (
              <p className="text-error">{couponFormError}</p>
            )}
            {couponMessage && (
              <p className="text-success">{couponMessage}</p>
            )}

            <div className="form-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={couponSaving}
              >
                {couponSaving ? "Mentés…" : "Kupon létrehozása"}
              </button>
            </div>
          </form>
        </div>

        <div className="card-body">
          <h3>Meglévő kuponok</h3>

          {couponsLoading && <p>Kuponok betöltése…</p>}
          {couponsError && <p className="text-error">{couponsError}</p>}

          {!couponsLoading && !couponsError && (
            <div className="table-wrapper">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Kód</th>
                    <th>Leírás</th>
                    <th>Típus</th>
                    <th>Érték</th>
                    <th>Min. rendelés</th>
                    <th>Max. kedvezmény</th>
                    <th>Felhaszn./limit</th>
                    <th>Érvényesség</th>
                    <th>Aktív</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td>{c.description}</td>
                      <td>{c.discount_type}</td>
                      <td>
                        {c.discount_value}
                        {c.discount_type === "percent" ? " %" : " Ft"}
                      </td>
                      <td>{c.min_order_total ?? "-"}</td>
                      <td>{c.max_discount_value ?? "-"}</td>
                      <td>
                        {c.used_count} /{" "}
                        {c.usage_limit != null ? c.usage_limit : "∞"}
                      </td>
                      <td>
                        {c.valid_from || "-"} – {c.valid_until || "-"}
                      </td>
                      <td>{c.is_active ? "Igen" : "Nem"}</td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-muted">
                        Nincs még kupon rögzítve.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
