import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Eye, MonitorSmartphone, RefreshCw, Save, Search, Settings2, Sparkles, Store, ToggleLeft, ToggleRight } from "lucide-react";
import "./KioskAdmin.css";
import {
  getKioskAdminLocations,
  getKioskAdminMenu,
  initKioskMenu,
  saveKioskItems,
  saveKioskSettings,
  type KioskLocation,
  type KioskMenu,
  type KioskSection,
  type KioskService,
  type KioskStats,
} from "../api/kioskAdmin";

type Tab = "general" | "appearance" | "services";

const PUBLIC_KIOSK = "https://weblap-o3g6.onrender.com/kiosk";
const DEFAULT_THEME = {
  primaryColor: "#b69861",
  accentColor: "#ec008c",
  backgroundColor: "#f7f3ed",
  welcomeText: "Minden ami szépség, csak Neked!",
  logoUrl: "/images/kleo_logo@2x.png",
  showEmployees: true,
  showWebEmbed: true,
};

const serviceGroup = (service: KioskService) => service.service_type_name || "Egyéb";
const money = (value: unknown) => `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;

export default function KioskAdmin() {
  const [locations, setLocations] = useState<KioskLocation[]>([]);
  const [locationId, setLocationId] = useState(() => localStorage.getItem("kiosk_admin_location_id") || localStorage.getItem("kleo_location_id") || "");
  const [menu, setMenu] = useState<KioskMenu | null>(null);
  const [sections, setSections] = useState<KioskSection[]>([]);
  const [services, setServices] = useState<KioskService[]>([]);
  const [stats, setStats] = useState<KioskStats | null>(null);
  const [theme, setTheme] = useState<Record<string, any>>(DEFAULT_THEME);
  const [menuName, setMenuName] = useState("Kiosk menü");
  const [isActive, setIsActive] = useState(true);
  const [tab, setTab] = useState<Tab>("general");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLocations = useCallback(async () => {
    try {
      const rows = await getKioskAdminLocations();
      setLocations(rows);
      setLocationId((current) => {
        if (current && rows.some((row) => row.id === current)) return current;
        return rows[0]?.id || "";
      });
    } catch (e: any) {
      setError(e?.message || "A szalonok nem tölthetők be.");
    }
  }, []);

  const load = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      localStorage.setItem("kiosk_admin_location_id", locationId);
      const data = await getKioskAdminMenu(locationId);
      setMenu(data.menu || null);
      setSections(data.sections || []);
      setServices(data.services || []);
      setStats(data.stats || null);
      setTheme({ ...DEFAULT_THEME, ...(data.menu?.theme || {}) });
      setMenuName(data.menu?.name || `${data.location?.name || "Szalon"} kiosk`);
      setIsActive(Boolean(data.menu?.is_active ?? true));
    } catch (e: any) {
      setError(e?.message || "A kiosk beállításai nem tölthetők be.");
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => { void loadLocations(); }, [loadLocations]);
  useEffect(() => { if (locationId) void load(); }, [load, locationId]);

  const enabledMap = useMemo(() => {
    const map = new Map<string, { sectionId: string; enabled: boolean; order: number }>();
    sections.forEach((section) => section.items.forEach((item) => map.set(item.serviceId, { sectionId: section.id, enabled: item.enabled, order: item.order })));
    return map;
  }, [sections]);

  const categories = useMemo(() => Array.from(new Set(services.map(serviceGroup))).sort((a, b) => a.localeCompare(b, "hu")), [services]);
  const filteredServices = useMemo(() => services.filter((service) => {
    const categoryOk = category === "all" || serviceGroup(service) === category;
    const haystack = `${service.name} ${serviceGroup(service)}`.toLocaleLowerCase("hu-HU");
    return categoryOk && haystack.includes(query.toLocaleLowerCase("hu-HU"));
  }), [services, category, query]);

  const currentEnabled = useMemo(() => services.filter((service) => enabledMap.get(service.id)?.enabled).length, [services, enabledMap]);
  const selectedLocation = locations.find((item) => item.id === locationId) || null;
  const previewUrl = `${PUBLIC_KIOSK}?location_id=${encodeURIComponent(locationId)}`;

  function mutateTheme(key: string, value: any) {
    setTheme((current) => ({ ...current, [key]: value }));
  }

  function toggleService(service: KioskService) {
    setSections((current) => {
      const next = current.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item })) }));
      let target = next.find((section) => section.title.toLocaleLowerCase("hu-HU") === serviceGroup(service).toLocaleLowerCase("hu-HU"));
      if (!target) target = next.find((section) => section.title.toLocaleLowerCase("hu-HU") === "egyéb") || next[0];
      if (!target) return current;
      const existing = target.items.find((item) => item.serviceId === service.id);
      if (existing) existing.enabled = !existing.enabled;
      else target.items.push({ serviceId: service.id, enabled: true, order: target.items.length });
      return next;
    });
  }

  function setFilteredEnabled(enabled: boolean) {
    const ids = new Set(filteredServices.map((service) => service.id));
    setSections((current) => {
      const next = current.map((section) => ({ ...section, items: section.items.map((item) => ({ ...item })) }));
      filteredServices.forEach((service) => {
        let target = next.find((section) => section.title.toLocaleLowerCase("hu-HU") === serviceGroup(service).toLocaleLowerCase("hu-HU"));
        if (!target) target = next.find((section) => section.title.toLocaleLowerCase("hu-HU") === "egyéb") || next[0];
        if (!target || !ids.has(service.id)) return;
        const existing = target.items.find((item) => item.serviceId === service.id);
        if (existing) existing.enabled = enabled;
        else target.items.push({ serviceId: service.id, enabled, order: target.items.length });
      });
      return next;
    });
  }

  async function initialize() {
    if (!locationId) return;
    setLoading(true);
    setError("");
    try {
      await initKioskMenu(locationId, `${selectedLocation?.name || "Szalon"} kiosk`);
      setNotice("A kiosk menü létrejött. Most már szerkeszthető és publikálható.");
      await load();
    } catch (e: any) {
      setError(e?.message || "A kiosk menü létrehozása sikertelen.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!menu?.id) return setError("Előbb hozza létre a kiosk menüt.");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveKioskSettings(menu.id, {
        name: menuName,
        is_active: isActive,
        theme,
        sections: sections.map((section, index) => ({ id: section.id, title: section.title, order: index })),
      });
      await saveKioskItems(menu.id, sections.map((section) => ({
        sectionId: section.id,
        items: section.items.map((item, index) => ({ serviceId: item.serviceId, enabled: item.enabled, order: index })),
      })));
      setNotice("Kiosk beállítások mentve. A publikus kiosk a következő betöltéskor ezeket használja.");
      await load();
    } catch (e: any) {
      setError(e?.message || "A kiosk mentése sikertelen.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="kiosk-admin-page">
    <section className="kiosk-admin-hero">
      <div>
        <span className="kiosk-admin-eyebrow"><MonitorSmartphone size={15}/> VIR · KIOSK ADMIN</span>
        <h1>Kiosk vezérlőközpont</h1>
        <p>Szalononként állítsa be a kiosk megjelenését, az elérhető szolgáltatásokat és az aktív publikus menüt.</p>
      </div>
      <div className="kiosk-admin-hero-actions">
        <button className="kiosk-admin-btn ghost" onClick={() => void load()} disabled={loading || !locationId}><RefreshCw size={16}/> Frissítés</button>
        <button className="kiosk-admin-btn ghost" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")} disabled={!locationId}><Eye size={16}/> Élő kiosk</button>
        <button className="kiosk-admin-btn primary" onClick={() => void saveAll()} disabled={!menu || saving}><Save size={16}/>{saving ? "Mentés…" : "Mentés"}</button>
      </div>
    </section>

    {error && <div className="kiosk-admin-alert error">{error}</div>}
    {notice && <div className="kiosk-admin-alert success"><CheckCircle2 size={17}/>{notice}</div>}

    <section className="kiosk-admin-locationbar">
      <div className="kiosk-admin-location-select"><Store size={18}/><div><span>Kezelt szalon</span><select value={locationId} onChange={(e) => setLocationId(e.target.value)}>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div></div>
      <div className={`kiosk-admin-status ${menu?.is_active ? "active" : "inactive"}`}><span className="dot"/><div><small>Publikálási állapot</small><b>{menu ? (isActive ? "Aktív kiosk" : "Kikapcsolva") : "Nincs menü"}</b></div></div>
      <div className="kiosk-admin-meta"><small>Utolsó mentés</small><b>{menu?.updated_at ? new Date(menu.updated_at).toLocaleString("hu-HU") : "—"}</b></div>
    </section>

    {!menu && !loading ? <section className="kiosk-admin-empty">
      <Sparkles size={38}/><h2>Ehhez a szalonhoz még nincs kiosk menü</h2><p>Az alap menü automatikusan az adott szalonban elérhető szolgáltatástípusokból és szolgáltatásokból épül fel.</p><button className="kiosk-admin-btn primary" onClick={() => void initialize()}><Sparkles size={17}/> Alap kiosk létrehozása</button>
    </section> : <>
      <section className="kiosk-admin-kpis">
        <article><span>Elérhető szolgáltatás</span><strong>{stats?.total_services ?? services.length}</strong><small>adatbázis szerint</small></article>
        <article><span>Kioskban aktív</span><strong>{currentEnabled}</strong><small>vendég választhatja</small></article>
        <article><span>Kikapcsolt</span><strong>{Math.max(0, services.length - currentEnabled)}</strong><small>rejtve a kioskban</small></article>
        <article><span>Kategória</span><strong>{sections.length}</strong><small>menüszekció</small></article>
      </section>

      <nav className="kiosk-admin-tabs">
        <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}><Settings2 size={16}/> Általános</button>
        <button className={tab === "appearance" ? "active" : ""} onClick={() => setTab("appearance")}><Sparkles size={16}/> Megjelenés</button>
        <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}><MonitorSmartphone size={16}/> Szolgáltatások <b>{currentEnabled}</b></button>
      </nav>

      {tab === "general" && <section className="kiosk-admin-grid two">
        <article className="kiosk-admin-card">
          <div className="kiosk-admin-card-title"><div><h2>Menü és publikálás</h2><p>A kiosk alap működési beállításai.</p></div></div>
          <label className="kiosk-admin-field"><span>Menü neve</span><input value={menuName} onChange={(e) => setMenuName(e.target.value)} /></label>
          <button type="button" className={`kiosk-admin-switch ${isActive ? "on" : ""}`} onClick={() => setIsActive((value) => !value)}>{isActive ? <ToggleRight size={30}/> : <ToggleLeft size={30}/>}<span><b>{isActive ? "Kiosk engedélyezve" : "Kiosk kikapcsolva"}</b><small>{isActive ? "A vendégek használhatják a konfigurált kiosk menüt." : "A beállítások megmaradnak, de a konfigurált menü nem aktív."}</small></span></button>
          <div className="kiosk-admin-linkbox"><span>Publikus kiosk cím</span><code>{previewUrl}</code><button onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}><ExternalLink size={15}/> Megnyitás</button></div>
        </article>
        <article className="kiosk-admin-card kiosk-admin-preview-card">
          <span className="kiosk-admin-card-kicker">GYORS ELŐNÉZET</span>
          <div className="kiosk-mini-preview" style={{ background: theme.backgroundColor || DEFAULT_THEME.backgroundColor }}>
            <div className="mini-top"><img src={theme.logoUrl || DEFAULT_THEME.logoUrl} alt="Kleopátra"/><span style={{ background: theme.accentColor || DEFAULT_THEME.accentColor }}>KIOSK</span></div>
            <div className="mini-welcome" style={{ borderColor: theme.primaryColor || DEFAULT_THEME.primaryColor }}><small>{selectedLocation?.name}</small><b>{theme.welcomeText || DEFAULT_THEME.welcomeText}</b></div>
            <div className="mini-tiles"><i/><i/><i/></div>
          </div>
        </article>
      </section>}

      {tab === "appearance" && <section className="kiosk-admin-grid two">
        <article className="kiosk-admin-card">
          <div className="kiosk-admin-card-title"><div><h2>Arculat</h2><p>A színek és a szöveg azonnal megjelennek az előnézetben.</p></div></div>
          <label className="kiosk-admin-field"><span>Üdvözlő szöveg</span><input value={theme.welcomeText || ""} onChange={(e) => mutateTheme("welcomeText", e.target.value)} /></label>
          <label className="kiosk-admin-field"><span>Logó URL</span><input value={theme.logoUrl || ""} onChange={(e) => mutateTheme("logoUrl", e.target.value)} /></label>
          <div className="kiosk-admin-color-grid">
            {[['primaryColor','Arany / főszín'],['accentColor','Magenta / kiemelés'],['backgroundColor','Háttér']].map(([key,label]) => <label className="kiosk-admin-color" key={key}><span>{label}</span><div><input type="color" value={theme[key] || (DEFAULT_THEME as any)[key]} onChange={(e) => mutateTheme(key, e.target.value)}/><input value={theme[key] || ""} onChange={(e) => mutateTheme(key, e.target.value)}/></div></label>)}
          </div>
          <div className="kiosk-admin-toggle-grid">
            <button className={theme.showEmployees !== false ? "on" : ""} onClick={() => mutateTheme("showEmployees", theme.showEmployees === false)}><span>Munkatárs blokk</span><b>{theme.showEmployees !== false ? "Látható" : "Rejtett"}</b></button>
            <button className={theme.showWebEmbed !== false ? "on" : ""} onClick={() => mutateTheme("showWebEmbed", theme.showWebEmbed === false)}><span>Weboldal blokk</span><b>{theme.showWebEmbed !== false ? "Látható" : "Rejtett"}</b></button>
          </div>
        </article>
        <article className="kiosk-admin-card kiosk-admin-preview-card"><span className="kiosk-admin-card-kicker">ÉLŐ ELŐNÉZET</span><div className="kiosk-large-preview" style={{background:theme.backgroundColor||DEFAULT_THEME.backgroundColor}}><header><img src={theme.logoUrl||DEFAULT_THEME.logoUrl} alt="Kleopátra"/><button style={{background:theme.accentColor||DEFAULT_THEME.accentColor}}>TOVÁBB</button></header><main><span>{selectedLocation?.name}</span><h3>{theme.welcomeText||DEFAULT_THEME.welcomeText}</h3><div className="preview-category-row">{categories.slice(0,4).map((item)=><i key={item} style={{borderColor:theme.primaryColor||DEFAULT_THEME.primaryColor}}><small>{item}</small></i>)}</div></main></div></article>
      </section>}

      {tab === "services" && <section className="kiosk-admin-card">
        <div className="kiosk-admin-services-head"><div><h2>Kiosk szolgáltatások</h2><p>Csak a bekapcsolt szolgáltatások jelennek meg a vendégeknek.</p></div><div className="kiosk-admin-bulk"><button onClick={() => setFilteredEnabled(true)}>Szűrt lista bekapcsolása</button><button onClick={() => setFilteredEnabled(false)}>Szűrt lista kikapcsolása</button></div></div>
        <div className="kiosk-admin-filters"><label><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szolgáltatás keresése…"/></label><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Összes kategória</option>{categories.map((item)=><option key={item} value={item}>{item}</option>)}</select><span>{filteredServices.length} találat</span></div>
        <div className="kiosk-admin-service-list">{filteredServices.map((service) => {const enabled = Boolean(enabledMap.get(service.id)?.enabled);return <button key={service.id} className={`kiosk-admin-service ${enabled ? "enabled" : ""}`} onClick={() => toggleService(service)}><span className="service-check">{enabled ? "✓" : ""}</span><span className="service-main"><b>{service.name}</b><small>{serviceGroup(service)}</small></span><span className="service-meta"><b>{money(service.base_price)}</b><small>{service.duration_minutes || 30} perc</small></span><span className="service-state">{enabled ? "Kioskban" : "Rejtett"}</span></button>})}{!filteredServices.length && <div className="kiosk-admin-noresult">Nincs a szűrésnek megfelelő szolgáltatás.</div>}</div>
      </section>}
    </>}
  </main>;
}
