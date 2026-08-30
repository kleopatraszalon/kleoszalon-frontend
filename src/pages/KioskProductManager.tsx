import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, Camera, CheckCircle2, ImagePlus, Loader2, PackagePlus, Pencil, RefreshCw,
  Search, ShoppingBag, Sparkles, Star, ToggleLeft, ToggleRight, Trash2, X,
} from "lucide-react";
import api from "../api/api";
import {
  getKioskAdminLocations,
  getKioskAdminMenu,
  saveKioskItems,
  type KioskMenu,
  type KioskProduct,
  type KioskProductItem,
  type KioskProductSection,
} from "../api/kioskAdmin";
import "./KioskProductManager.css";

type ProductRecord = {
  section: KioskProductSection;
  item: KioskProductItem;
  product?: KioskProduct;
};

type Draft = {
  productId: string;
  sourceSectionId: string;
  sectionId: string;
  name: string;
  displayName: string;
  price: string;
  badgeText: string;
  imageUrl: string;
  enabled: boolean;
  featured: boolean;
  order: string;
};

const RECOMMENDED_GROUPS = ["Kávé", "Tea", "Üdítő", "Víz", "Csoki", "Snack", "Protein shake"];

function money(value: unknown) {
  return `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;
}

function blankDraft(sectionId = ""): Draft {
  return {
    productId: "",
    sourceSectionId: "",
    sectionId,
    name: "",
    displayName: "",
    price: "",
    badgeText: "",
    imageUrl: "",
    enabled: true,
    featured: false,
    order: "",
  };
}

function productDraft(record: ProductRecord): Draft {
  return {
    productId: record.item.productId,
    sourceSectionId: record.section.id,
    sectionId: record.section.id,
    name: record.product?.name || record.item.displayName || "",
    displayName: record.item.displayName || "",
    price: String(record.product?.price ?? ""),
    badgeText: record.item.badgeText || "",
    imageUrl: record.item.imageUrl || record.product?.image_url || "",
    enabled: Boolean(record.item.enabled),
    featured: Boolean(record.item.featured),
    order: String(record.item.order ?? 0),
  };
}

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("A kép nem olvasható."));
    };
    img.src = url;
  });
}

async function optimizeProductPhoto(file: File) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    throw new Error("JPG, PNG vagy WebP kép tölthető fel.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("A kép legfeljebb 12 MB lehet.");
  }

  const image = await readImage(file);
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("A kép feldolgozása nem támogatott ebben a böngészőben.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  while (dataUrl.length > 260_000 && quality > 0.46) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/webp", quality);
  }
  if (dataUrl.length > 360_000) {
    throw new Error("A kép tömörítés után is túl nagy. Kérlek kisebb fotót válassz.");
  }
  return dataUrl;
}

export default function KioskProductManager() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [menu, setMenu] = useState<KioskMenu | null>(null);
  const [sections, setSections] = useState<KioskProductSection[]>([]);
  const [products, setProducts] = useState<KioskProduct[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const locationData = await getKioskAdminLocations();
      const resolved = locationData.device?.location_id || locationData.locations.find((x) => x.is_device_location)?.id || locationData.locations[0]?.id || "";
      if (!resolved) throw new Error("Nem található a kiosk telephelye.");
      setLocationId(resolved);
      const data = await getKioskAdminMenu(resolved);
      setMenu(data.menu || null);
      setSections([...(data.productSections || [])].sort((a, b) => a.order - b.order));
      setProducts(data.products || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A termékadmin nem tölthető be.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const records = useMemo<ProductRecord[]>(() => {
    return sections.flatMap((section) => section.items.map((item) => ({ section, item, product: productMap.get(item.productId) })));
  }, [sections, productMap]);

  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("hu-HU");
    if (!needle) return records;
    return records.filter(({ product, item, section }) => `${product?.name || ""} ${item.displayName || ""} ${section.title} ${item.badgeText || ""}`.toLocaleLowerCase("hu-HU").includes(needle));
  }, [records, query]);

  const beginNew = () => {
    const first = sections.find((section) => section.enabled !== false) || sections[0];
    if (!first) {
      setError("Nincs termékcsoport. Előbb inicializáld a kiosk menüt.");
      return;
    }
    setError("");
    setNotice("");
    setDraft(blankDraft(first.id));
  };

  const beginEdit = (record: ProductRecord) => {
    setError("");
    setNotice("");
    setDraft(productDraft(record));
  };

  const changePhoto = async (file?: File) => {
    if (!file || !draft) return;
    setPhotoBusy(true);
    setError("");
    try {
      const imageUrl = await optimizeProductPhoto(file);
      setDraft((current) => current ? { ...current, imageUrl } : current);
      setNotice("A fotó előkészítve. A Mentés gombbal kerül a kioskba.");
    } catch (e: any) {
      setError(e?.message || "A kép feldolgozása sikertelen.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!draft || !menu?.id) return;
    const name = draft.name.trim();
    const targetSection = sections.find((section) => section.id === draft.sectionId);
    const price = Number(String(draft.price).replace(",", "."));
    if (!name) return setError("A termék neve kötelező.");
    if (!targetSection) return setError("Válassz termékcsoportot.");
    if (!Number.isFinite(price) || price < 0) return setError("Adj meg érvényes eladási árat.");

    setSaving(true);
    setError("");
    setNotice("");
    try {
      let productId = draft.productId;
      if (productId) {
        await api.patch(`/products/${productId}`, {
          name,
          retail_price_gross: price,
          is_active: true,
          is_retail: true,
          is_merchandise: true,
        });
      } else {
        const created = await api.post("/products", {
          name,
          retail_price_gross: price,
          vat_rate: 27,
          is_active: true,
          is_retail: true,
          is_merchandise: true,
          source_system: "kiosk_admin",
        });
        productId = String(created.data?.id || "");
        if (!productId) throw new Error("A létrehozott termék azonosítója hiányzik.");
      }

      const order = Number.isFinite(Number(draft.order)) ? Math.max(0, Math.floor(Number(draft.order))) : targetSection.items.length;
      const nextItem: KioskProductItem = {
        productId,
        enabled: draft.enabled,
        order,
        imageUrl: draft.imageUrl || "",
        badgeText: draft.badgeText.trim(),
        featured: draft.featured,
        displayName: draft.displayName.trim(),
      };

      const payload: { sectionId: string; items: KioskProductItem[] }[] = [];
      if (draft.sourceSectionId && draft.sourceSectionId !== targetSection.id) {
        const oldSection = sections.find((section) => section.id === draft.sourceSectionId);
        const oldItem = oldSection?.items.find((item) => item.productId === productId);
        if (oldSection && oldItem) payload.push({ sectionId: oldSection.id, items: [{ ...oldItem, enabled: false }] });
      }
      payload.push({ sectionId: targetSection.id, items: [nextItem] });
      await saveKioskItems(menu.id, { sections: [], productSections: payload });

      setNotice(draft.productId ? "A termék módosítva és publikálva." : "Az új termék létrehozva és publikálva.");
      setDraft(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.detail || e?.message || "A termék mentése sikertelen.");
    } finally {
      setSaving(false);
    }
  };

  const removeFromKiosk = async () => {
    if (!draft?.productId || !menu?.id || !draft.sourceSectionId) return;
    const section = sections.find((x) => x.id === draft.sourceSectionId);
    const item = section?.items.find((x) => x.productId === draft.productId);
    if (!section || !item) return;
    if (!window.confirm("Eltávolítod ezt a terméket a kioskból? A terméktörzsben megmarad.")) return;
    setSaving(true);
    setError("");
    try {
      await saveKioskItems(menu.id, { sections: [], productSections: [{ sectionId: section.id, items: [{ ...item, enabled: false }] }] });
      setNotice("A termék el lett távolítva a kioskból.");
      setDraft(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A termék eltávolítása sikertelen.");
    } finally {
      setSaving(false);
    }
  };

  const archiveProduct = async () => {
    if (!draft?.productId) return;
    if (!window.confirm("Archiválod a terméket a teljes VIR terméktörzsben? Ez nem csak a kioskot érinti.")) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/products/${draft.productId}`, { is_active: false });
      if (menu?.id && draft.sourceSectionId) {
        const section = sections.find((x) => x.id === draft.sourceSectionId);
        const item = section?.items.find((x) => x.productId === draft.productId);
        if (section && item) await saveKioskItems(menu.id, { sections: [], productSections: [{ sectionId: section.id, items: [{ ...item, enabled: false }] }] });
      }
      setNotice("A termék archiválva lett.");
      setDraft(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A termék archiválása sikertelen.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return <button className="kpm-launcher" type="button" onClick={() => setOpen(true)} title="Termékek, árak és fotók kezelése"><ImagePlus size={20}/><span>Termék admin · fotók</span></button>;
  }

  return <div className="kpm-overlay" role="dialog" aria-modal="true" aria-label="Kiosk termék adminisztráció">
    <section className="kpm-shell">
      <header className="kpm-header">
        <div><span className="kpm-eyebrow"><ShoppingBag size={15}/> KIOSK · TERMÉK ADMIN</span><h2>Termékek, árak és fotók</h2><p>A módosítások a VIR terméktörzsét és a kiosk megjelenését kezelik egy helyen.</p></div>
        <div className="kpm-header-actions"><button type="button" className="kpm-button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={16}/> Frissítés</button><button type="button" className="kpm-close" onClick={() => setOpen(false)} aria-label="Bezárás"><X/></button></div>
      </header>

      {error && <div className="kpm-alert error">{error}</div>}
      {notice && <div className="kpm-alert success"><CheckCircle2 size={17}/>{notice}</div>}

      <div className="kpm-toolbar">
        <label className="kpm-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Termék, csoport vagy jelvény keresése…"/></label>
        <button type="button" className="kpm-button primary" onClick={beginNew} disabled={loading || !menu}><PackagePlus size={17}/> Új termék</button>
      </div>

      <div className={`kpm-workspace ${draft ? "has-editor" : ""}`}>
        <div className="kpm-list-panel">
          <div className="kpm-list-meta"><b>{visibleRecords.length} kiosk tétel</b><span>{locationId ? "Telephelyhez kötött lista" : ""}</span></div>
          {loading ? <div className="kpm-empty"><Loader2 className="spin"/><p>Termékek betöltése…</p></div> : !menu ? <div className="kpm-empty"><Sparkles/><h3>Nincs inicializált kiosk menü</h3><p>Előbb a Kiosk szerkesztőben hozd létre a menüt.</p></div> : visibleRecords.length === 0 ? <div className="kpm-empty"><ShoppingBag/><h3>Nincs találat</h3><p>Próbálj más keresést vagy adj hozzá új terméket.</p></div> : <div className="kpm-product-list">
            {visibleRecords.map((record) => {
              const name = record.item.displayName || record.product?.name || "Termék";
              const image = record.item.imageUrl || record.product?.image_url || "";
              return <button type="button" key={`${record.section.id}-${record.item.productId}`} className={`kpm-product-row ${record.item.enabled ? "active" : "inactive"}`} onClick={() => beginEdit(record)}>
                <div className="kpm-thumb">{image ? <img src={image} alt=""/> : <Camera size={22}/>}</div>
                <div className="kpm-product-copy"><b>{name}</b><small>{record.section.title} · {money(record.product?.price)}</small><span>{record.item.enabled ? "Kioskban aktív" : "Kioskban kikapcsolva"}{record.item.featured ? " · Kiemelt" : ""}</span></div>
                <Pencil size={17}/>
              </button>;
            })}
          </div>}
        </div>

        {draft && <aside className="kpm-editor">
          <div className="kpm-editor-head"><div><span>{draft.productId ? "Termék szerkesztése" : "Új termék"}</span><h3>{draft.name || "Új termék"}</h3></div><button type="button" onClick={() => setDraft(null)} aria-label="Szerkesztő bezárása"><X size={19}/></button></div>

          <div className="kpm-photo-card" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void changePhoto(e.dataTransfer.files?.[0]); }}>
            <div className="kpm-photo-preview">{draft.imageUrl ? <img src={draft.imageUrl} alt="Termékfotó előnézet"/> : <Camera size={42}/>}</div>
            <div><b>Termékfotó</b><p>Húzd ide a képet vagy válassz fájlt. Automatikusan WebP-re és kiosk méretre optimalizáljuk.</p><label className="kpm-upload"><ImagePlus size={16}/>{photoBusy ? "Feldolgozás…" : draft.imageUrl ? "Fotó cseréje" : "Fotó feltöltése"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={(e) => void changePhoto(e.target.files?.[0])}/></label>{draft.imageUrl && <button type="button" className="kpm-link-danger" onClick={() => setDraft((current) => current ? { ...current, imageUrl: "" } : current)}>Kiosk fotó törlése</button>}</div>
          </div>

          <div className="kpm-form-grid">
            <label className="kpm-field full"><span>Termék neve *</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="pl. Cappuccino"/></label>
            <label className="kpm-field"><span>Eladási ár (Ft) *</span><input inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="1490"/></label>
            <label className="kpm-field"><span>Sorrend</span><input inputMode="numeric" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value.replace(/[^0-9]/g, "") })} placeholder="0"/></label>
            <label className="kpm-field full"><span>Kiosk csoport *</span><select value={draft.sectionId} onChange={(e) => setDraft({ ...draft, sectionId: e.target.value })}>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
            <label className="kpm-field full"><span>Kiosk név (opcionális)</span><input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} placeholder="Ha eltér a terméktörzs nevétől"/></label>
            <label className="kpm-field full"><span>Jelvény / badge</span><input value={draft.badgeText} onChange={(e) => setDraft({ ...draft, badgeText: e.target.value })} placeholder="pl. ÚJ, KEDVENC, -20%"/></label>
          </div>

          <div className="kpm-recommended"><span>Ajánlott ital/snack csoportok</span><div>{RECOMMENDED_GROUPS.map((name) => { const match = sections.find((section) => section.title.toLocaleLowerCase("hu-HU") === name.toLocaleLowerCase("hu-HU")); return <button type="button" key={name} disabled={!match} className={match?.id === draft.sectionId ? "selected" : ""} onClick={() => match && setDraft({ ...draft, sectionId: match.id })} title={match ? `${name} csoport választása` : `${name} csoport jelenleg nincs a kiosk menüben`}>{name}</button>; })}</div></div>

          <div className="kpm-switches">
            <button type="button" className={draft.enabled ? "on" : ""} onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}>{draft.enabled ? <ToggleRight/> : <ToggleLeft/>}<span><b>{draft.enabled ? "Aktív a kioskban" : "Kikapcsolva"}</b><small>A vendég láthatja és kiválaszthatja.</small></span></button>
            <button type="button" className={draft.featured ? "on" : ""} onClick={() => setDraft({ ...draft, featured: !draft.featured })}><Star fill={draft.featured ? "currentColor" : "none"}/><span><b>{draft.featured ? "Kiemelt termék" : "Normál termék"}</b><small>A kiemeltek előrébb jelennek meg.</small></span></button>
          </div>

          <div className="kpm-editor-actions"><button type="button" className="kpm-button primary wide" onClick={() => void saveDraft()} disabled={saving || photoBusy}>{saving ? <Loader2 className="spin" size={17}/> : <CheckCircle2 size={17}/>} {saving ? "Mentés…" : "Mentés és publikálás"}</button>{draft.productId && <div className="kpm-danger-actions"><button type="button" onClick={() => void removeFromKiosk()} disabled={saving}><Trash2 size={15}/> Kioskból eltávolítás</button><button type="button" onClick={() => void archiveProduct()} disabled={saving}><Archive size={15}/> VIR archiválás</button></div>}</div>
        </aside>}
      </div>
    </section>
  </div>;
}
