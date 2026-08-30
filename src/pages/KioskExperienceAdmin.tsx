import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera, CheckCircle2, ImagePlus, Loader2, MapPinned, Plus, RefreshCw, Save,
  Scissors, Settings2, ToggleLeft, ToggleRight, Trash2, Upload, X,
} from "lucide-react";
import {
  getKioskAdminLocations,
  getKioskAdminMenu,
  saveKioskSettings,
  type KioskMenu,
  type KioskProductSection,
  type KioskSection,
} from "../api/kioskAdmin";
import "./KioskExperienceAdmin.css";

type MappingViewKey = "hair" | "face" | "bodyFront" | "bodyBack";
type HairStyle = {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  enabled: boolean;
};
type MappingConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  accent: string;
  surface: string;
  showLabels: boolean;
  showGuide: boolean;
  imageFit: "contain" | "cover";
  viewImages: Record<MappingViewKey, string>;
};
type HairConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  accent: string;
  allowCamera: boolean;
  allowUpload: boolean;
  showFaceGuide: boolean;
  styles: HairStyle[];
};

type ExperienceConfig = { mapping: MappingConfig; hairMirror: HairConfig };

const VIEW_LABELS: Record<MappingViewKey, string> = {
  hair: "Haj / fejbőr",
  face: "Arc",
  bodyFront: "Test · elöl",
  bodyBack: "Test · hátul",
};

const DEFAULTS: ExperienceConfig = {
  mapping: {
    enabled: true,
    title: "Mutasd meg pontosan, melyik terület érdekel.",
    subtitle: "Jelöld ki a haj, arc vagy test területét. A rendszer az aktuális szolgáltatásokból ajánl kezelést.",
    accent: "#ec008c",
    surface: "#f7f2ec",
    showLabels: true,
    showGuide: true,
    imageFit: "contain",
    viewImages: { hair: "", face: "", bodyFront: "", bodyBack: "" },
  },
  hairMirror: {
    enabled: true,
    title: "Milyen haj állna jól?",
    subtitle: "Fotóalapú frizurapróba",
    accent: "#ec008c",
    allowCamera: true,
    allowUpload: true,
    showFaceGuide: true,
    styles: [],
  },
};

function mergeConfig(theme: Record<string, any>): ExperienceConfig {
  const raw = theme?.kioskExperiences || {};
  const mapping = raw.mapping || {};
  const hair = raw.hairMirror || {};
  return {
    mapping: {
      ...DEFAULTS.mapping,
      ...mapping,
      viewImages: { ...DEFAULTS.mapping.viewImages, ...(mapping.viewImages || {}) },
    },
    hairMirror: {
      ...DEFAULTS.hairMirror,
      ...hair,
      styles: Array.isArray(hair.styles) ? hair.styles : [],
    },
  };
}

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("A kép nem olvasható.")); };
    image.src = url;
  });
}

