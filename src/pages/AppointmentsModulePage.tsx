import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BellRing, CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert,
  Clock3, Copy, ExternalLink, Filter, Link2, ListFilter,
  LayoutGrid, List, MoreHorizontal, Plus, RefreshCw, Search, Settings2, Users, X,
} from "lucide-react";
import BookingNotificationAutomation from "./booking/BookingNotificationAutomation";
import "./AppointmentsModulePage.css";
import "./AppointmentsListCalendarToggle.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

type Appointment = {
  id: string; title: string; start: string; end: string; status: string | null;
  price: number | null; client_name: string | null; service_name: string | null;
  location_name: string | null; employee_name?: string;
};
type Employee = { id: string; full_name: string; appointments: Appointment[] };
type LocationSchedule = { id: string | null; name: string; employees: Employee[] };
type ScheduleResponse = { date: string; locations: LocationSchedule[] };

const viewConfig: Record<string, { title: string; subtitle: string }> = {
  "online-booking": { title: "Online időpontfoglalás", subtitle: "Foglalási csatornák, widgetek és elérhetőség kezelése" },
  list: { title: "Időpontok listája", subtitle: "Minden foglalás egy helyen, gyors állapotkezeléssel" },
  "complex-services": { title: "Komplex szolgáltatások (4+ kéz)", subtitle: "Több munkatársat és erőforrást igénylő szolgáltatások" },
  "group-bookings": { title: "Csoportos foglalások és események", subtitle: "Létszám, várólista és csoportos órarend kezelése" },
  notifications: { title: "Foglalási értesítések", subtitle: "Automatikus e-mail szabályok, kommunikációs sor és küldési állapot" },
  attendance: { title: "Lemondások és meg nem jelenések", subtitle: "Kiesések követése és visszatérési szabályok" },
};

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const d = new Date(`${value}T12:00:00`); d.setDate(d.getDate() + days); return isoDate(d); }
function formatDate(value: string) { return new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date(`${value}T12:00:00`)); }
function formatTime(value: string) { return new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatMoney(value: number | null) { return `${Number(value || 0).toLocaleString("hu-HU")} Ft`; }
function statusLabel(status?: string | null) {
  const key = (status || "planned").toLowerCase();
  if (["completed", "done", "finished"].includes(key)) return "Teljesítve";
  if (["cancelled", "canceled"].includes(key)) return "Lemondva";
  if (["no_show", "no-show", "missed"].includes(key)) return "Nem jelent meg";
  if (["confirmed", "active"].includes(key)) return "Megerősítve";
  return "Tervezett";
}
function statusClass(status?: string | null) { return statusLabel(status).toLowerCase().replace(/ /g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

export default function AppointmentsModulePage() {
  const { view = "list" } = useParams();
  const navigate = useNavigate();
  const config = viewConfig[view] || viewConfig.list;
  const [date, setDate] = useState(isoDate(new Date()));
  const [schedule, setSchedule] = useState<ScheduleResponse>({ date, locations: [] });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [notice, setNotice] = useState("");
  const [channels, setChannels] = useState({ website: true, instagram: true, google: false, direct: true });

  const toast = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2500); };
  const loadSchedule = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || localStorage.getItem("kleo_token");
    try {
      const response = await fetch(`${API_BASE}/schedule/day?date=${date}`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSchedule({ date: data.date || date, locations: Array.isArray(data.locations) ? data.locations : [] });
    } catch {
      setSchedule({ date, locations: [] });
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const appointments = useMemo(() => schedule.locations.flatMap((loc) =>
    loc.employees.flatMap((employee) => (employee.appointments || []).map((item) => ({ ...item, employee_name: employee.full_name, location_name: item.location_name || loc.name })))
  ), [schedule]);
  const filtered = useMemo(() => appointments.filter((item) => {
    const haystack = `${item.client_name} ${item.service_name} ${item.employee_name} ${item.location_name}`.toLowerCase();
    return (location === "all" || item.location_name === location) && haystack.includes(query.toLowerCase());
  }), [appointments, location, query]);
  const cancelled = appointments.filter((item) => ["Lemondva", "Nem jelent meg"].includes(statusLabel(item.status)));
  const revenue = appointments.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const toolbar = (
    <div className="ap-toolbar">
      <div className="ap-list-view-switch"><button className="active"><List size={16}/> Lista</button><button onClick={() => navigate("/appointments/calendar")}><LayoutGrid size={16}/> Naptár</button></div>
      <div className="ap-date-nav">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Előző nap"><ChevronLeft size={18}/></button>
        <button className="ap-today" onClick={() => setDate(isoDate(new Date()))}>Ma</button>
        <button onClick={() => setDate(addDays(date, 1))} aria-label="Következő nap"><ChevronRight size={18}/></button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <label className="ap-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Vendég, szolgáltatás, munkatárs..." /></label>
      <select value={location} onChange={(e) => setLocation(e.target.value)}><option value="all">Minden telephely</option>{schedule.locations.map((loc) => <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>)}</select>
      <button onClick={loadSchedule}><RefreshCw size={16} className={loading ? "is-spinning" : ""}/> Frissítés</button>
      <button><Filter size={16}/> Szűrők</button>
    </div>
  );

  return (
    <main className="ap-page">
      <header className="ap-header">
        <div><p>Időpontok és jelenlét</p><h1>{config.title}</h1><span>{config.subtitle}</span></div>
        <div className="ap-header-actions"><button onClick={() => toast("A nézet beállításai megnyílnak.")}><Settings2 size={17}/> Beállítások</button><button className="primary" onClick={() => navigate("/appointments/new")}><Plus size={18}/> Új időpont</button></div>
      </header>
      <nav className="ap-tabs">
        {Object.entries(viewConfig).map(([key, item]) => <button key={key} className={view === key ? "active" : ""} onClick={() => navigate(`/modules/appointments/${key}`)}>{item.title.replace(" (4+ kéz)", "")}</button>)}
      </nav>

      {view === "list" && <>{toolbar}<section className="ap-kpis"><article><CalendarDays/><div><strong>{appointments.length}</strong><span>Összes időpont</span></div></article><article><Check/><div><strong>{appointments.filter(a => statusLabel(a.status) === "Teljesítve").length}</strong><span>Teljesítve</span></div></article><article><CircleAlert/><div><strong>{cancelled.length}</strong><span>Lemondás / kiesés</span></div></article><article><Clock3/><div><strong>{formatMoney(revenue)}</strong><span>Napi foglalási érték</span></div></article></section><AppointmentTable items={filtered} loading={loading}/></>}
      {view === "attendance" && <>{toolbar}<section className="ap-kpis"><article><X/><div><strong>{cancelled.filter(a => statusLabel(a.status) === "Lemondva").length}</strong><span>Lemondva</span></div></article><article><CircleAlert/><div><strong>{cancelled.filter(a => statusLabel(a.status) === "Nem jelent meg").length}</strong><span>Nem jelent meg</span></div></article><article><Users/><div><strong>{appointments.length ? Math.round(cancelled.length / appointments.length * 100) : 0}%</strong><span>Kiesési arány</span></div></article><article><BellRing/><div><strong>0</strong><span>Automatikus visszahívás</span></div></article></section><AppointmentTable items={filtered.filter(a => ["Lemondva", "Nem jelent meg"].includes(statusLabel(a.status)))} loading={loading}/></>}
      {view === "online-booking" && <OnlineBooking channels={channels} setChannels={setChannels} toast={toast}/>} 
      {view === "notifications" && <BookingNotificationAutomation toast={toast}/>} 
      {view === "complex-services" && <ServiceSetup complex toast={toast}/>} 
      {view === "group-bookings" && <ServiceSetup complex={false} toast={toast}/>} 
      {notice && <div className="ap-toast">{notice}</div>}
    </main>
  );
}

function AppointmentTable({ items, loading }: { items: Appointment[]; loading: boolean }) {
  return <section className="ap-card ap-list"><div className="ap-card-title"><div><h2>Foglalások</h2><p>{items.length} találat</p></div><button><ListFilter size={17}/> Oszlopok</button></div><div className="ap-table-head"><span>Idő</span><span>Vendég és szolgáltatás</span><span>Munkatárs</span><span>Telephely</span><span>Állapot</span><span>Összeg</span><span/></div>{loading ? <div className="ap-empty">Adatok betöltése…</div> : items.length ? items.map(item => <div className="ap-table-row" key={item.id}><strong>{formatTime(item.start)}<small>{formatTime(item.end)}-ig</small></strong><span><b>{item.client_name || "Vendég nélkül"}</b><small>{item.service_name || item.title || "Szolgáltatás"}</small></span><span>{item.employee_name || "–"}</span><span>{item.location_name || "–"}</span><span><em className={`ap-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</em></span><span>{formatMoney(item.price)}</span><button aria-label="További műveletek"><MoreHorizontal size={18}/></button></div>) : <div className="ap-empty"><CalendarDays size={34}/><h3>Nincs megjeleníthető időpont</h3><p>{formatDate(isoDate(new Date()))} környékén a kiválasztott feltételekkel nincs találat.</p></div>}</section>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) { return <button className={`ap-toggle ${checked ? "on" : ""}`} onClick={onChange} role="switch" aria-checked={checked}><span/></button>; }

function OnlineBooking({ channels, setChannels, toast }: any) {
  const rows = [{ key: "website", name: "Weboldali foglalási widget", detail: "Beágyazható Kleopátra foglalási felület", icon: <Link2/> }, { key: "instagram", name: "Instagram és Facebook", detail: "Foglalás gomb a közösségi oldalakon", icon: <ExternalLink/> }, { key: "google", name: "Google üzleti profil", detail: "Közvetlen időpontfoglalási hivatkozás", icon: <Search/> }, { key: "direct", name: "Közvetlen foglalási link", detail: "Megosztható szalon- és munkatársi linkek", icon: <Copy/> }];
  return <div className="ap-two-col"><section className="ap-card"><div className="ap-card-title"><div><h2>Foglalási csatornák</h2><p>Kapcsolja be, ahol vendégeket szeretne fogadni.</p></div></div>{rows.map(row => <div className="ap-setting-row" key={row.key}><i>{row.icon}</i><span><b>{row.name}</b><small>{row.detail}</small></span><Toggle checked={channels[row.key]} onChange={() => setChannels({ ...channels, [row.key]: !channels[row.key] })}/><button><Settings2 size={17}/></button></div>)}</section><aside className="ap-card ap-preview"><div className="ap-phone"><div className="ap-phone-top"/><p>KLEOPÁTRA</p><h3>Foglaljon időpontot</h3><label>Válasszon szalont</label><div className="ap-fake-input">Kleopátra Szépségszalon</div><label>Válasszon szolgáltatást</label><div className="ap-fake-input">Szolgáltatás kiválasztása</div><button onClick={() => toast("A publikus előnézet megnyílik.")}>Tovább</button></div><p>Élő foglalási előnézet</p></aside></div>;
}

function ServiceSetup({ complex, toast }: { complex: boolean; toast: (message: string) => void }) {
  return <><section className="ap-kpis"><article><Users/><div><strong>0</strong><span>{complex ? "Komplex szolgáltatás" : "Aktív csoport"}</span></div></article><article><CalendarDays/><div><strong>0</strong><span>Mai alkalom</span></div></article><article><Clock3/><div><strong>0</strong><span>Foglalt résztvevő</span></div></article><article><CircleAlert/><div><strong>0</strong><span>Várólistán</span></div></article></section><section className="ap-card"><div className="ap-card-title"><div><h2>{complex ? "Erőforrás-kombinációk" : "Csoportos események"}</h2><p>{complex ? "Kapcsolja össze a szolgáltatást a szükséges munkatársakkal és eszközökkel." : "Állítson be létszámot, órarendet és foglalási szabályokat."}</p></div><button className="primary" onClick={() => toast(complex ? "Új komplex szolgáltatás előkészítve." : "Új csoportos esemény előkészítve.")}><Plus size={17}/> {complex ? "Új kombináció" : "Új esemény"}</button></div><div className="ap-empty"><Users size={35}/><h3>{complex ? "Még nincs komplex szolgáltatás" : "Még nincs csoportos esemény"}</h3><p>A beállítás után az online foglaló és a naptár automatikusan figyelembe veszi a kapacitást.</p></div></section></>;
}
