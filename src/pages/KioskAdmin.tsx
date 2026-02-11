import React, { useEffect, useMemo, useState } from "react";
import "./KioskAdmin.css";
import {
  getKioskAdminMenu,
  initKioskMenu,
  saveKioskItems,
  saveKioskTheme,
  type KioskService,
} from "../api/kioskAdmin";

type UiSection = {
  id: string;
  title: string;
  items: { serviceId: string; enabled: boolean; order: number }[];
};

function groupServices(services: KioskService[]) {
  const by: Record<string, { key: string; title: string; services: KioskService[] }> = {};
  for (const s of services) {
    const key = s.service_type_id || "other";
    const title = s.service_type_name || "Egyéb";
    if (!by[key]) by[key] = { key, title, services: [] };
    by[key].services.push(s);
  }
  return Object.values(by);
}

export default function KioskAdmin() {
  const [locationId, setLocationId] = useState<string>(() => localStorage.getItem("kiosk_location_id") || "");
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [menuId, setMenuId] = useState<string | null>(null);
  const [theme, setTheme] = useState<any>({});
  const [sections, setSections] = useState<UiSection[]>([]);
  const [services, setServices] = useState<KioskService[]>([]);

  const grouped = useMemo(() => groupServices(services), [services]);

  async function load() {
    setErr("");
    if (!locationId) return setErr("Adj meg egy telephely (locationId) UUID-t.");
    setLoading(true);
    try {
      localStorage.setItem("kiosk_location_id", locationId);
      const data = await getKioskAdminMenu(locationId);
      setServices(data.services || []);
      setMenuId(data.menu?.id || null);
      setTheme(data.menu?.theme || {});
      const secs: UiSection[] = (data.sections || []).map((s: any) => ({
        id: s.id,
        title: s.title || s.title_hu || "Szekció",
        items: Array.isArray(s.items) ? s.items.map((it: any, idx: number) => ({
          serviceId: it.serviceId || it.service_id,
          enabled: Boolean(it.enabled ?? true),
          order: Number(it.order ?? it.item_order ?? idx),
        })) : [],
      }));
      setSections(secs);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (locationId) load(); }, []);

  const enabledByServiceId = useMemo(() => {
    const m = new Map<string, { sectionId: string; enabled: boolean; order: number }>();
    for (const sec of sections) {
      for (const it of sec.items) m.set(it.serviceId, { sectionId: sec.id, enabled: it.enabled, order: it.order });
    }
    return m;
  }, [sections]);

  function toggleService(serviceId: string, serviceTypeName?: string | null) {
    // find best section: title match
    const targetSection =
      sections.find((s) => (serviceTypeName ? s.title.toLowerCase() === serviceTypeName.toLowerCase() : false)) ||
      sections.find((s) => s.title.toLowerCase() === "egyéb") ||
      sections[0];

    if (!targetSection) return;

    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, items: [...s.items] }));
      const sec = next.find((s) => s.id === targetSection.id)!;
      const ix = sec.items.findIndex((x) => x.serviceId === serviceId);
      if (ix >= 0) {
        sec.items[ix] = { ...sec.items[ix], enabled: !sec.items[ix].enabled };
      } else {
        sec.items.push({ serviceId, enabled: true, order: sec.items.length });
      }
      return next;
    });
  }

  async function doInit() {
    setErr("");
    if (!locationId) return setErr("locationId kötelező.");
    setLoading(true);
    try {
      // initKioskMenu() a frontend API-ban string-et ad vissza (menuId), nem objektumot
        const r = await initKioskMenu(locationId);
        const menuId = typeof r === "string" ? r : (r as any)?.menuId;
        setMenuId(menuId);
      await load();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!menuId) return setErr("Nincs menü. Kattints: 'Alap menü létrehozása'.");
    setLoading(true);
    setErr("");
    try {
      await saveKioskTheme(menuId, theme || {});
      await saveKioskItems(menuId, sections.map((s) => ({
        sectionId: s.id,
        items: s.items.map((it) => ({ serviceId: it.serviceId, enabled: it.enabled, order: it.order })),
      })));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kadm">
      <div className="kadm__top">
        <div>
          <h1>KIOSK admin</h1>
          <div className="muted">Menü elemek + kinézet (kiosk oldalhoz)</div>
        </div>
        <div className="kadm__row">
          <input
            className="kadm__input"
            placeholder="locationId (UUID)"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value.trim())}
          />
          <button onClick={load} disabled={loading}>Betöltés</button>
          <button onClick={doInit} disabled={loading}>Alap menü létrehozása</button>
          <button onClick={saveAll} disabled={loading || !menuId}>Mentés</button>
        </div>
      </div>

      {err && <div className="kadm__err">Hiba: {err}</div>}

      <div className="kadm__grid">
        <section className="card">
          <h2>Kinézet</h2>
          <div className="form">
            <div>
              <label>Üdvözlő szöveg</label>
              <input value={theme?.welcomeText || ""} onChange={(e)=>setTheme((t:any)=>({...(t||{}), welcomeText:e.target.value}))} />
            </div>
            <div className="grid2">
              <div>
                <label>Főszín (hex)</label>
                <input value={theme?.primaryColor || ""} onChange={(e)=>setTheme((t:any)=>({...(t||{}), primaryColor:e.target.value}))} />
              </div>
              <div>
                <label>Logó URL</label>
                <input value={theme?.logoUrl || ""} onChange={(e)=>setTheme((t:any)=>({...(t||{}), logoUrl:e.target.value}))} />
              </div>
            </div>
            <div className="muted">A kiosk oldalon ezekből alap stílust építünk. (Ha üres, akkor Kleo default.)</div>
          </div>
        </section>

        <section className="card">
          <h2>Menü elemek</h2>
          {!menuId && (
            <div className="muted">
              Nincs még aktív menü beállítva ehhez a telephelyhez. Kattints: <b>Alap menü létrehozása</b>
            </div>
          )}

          <div className="kadm__list">
            {grouped.map((g) => (
              <div className="kadm__group" key={g.key}>
                <div className="kadm__groupTitle">{g.title}</div>
                <div className="kadm__gridList">
                  {g.services.map((s) => {
                    const st = enabledByServiceId.get(s.id);
                    const enabled = st ? st.enabled : false;
                    return (
                      <label key={s.id} className={"kadm__svc " + (enabled ? "on" : "off")}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleService(s.id, g.title)}
                        />
                        <span className="kadm__svcName">{s.name}</span>
                        <span className="kadm__svcMeta">
                          {s.base_price ? `${Math.round(Number(s.base_price))} Ft` : ""}
                          {s.duration_minutes ? ` • ${s.duration_minutes} perc` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