async function optimizeImage(file: File, kind: "mapping" | "hair") {
  const allowed = kind === "hair" ? /^image\/(png|webp)$/i : /^image\/(jpeg|png|webp)$/i;
  if (!allowed.test(file.type)) {
    throw new Error(kind === "hair" ? "Hajhoz átlátszó hátterű PNG vagy WebP képet tölts fel." : "JPG, PNG vagy WebP kép tölthető fel.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("A kép legfeljebb 12 MB lehet.");
  const image = await readImage(file);
  const maxSide = kind === "hair" ? 960 : 1280;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("A böngésző nem tudja feldolgozni a képet.");
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  let quality = kind === "hair" ? 0.9 : 0.82;
  let dataUrl = canvas.toDataURL("image/webp", quality);
  const target = kind === "hair" ? 420_000 : 360_000;
  while (dataUrl.length > target && quality > 0.5) {
    quality -= 0.07;
    dataUrl = canvas.toDataURL("image/webp", quality);
  }
  if (dataUrl.length > 560_000) throw new Error("A kép tömörítés után is túl nagy. Válassz kisebb képet.");
  return dataUrl;
}

function toggleButton(active: boolean, label: string, onClick: () => void) {
  return <button type="button" className={`kea-switch ${active ? "on" : ""}`} onClick={onClick}>
    {active ? <ToggleRight size={23}/> : <ToggleLeft size={23}/>}<span>{label}</span>
  </button>;
}

export default function KioskExperienceAdmin() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"mapping" | "hair">("mapping");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyImage, setBusyImage] = useState("");
  const [locationId, setLocationId] = useState("");
  const [menu, setMenu] = useState<KioskMenu | null>(null);
  const [sections, setSections] = useState<KioskSection[]>([]);
  const [productSections, setProductSections] = useState<KioskProductSection[]>([]);
  const [config, setConfig] = useState<ExperienceConfig>(DEFAULTS);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      const locationData = await getKioskAdminLocations();
      const resolved = locationData.device?.location_id || locationData.locations.find(x => x.is_device_location)?.id || locationData.locations[0]?.id || "";
      if (!resolved) throw new Error("Nem található a kiosk telephelye.");
      setLocationId(resolved);
      const data = await getKioskAdminMenu(resolved);
      if (!data.menu) throw new Error("A kiosk menü még nincs inicializálva.");
      setMenu(data.menu);
      setSections(data.sections || []);
      setProductSections(data.productSections || []);
      setConfig(mergeConfig(data.menu.theme || {}));
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A Mapping / Hair admin nem tölthető be.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) void load(); }, [open, load]);

  const hairCount = useMemo(() => config.hairMirror.styles.filter(s => s.enabled !== false && s.imageUrl).length, [config.hairMirror.styles]);

  const save = async () => {
    if (!menu) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const nextTheme = { ...(menu.theme || {}), kioskExperiences: config };
      await saveKioskSettings(menu.id, {
        name: menu.name,
        is_active: menu.is_active,
        theme: nextTheme,
        sections: sections.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, enabled: s.enabled, order: s.order })),
        productSections: productSections.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, enabled: s.enabled, order: s.order })),
      });
      setMenu({ ...menu, theme: nextTheme });
      setNotice("Mentve és publikálva a kiosk konfigurációba.");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "A mentés sikertelen.");
    } finally { setSaving(false); }
  };

  const uploadMapping = async (key: MappingViewKey, file?: File) => {
    if (!file) return;
    setBusyImage(`mapping-${key}`); setError("");
    try {
      const imageUrl = await optimizeImage(file, "mapping");
      setConfig(current => ({ ...current, mapping: { ...current.mapping, viewImages: { ...current.mapping.viewImages, [key]: imageUrl } } }));
      setNotice(`${VIEW_LABELS[key]} kép előkészítve. Mentés után lesz élő.`);
    } catch (e: any) { setError(e?.message || "Képfeldolgozási hiba."); }
    finally { setBusyImage(""); }
  };

  const addHairStyle = () => {
    const id = `hair-${Date.now()}`;
    setConfig(current => ({ ...current, hairMirror: { ...current.hairMirror, styles: [...current.hairMirror.styles, { id, name: "Új frizura", type: "Fotó", imageUrl: "", x: 0, y: 0, scale: 1, rotate: 0, enabled: true }] } }));
  };

  const patchHairStyle = (id: string, patch: Partial<HairStyle>) => {
    setConfig(current => ({ ...current, hairMirror: { ...current.hairMirror, styles: current.hairMirror.styles.map(style => style.id === id ? { ...style, ...patch } : style) } }));
  };

  const uploadHair = async (id: string, file?: File) => {
    if (!file) return;
    setBusyImage(`hair-${id}`); setError("");
    try {
      const imageUrl = await optimizeImage(file, "hair");
      patchHairStyle(id, { imageUrl });
      setNotice("Valódi hajfotó előkészítve. Mentés után jelenik meg a hajpróbában.");
    } catch (e: any) { setError(e?.message || "Képfeldolgozási hiba."); }
    finally { setBusyImage(""); }
  };

  return <>
    <button className="kea-launcher" type="button" onClick={() => setOpen(true)}><MapPinned size={18}/><span>Mapping & haj admin</span></button>
    {open && <div className="kea-overlay" role="dialog" aria-modal="true" aria-label="Face Body Mapping és hajpróba admin">
      <section className="kea-shell">
        <header className="kea-header">
          <div><span className="kea-eyebrow">KIOSK EXPERIENCE ADMIN</span><h2>Face / Body Mapping + hajpróba</h2><p>Kinézet, képek, kamerafunkciók és valódi haj-overlayek szerkesztése.</p></div>
          <div className="kea-header-actions"><button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={17}/></button><button className="primary" type="button" onClick={() => void save()} disabled={!menu || saving}>{saving ? <Loader2 className="spin" size={17}/> : <Save size={17}/>} Mentés és publikálás</button><button type="button" onClick={() => setOpen(false)}><X size={20}/></button></div>
        </header>
        {error && <div className="kea-alert error">{error}</div>}
        {notice && <div className="kea-alert success"><CheckCircle2 size={17}/>{notice}</div>}
        <nav className="kea-tabs"><button className={tab === "mapping" ? "active" : ""} onClick={() => setTab("mapping")}><MapPinned size={17}/> Face / Body Mapping</button><button className={tab === "hair" ? "active" : ""} onClick={() => setTab("hair")}><Scissors size={17}/> Hajpróba <b>{hairCount}</b></button></nav>
        {loading ? <div className="kea-loading"><Loader2 className="spin"/><span>Betöltés…</span></div> : <div className="kea-content">
          {tab === "mapping" && <div className="kea-grid">
            <article className="kea-card"><div className="kea-card-head"><div><span>MEGJELENÉS</span><h3>Mapping felület</h3></div><Settings2 size={20}/></div>
              <div className="kea-switch-row">{toggleButton(config.mapping.enabled, "Mapping bekapcsolva", () => setConfig(c => ({ ...c, mapping: { ...c.mapping, enabled: !c.mapping.enabled } })))}{toggleButton(config.mapping.showLabels, "Zónanevek", () => setConfig(c => ({ ...c, mapping: { ...c.mapping, showLabels: !c.mapping.showLabels } })))}{toggleButton(config.mapping.showGuide, "Segédgrafika", () => setConfig(c => ({ ...c, mapping: { ...c.mapping, showGuide: !c.mapping.showGuide } })))}</div>
              <label className="kea-field"><span>Főcím</span><input value={config.mapping.title} onChange={e => setConfig(c => ({ ...c, mapping: { ...c.mapping, title: e.target.value } }))}/></label>
              <label className="kea-field"><span>Leírás</span><textarea value={config.mapping.subtitle} onChange={e => setConfig(c => ({ ...c, mapping: { ...c.mapping, subtitle: e.target.value } }))}/></label>
              <div className="kea-field-row"><label className="kea-field"><span>Kiemelő szín</span><input type="color" value={config.mapping.accent} onChange={e => setConfig(c => ({ ...c, mapping: { ...c.mapping, accent: e.target.value } }))}/></label><label className="kea-field"><span>Háttér</span><input type="color" value={config.mapping.surface} onChange={e => setConfig(c => ({ ...c, mapping: { ...c.mapping, surface: e.target.value } }))}/></label><label className="kea-field"><span>Kép illesztése</span><select value={config.mapping.imageFit} onChange={e => setConfig(c => ({ ...c, mapping: { ...c.mapping, imageFit: e.target.value as "contain" | "cover" } }))}><option value="contain">Teljes kép</option><option value="cover">Kitöltés</option></select></label></div>
            </article>
            <article className="kea-card kea-wide"><div className="kea-card-head"><div><span>KÉPEK</span><h3>Haj / arc / test nézetek</h3><p>Mind a négy nézethez külön fotó tölthető fel. A hotspotok a fotó fölött maradnak.</p></div><ImagePlus size={20}/></div>
              <div className="kea-mapping-images">{(Object.keys(VIEW_LABELS) as MappingViewKey[]).map(key => <div className="kea-image-editor" key={key}><div className="kea-image-preview">{config.mapping.viewImages[key] ? <img src={config.mapping.viewImages[key]} alt=""/> : <span><MapPinned size={30}/><b>{VIEW_LABELS[key]}</b></span>}</div><div><b>{VIEW_LABELS[key]}</b><small>JPG / PNG / WebP · automatikus optimalizálás</small><label className="kea-upload"><Upload size={15}/>{busyImage === `mapping-${key}` ? "Feldolgozás…" : "Kép feltöltése"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busyImage} onChange={e => void uploadMapping(key, e.target.files?.[0])}/></label>{config.mapping.viewImages[key] && <button className="kea-link-danger" onClick={() => setConfig(c => ({ ...c, mapping: { ...c.mapping, viewImages: { ...c.mapping.viewImages, [key]: "" } } }))}>Kép törlése</button>}</div></div>)}</div>
            </article>
          </div>}
          {tab === "hair" && <div className="kea-grid">
            <article className="kea-card"><div className="kea-card-head"><div><span>HAJPRÓBA</span><h3>Fotóalapú mód</h3><p>A régi rajzolt SVG hajakat a kiosk nem használja: csak feltöltött PNG/WebP hajfotókat.</p></div><Camera size={20}/></div>
              <div className="kea-switch-row">{toggleButton(config.hairMirror.enabled, "Hajpróba bekapcsolva", () => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, enabled: !c.hairMirror.enabled } })))}{toggleButton(config.hairMirror.allowCamera, "Kamera engedélyezve", () => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, allowCamera: !c.hairMirror.allowCamera } })))}{toggleButton(config.hairMirror.allowUpload, "Fotó feltöltés", () => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, allowUpload: !c.hairMirror.allowUpload } })))}{toggleButton(config.hairMirror.showFaceGuide, "Arc segédkeret", () => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, showFaceGuide: !c.hairMirror.showFaceGuide } })))}</div>
              <label className="kea-field"><span>Cím</span><input value={config.hairMirror.title} onChange={e => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, title: e.target.value } }))}/></label><label className="kea-field"><span>Alcím</span><input value={config.hairMirror.subtitle} onChange={e => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, subtitle: e.target.value } }))}/></label><label className="kea-field compact"><span>Kiemelő szín</span><input type="color" value={config.hairMirror.accent} onChange={e => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, accent: e.target.value } }))}/></label>
            </article>
            <article className="kea-card kea-wide"><div className="kea-card-head"><div><span>VALÓDI HAJAK</span><h3>Frizura overlay könyvtár</h3><p>Átlátszó hátterű, fotorealisztikus PNG/WebP hajképeket tölts fel. A kiosk ezeket a vendég fotójára illeszti.</p></div><button className="kea-add" type="button" onClick={addHairStyle}><Plus size={16}/> Új frizura</button></div>
              {!config.hairMirror.styles.length && <div className="kea-empty"><Scissors size={34}/><b>Nincs feltöltött valódi haj.</b><span>Az „Új frizura” gombbal adj hozzá PNG/WebP overlayt. A régi stilizált rajzok nem fognak megjelenni.</span></div>}
              <div className="kea-hair-list">{config.hairMirror.styles.map((style, index) => <div className={`kea-hair-row ${style.enabled ? "" : "off"}`} key={style.id}><div className="kea-hair-preview">{style.imageUrl ? <img src={style.imageUrl} alt=""/> : <Scissors size={28}/>}</div><div className="kea-hair-fields"><input value={style.name} onChange={e => patchHairStyle(style.id, { name: e.target.value })} placeholder="Frizura neve"/><input value={style.type} onChange={e => patchHairStyle(style.id, { type: e.target.value })} placeholder="Típus"/><label className="kea-upload small"><Upload size={14}/>{busyImage === `hair-${style.id}` ? "Feldolgozás…" : "PNG/WebP haj feltöltése"}<input type="file" accept="image/png,image/webp" disabled={!!busyImage} onChange={e => void uploadHair(style.id, e.target.files?.[0])}/></label></div><div className="kea-hair-adjust"><label><span>X</span><input type="number" value={style.x} onChange={e => patchHairStyle(style.id, { x: Number(e.target.value) || 0 })}/></label><label><span>Y</span><input type="number" value={style.y} onChange={e => patchHairStyle(style.id, { y: Number(e.target.value) || 0 })}/></label><label><span>Méret</span><input type="number" min="0.4" max="2" step="0.05" value={style.scale} onChange={e => patchHairStyle(style.id, { scale: Number(e.target.value) || 1 })}/></label><label><span>Forg.</span><input type="number" min="-45" max="45" value={style.rotate} onChange={e => patchHairStyle(style.id, { rotate: Number(e.target.value) || 0 })}/></label></div><div className="kea-hair-actions"><button title="Aktív / inaktív" onClick={() => patchHairStyle(style.id, { enabled: !style.enabled })}>{style.enabled ? <ToggleRight/> : <ToggleLeft/>}</button><button title="Feljebb" disabled={index === 0} onClick={() => setConfig(c => { const list = [...c.hairMirror.styles]; [list[index - 1], list[index]] = [list[index], list[index - 1]]; return { ...c, hairMirror: { ...c.hairMirror, styles: list } }; })}>↑</button><button title="Lejjebb" disabled={index === config.hairMirror.styles.length - 1} onClick={() => setConfig(c => { const list = [...c.hairMirror.styles]; [list[index + 1], list[index]] = [list[index], list[index + 1]]; return { ...c, hairMirror: { ...c.hairMirror, styles: list } }; })}>↓</button><button className="danger" title="Törlés" onClick={() => setConfig(c => ({ ...c, hairMirror: { ...c.hairMirror, styles: c.hairMirror.styles.filter(s => s.id !== style.id) } }))}><Trash2 size={16}/></button></div></div>)}</div>
            </article>
          </div>}
        </div>}
        <footer className="kea-footer"><span>Telephely: <b>{locationId || "—"}</b></span><button className="primary" type="button" onClick={() => void save()} disabled={!menu || saving}>{saving ? <Loader2 className="spin" size={17}/> : <Save size={17}/>} Mentés és publikálás</button></footer>
      </section>
    </div>}
  </>;
}
