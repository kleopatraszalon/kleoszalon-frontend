import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings2,
} from "lucide-react";
import "./ModulePlaceholderPage.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type MenuRecord = {
  name?: string;
  route?: string | null;
  feature_key?: string | null;
  submenus?: MenuRecord[];
};

const knownTitles: Record<string, string> = {
  "/modules/appointments/online-booking": "Online időpontfoglalás",
  "/modules/appointments/list": "Időpontok listája",
  "/modules/appointments/complex-services": "Komplex szolgáltatások (4+ kéz)",
  "/modules/appointments/group-bookings": "Csoportos foglalások és események",
  "/modules/appointments/notifications": "Foglalási értesítések",
  "/modules/appointments/attendance": "Lemondások és meg nem jelenések",
  "/modules/customers/list": "Ügyféltörzs",
  "/modules/customers/profiles": "Ügyféladatlapok és előzmények",
  "/modules/customers/forms": "Kérdőívek és nyilatkozatok",
  "/modules/customers/segments": "Címkék és ügyfélszegmensek",
  "/modules/customers/import": "Importálás és duplikációkezelés",
  "/modules/loyalty/program": "Hűségprogram",
  "/modules/loyalty/memberships": "Bérletek és tagságok",
  "/modules/loyalty/gift-cards": "Ajándékkártyák",
  "/modules/loyalty/discounts": "Kedvezmények és promóciós kódok",
  "/modules/loyalty/balances": "Ügyfélegyenlegek",
  "/modules/team/payroll": "Bér- és jutalékszámítás",
  "/modules/team/performance": "Teljesítmény és értékelés",
  "/modules/team/roles": "Szerepkörök és jogosultságok",
  "/modules/finance/checkout": "Pénztár és fizetés",
  "/modules/finance/online-payments": "Online fizetések",
  "/modules/finance/accounts": "Pénzügyi számlák és költséghelyek",
  "/modules/analytics/revenue": "Bevétel és eredmény",
  "/modules/analytics/clients": "Ügyfélstatisztikák",
  "/modules/analytics/staff": "Munkatársi teljesítmény",
  "/modules/analytics/services": "Szolgáltatási statisztikák",
  "/modules/analytics/inventory": "Készletstatisztikák",
  "/modules/locations/comparison": "Telephelyek összehasonlítása",
  "/modules/locations/central-data": "Központi törzsadatkezelés",
  "/modules/marketing/campaigns": "Kampányok",
  "/modules/marketing/notifications": "SMS, e-mail, WhatsApp és push",
  "/modules/marketing/templates": "Üzenetsablonok",
  "/modules/marketing/segments": "Célcsoportok",
  "/modules/marketing/feedback": "Értékelések és visszajelzések",
  "/modules/online/booking-widget": "Foglalási widget és linkek",
  "/modules/online/channels": "Weboldal és közösségi csatornák",
  "/modules/online/client-app": "Kleo ügyfélalkalmazás",
  "/modules/online/staff-app": "Munkatársi mobilalkalmazás",
  "/modules/commerce/orders": "Rendelések",
  "/modules/commerce/coupons": "Webshop kuponok",
  "/modules/integrations/marketplace": "Integrációs piactér",
  "/modules/integrations/api": "Nyílt API és webhookok",
  "/modules/integrations/logs": "Integrációs napló",
  "/modules/settings/customization": "Modulok és megjelenés testreszabása",
  "/modules/settings/audit-log": "Napló és adatbiztonság",
};

const moduleNames: Record<string, string> = {
  appointments: "Időpontok és jelenlét",
  customers: "Ügyfelek és CRM",
  loyalty: "Hűség és bérletek",
  team: "Csapat és HR",
  finance: "Pénzügy és pénztár",
  analytics: "Statisztika és VIR",
  locations: "Szalonhálózat",
  marketing: "Kommunikáció és marketing",
  online: "Online foglalás",
  commerce: "Webshop és értékesítés",
  integrations: "Integrációk és API",
  settings: "Beállítások",
};

function fallbackTitle(pathname: string) {
  const slug = pathname.split("/").filter(Boolean).pop() || "modul";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findMenu(items: MenuRecord[], pathname: string): MenuRecord | undefined {
  for (const item of items) {
    if (item.route === pathname) return item;
    const child = findMenu(item.submenus || [], pathname);
    if (child) return child;
  }
  return undefined;
}

export default function ModulePlaceholderPage() {
  const location = useLocation();
  const [dbTitle, setDbTitle] = useState<string>();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const moduleKey = location.pathname.split("/").filter(Boolean)[1] || "system";
  const title = dbTitle || knownTitles[location.pathname] || fallbackTitle(location.pathname);
  const moduleTitle = moduleNames[moduleKey] || "Kleoszalon VIR";

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
    fetch(`${API_BASE}/menus`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: MenuRecord[]) => setDbTitle(findMenu(items, location.pathname)?.name))
      .catch(() => setDbTitle(undefined));
  }, [location.pathname]);

  const emptyText = useMemo(
    () => query ? `Nincs találat erre: „${query}”` : "Még nincs rögzített adat ezen a képernyőn.",
    [query]
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main className="module-page">
      <header className="module-page__header">
        <div>
          <p className="module-page__eyebrow">{moduleTitle}</p>
          <h1>{title}</h1>
          <p className="module-page__lead">
            Központi kezelőfelület kereséssel, szűréssel, rögzítéssel és exportálással.
          </p>
        </div>
        <button className="module-page__primary" onClick={() => showNotice("Az új rekord űrlap előkészítve.")}>
          <Plus size={17} /> Új létrehozása
        </button>
      </header>

      <section className="module-page__metrics" aria-label="Összesítés">
        <article><span>Összes rekord</span><strong>0</strong><small>Aktuális szalon</small></article>
        <article><span>Aktív</span><strong>0</strong><small>Jelenlegi állapot</small></article>
        <article><span>Ma módosítva</span><strong>0</strong><small>Napi aktivitás</small></article>
        <article><span>Figyelmeztetés</span><strong>0</strong><small>Nincs teendő</small></article>
      </section>

      <section className="module-page__panel">
        <div className="module-page__toolbar">
          <label className="module-page__search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keresés..." />
          </label>
          <div className="module-page__actions">
            <button onClick={() => showNotice("A szűrők megnyitása következik.")}><Filter size={16} /> Szűrők</button>
            <button onClick={() => showNotice("Az adatok frissítve.")}><RefreshCw size={16} /> Frissítés</button>
            <button onClick={() => showNotice("Nincs exportálható adat.")}><Download size={16} /> Export</button>
            <button aria-label="Oldal beállításai" onClick={() => showNotice("A modulbeállítások megnyitása következik.")}><Settings2 size={16} /></button>
          </div>
        </div>

        <div className="module-page__table" role="table" aria-label={`${title} adatai`}>
          <div className="module-page__table-head" role="row">
            <span>Név / azonosító</span><span>Állapot</span><span>Utolsó módosítás</span><span>Műveletek</span>
          </div>
          <div className="module-page__empty">
            <div className="module-page__empty-icon">K</div>
            <h2>{emptyText}</h2>
            <p>Az első bejegyzés az „Új létrehozása” gombbal rögzíthető.</p>
          </div>
        </div>
      </section>

      {notice && <div className="module-page__toast" role="status">{notice}</div>}
    </main>
  );
}
