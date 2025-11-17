import React, { useState } from "react";
import Modal from "react-modal";
import withBase from "../utils/apiBase";

type UUID = string;

export type Product = {
  id: UUID | string;
  name: string;
  internal_code?: string | null;
  barcode?: string | null;
  brand?: string | null;
  line_name?: string | null;
  product_group_id?: UUID | null;
  product_category_id?: UUID | null;
  purchase_price_net?: number | null;
  retail_price_gross?: number | null;
  vat_rate?: number | null;
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

export type ProductGroup = {
  id: UUID | string;
  name: string;
  code?: string | null;
};

export type ProductCategory = {
  id: UUID | string;
  name: string;
  code?: string | null;
  product_group_id?: UUID | null;
};

interface ProductNewModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onProductCreated?: (p: Product | null) => void;
  groups: ProductGroup[];
  categories: ProductCategory[];
}

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
/*                       ÚJ TERMÉK FELVÉTELE MODAL                     */
/* =================================================================== */

const ProductNewModal: React.FC<ProductNewModalProps> = ({
  isOpen,
  onRequestClose,
  onProductCreated,
  groups,
  categories,
}) => {
  const [name, setName] = useState("");
  const [internalCode, setInternalCode] =
    useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [lineName, setLineName] = useState("");

  const [groupId, setGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [purchasePrice, setPurchasePrice] =
    useState("");
  const [retailPrice, setRetailPrice] =
    useState("");
  const [vatRate, setVatRate] = useState("27");

  const [sizeLabel, setSizeLabel] = useState("");
  const [colorText, setColorText] = useState("");
  const [targetGender, setTargetGender] =
    useState("");

  const [active, setActive] = useState(true);
  const [isMerch, setIsMerch] = useState(false);
  const [isServiceMat, setIsServiceMat] =
    useState(false);
  const [isCleaning, setIsCleaning] =
    useState(false);
  const [isHosp, setIsHosp] = useState(false);
  const [isRetail, setIsRetail] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] =
    useState("");

  const resetForm = () => {
    setName("");
    setInternalCode("");
    setBarcode("");
    setBrand("");
    setLineName("");
    setGroupId("");
    setCategoryId("");
    setPurchasePrice("");
    setRetailPrice("");
    setVatRate("27");
    setSizeLabel("");
    setColorText("");
    setTargetGender("");
    setActive(true);
    setIsMerch(false);
    setIsServiceMat(false);
    setIsCleaning(false);
    setIsHosp(false);
    setIsRetail(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("A termék neve kötelező.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        internal_code: internalCode.trim() || null,
        barcode: barcode.trim() || null,
        brand: brand.trim() || null,
        line_name: lineName.trim() || null,
        product_group_id: groupId || null,
        product_category_id: categoryId || null,
        purchase_price_net: purchasePrice
          ? Number(purchasePrice)
          : null,
        retail_price_gross: retailPrice
          ? Number(retailPrice)
          : null,
        vat_rate: vatRate
          ? Number(vatRate)
          : null,
        size_label: sizeLabel.trim() || null,
        color_text: colorText.trim() || null,
        target_gender: targetGender.trim() || null,
        is_active: active,
        is_merchandise: isMerch,
        is_service_material: isServiceMat,
        is_cleaning: isCleaning,
        is_hospitality: isHosp,
        is_retail: isRetail,
      };

      const res = await fetch(withBase("products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJson<Product | any>(
        res,
        {} as any
      );

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Nem sikerült létrehozni az új terméket."
        );
      }

      setSuccessMsg("Új termék elmentve.");
      onProductCreated?.(data as Product);
      resetForm();
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Hiba történt a mentés közben."
      );
      onProductCreated?.(null);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) =>
      !groupId ||
      !c.product_group_id ||
      String(c.product_group_id) === groupId
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        resetForm();
        onRequestClose();
      }}
      contentLabel="Új termék felvétele"
      style={{
        overlay: {
          backgroundColor: "rgba(18,12,8,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
        },
        content: {
          inset: "40px auto auto",
          maxWidth: "1200px",
          width: "calc(100% - 80px)",
          margin: "0 auto",
          border: "none",
          background: "transparent",
          padding: 0,
          overflow: "visible",
        },
      }}
    >
      <div className="bg-white/98 text-[#120c08] border border-[#d5c4a4] rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] overflow-visible">
        {/* Felső gombsor */}
        <div className="flex items-center justify-end gap-2 p-3 border-b border-[#e3d8c3] bg-gradient-to-r from-[#fffaf5] via-[#f9f0e4] to-[#fffaf5]">
          <button
            onClick={() => {
              resetForm();
              onRequestClose();
            }}
            className="px-3 py-2 text-xs font-medium rounded-full border border-[#d5c4a4] text-[#5d5a55] bg-white/80 hover:bg-white"
          >
            Bezár
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-3 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#b69861] to-[#ec008c] text-white shadow-md hover:shadow-lg hover:brightness-105 ${
              saving
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            {saving ? "Mentés…" : "Mentés"}
          </button>
        </div>

        {/* Fejléc */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 grid place-items-center overflow-hidden">
              <span className="text-gray-400 text-xs leading-tight text-center">
                Új
                <br />
                Termék
              </span>
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">
                Új termék felvétele
              </div>
              <div className="text-xs text-gray-500">
                Alapadatok, jelleg, árazás és
                kategória beállítása.
              </div>
            </div>
          </div>
        </div>

        {/* Tartalom */}
        <div className="px-4 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alapadatok */}
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold">
                Alapadatok
              </div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Név *
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="pl. Aurora Pro hajfesték 6.1…"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Belső kód
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={internalCode}
                  onChange={(e) =>
                    setInternalCode(
                      e.target.value
                    )
                  }
                  placeholder="pl. COS-HC-061"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Vonalkód
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={barcode}
                  onChange={(e) =>
                    setBarcode(e.target.value)
                  }
                  placeholder="pl. EAN kód"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Márka
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="pl. Kleopatra, Aurora Pro…"
                />
              </label>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Termékvonal
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={lineName}
                  onChange={(e) =>
                    setLineName(e.target.value)
                  }
                  placeholder="pl. Cream Color, Spa…"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Termékcsoport
                  </span>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={groupId}
                    onChange={(e) =>
                      setGroupId(e.target.value)
                    }
                  >
                    <option value="">
                      — Nincs beállítva —
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
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      — Nincs kategória —
                    </option>
                    {filteredCategories.map((c) => (
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
                    value={sizeLabel}
                    onChange={(e) =>
                      setSizeLabel(
                        e.target.value
                      )
                    }
                    placeholder="pl. 60ml, 1kg, S, M…"
                  />
                </label>

                <label className="text-xs block">
                  <span className="text-gray-500 block mb-1">
                    Szín / árnyalat
                  </span>
                  <input
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={colorText}
                    onChange={(e) =>
                      setColorText(
                        e.target.value
                      )
                    }
                    placeholder="pl. hamvas szőke, fekete…"
                  />
                </label>
              </div>

              <label className="text-xs block">
                <span className="text-gray-500 block mb-1">
                  Célcsoport
                </span>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={targetGender}
                  onChange={(e) =>
                    setTargetGender(
                      e.target.value
                    )
                  }
                  placeholder="pl. női / férfi / unisex"
                />
              </label>
            </section>

            {/* Árazás + flags */}
            <section className="bg-[#faf7f0] border border-[#e3d8c3] rounded-lg p-3 space-y-2">
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
                    value={purchasePrice}
                    onChange={(e) =>
                      setPurchasePrice(
                        e.target.value
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
                    value={retailPrice}
                    onChange={(e) =>
                      setRetailPrice(
                        e.target.value
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
                  value={vatRate}
                  onChange={(e) =>
                    setVatRate(e.target.value)
                  }
                />
              </label>

              <div className="text-sm font-semibold mt-3">
                Jelleg / flags
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    setActive(e.target.checked)
                  }
                />
                Aktív
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isMerch}
                  onChange={(e) =>
                    setIsMerch(e.target.checked)
                  }
                />
                Forgalmazott termék (merch /
                retail)
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isServiceMat}
                  onChange={(e) =>
                    setIsServiceMat(
                      e.target.checked
                    )
                  }
                />
                Szolgáltatás anyag (fogyóanyag)
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isCleaning}
                  onChange={(e) =>
                    setIsCleaning(
                      e.target.checked
                    )
                  }
                />
                Tisztítószer / higiénia
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isHosp}
                  onChange={(e) =>
                    setIsHosp(e.target.checked)
                  }
                />
                Vendéglátás (ital / snack)
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isRetail}
                  onChange={(e) =>
                    setIsRetail(
                      e.target.checked
                    )
                  }
                />
                Pénztárnál értékesíthető
              </label>
            </section>
          </div>

          {/* Üzenetek */}
          {errorMsg && (
            <div className="mt-3 text-xs text-red-600">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-3 text-xs text-emerald-600">
              {successMsg}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductNewModal;
