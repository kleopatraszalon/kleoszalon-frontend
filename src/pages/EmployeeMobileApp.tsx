import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ClipboardCheck,
  GraduationCap,
  LogIn,
  MessageCircle,
  RefreshCw,
  Star,
  UserRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import "./EmployeeMobileApp.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-1.onrender.com/api";

const cfg = { withCredentials: true } as const;
const taskStatus: Record<string, string> = {
  open: "Nyitott",
  assigned: "Kiosztva",
  in_progress: "Folyamatban",
  completed: "Vezetői jóváhagyásra vár",
  approved: "Jóváhagyva",
};
const moduleMeta: Record<string, [string, React.ComponentType<any>]> = {
  schedule: ["Beosztás", CalendarDays],
  attendance: ["Jelenlét", Clock3],
  workorders: ["Munkalapok", ClipboardCheck],
  tasks: ["Feladatok", CheckCircle2],
  chat: ["Belső chat", MessageCircle],
  knowledge: ["Tudásbázis", BookOpenText],
  checklists: ["Check listák", ClipboardCheck],
  quiz: ["Munkaköri teszt", CheckCircle2],
  training: ["Képzések", GraduationCap],
  evaluations: ["Értékelések", Star],
  compensation: ["Bér és jutalék", WalletCards],
};
const internalViews = new Set([
  "home",
  "schedule",
  "attendance",
  "tasks",
  "training",
  "evaluations",
  "compensation",
]);

type AuthState = "checking" | "authenticated" | "unauthenticated";

function apiError(error: any) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Betöltési hiba.";
}

function money(value: any) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("hu-HU", {
        style: "currency",
        currency: "HUF",
        maximumFractionDigits: 0,
      }).format(amount)
    : "—";
}

export default function EmployeeMobileApp() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const rawView = params.get("view") || "home";
  const view = internalViews.has(rawView) ? rawView : "home";
  const [data, setData] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [development, setDevelopment] = useState<any>(null);
  const [compensation, setCompensation] = useState<any>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, configResponse] = await Promise.all([
        axios.get(`${API_BASE}/employee-self/dashboard`, cfg),
        axios.get(`${API_BASE}/employee-self/config`, cfg),
      ]);
      setData(dashboardResponse.data);
      setTeam(configResponse.data);
      setAuthState("authenticated");

      if (view === "training" || view === "evaluations") {
        const response = await axios.get(`${API_BASE}/employee-self/development`, cfg);
        setDevelopment(response.data);
      }
      if (view === "compensation") {
        const response = await axios.get(`${API_BASE}/employee-self/compensation`, cfg);
        setCompensation(response.data);
      }
    } catch (requestError: any) {
      if (requestError?.response?.status === 401) {
        setAuthState("unauthenticated");
        setData(null);
        setTeam(null);
      } else {
        setAuthState("authenticated");
        setError(apiError(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    let link = document.querySelector("link[data-employee-manifest]") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/employee-manifest.webmanifest";
      link.setAttribute("data-employee-manifest", "1");
      document.head.appendChild(link);
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/employee-sw.js", { scope: "/employee-app" }).catch(() => {});
    }
    void load();
  }, [load]);

  async function completeTask(id: string) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await axios.post(`${API_BASE}/employee-self/tasks/${id}/complete`, {}, cfg);
      setNotice(response.data?.message || "A feladat vezetői jóváhagyásra elküldve.");
      await load();
    } catch (requestError: any) {
      if (requestError?.response?.status === 401) setAuthState("unauthenticated");
      setError(apiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function saveEvaluationComment(id: string, comment: string) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await axios.patch(`${API_BASE}/employee-self/evaluations/${id}/comment`, { comment }, cfg);
      setNotice("A saját megjegyzés mentve.");
      const response = await axios.get(`${API_BASE}/employee-self/development`, cfg);
      setDevelopment(response.data);
    } catch (requestError: any) {
      if (requestError?.response?.status === 401) setAuthState("unauthenticated");
      setError(apiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  if (authState === "checking") {
    return (
      <main className="ema-login">
        <section>
          <div className="ema-logo">K</div>
          <div className="ema-kicker">KLEO TEAM</div>
          <h1>Kleo Team</h1>
          <p>A VIR munkamenet ellenőrzése folyamatban.</p>
        </section>
      </main>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <main className="ema-login">
        <section>
          <div className="ema-logo">K</div>
          <div className="ema-kicker">KLEO TEAM</div>
          <h1>Kleo Team</h1>
          <p>A Kleopátra dolgozói és partneri alkalmazása. Jelentkezzen be a VIR azonosítójával.</p>
          <a href="/login">
            <LogIn size={18} /> Bejelentkezés
          </a>
        </section>
      </main>
    );
  }

  const employee = data?.employee || team?.employee || {};
  const leave = data?.leave || {};
  const attendance = data?.attendance || {};
  const shifts = data?.upcoming_shifts || [];
  const tasks = data?.tasks || [];
  const modules = team?.modules || data?.team?.modules || {};

  if (team && team.enabled === false) {
    return (
      <main className="ema-login">
        <section>
          <div className="ema-logo">K</div>
          <div className="ema-kicker">KLEO TEAM</div>
          <h1>Átmenetileg kikapcsolva</h1>
          <p>A Kleo Team portált az adminisztrátor jelenleg nem engedélyezi.</p>
          <a href="/">
            <ChevronLeft size={18} /> Vissza a VIR-be
          </a>
        </section>
      </main>
    );
  }

  const allowed = (key: string) => modules[key] !== false;
  const nav = [
    ["schedule", "/employee-app?view=schedule"],
    ["attendance", "/employee-app?view=attendance"],
    ["workorders", "/workorders"],
    ["tasks", "/employee-app?view=tasks"],
    ["chat", "/staff/chat"],
    ["knowledge", "/knowledge-base/library"],
    ["checklists", "/knowledge-base/checklists"],
    ["quiz", "/knowledge-base/quiz"],
    ["training", "/employee-app?view=training"],
    ["evaluations", "/employee-app?view=evaluations"],
    ["compensation", "/employee-app?view=compensation"],
  ].filter(([key]) => allowed(key));

  function ShiftList({ limit }: { limit?: number }) {
    const rows = limit ? shifts.slice(0, limit) : shifts;
    if (!rows.length) return <div className="ema-empty">Nincs rögzített következő műszak.</div>;
    return (
      <div className="ema-shifts">
        {rows.map((shift: any, index: number) => {
          const start = new Date(shift.starts_at || shift.start_at || shift.start || shift.date);
          const end = shift.ends_at || shift.end_at || shift.end ? new Date(shift.ends_at || shift.end_at || shift.end) : null;
          return (
            <article key={shift.id || `${shift.date}-${index}`}>
              <div className="ema-date">
                <b>{Number.isNaN(start.getTime()) ? shift.date || "—" : start.toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}</b>
                <span>{Number.isNaN(start.getTime()) ? "" : start.toLocaleDateString("hu-HU", { weekday: "short" })}</span>
              </div>
              <div>
                <b>{shift.location_name || shift.location || "Saját szalon"}</b>
                <span>
                  {Number.isNaN(start.getTime()) ? shift.time || "—" : start.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                  {end && !Number.isNaN(end.getTime()) ? ` – ${end.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function TaskList({ limit }: { limit?: number }) {
    const rows = limit ? tasks.slice(0, limit) : tasks;
    if (!rows.length) return <div className="ema-empty">Nincs aktív saját feladat.</div>;
    return (
      <div className="ema-tasks">
        {rows.map((task: any) => {
          const overdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== "approved";
          return (
            <article key={task.id} className={`${task.status || "open"} ${overdue ? "overdue" : ""}`}>
              <div className="ema-task-main">
                <div className="ema-task-head">
                  <b>{task.title}</b>
                  <span>{taskStatus[task.status] || task.status}</span>
                </div>
                {task.description && <p>{task.description}</p>}
                <small>
                  {task.due_at ? `Határidő: ${new Date(task.due_at).toLocaleString("hu-HU")}` : "Nincs határidő"}
                  {overdue ? " • LEJÁRT" : ""}
                </small>
              </div>
              {["open", "assigned", "in_progress"].includes(task.status) && (
                <button onClick={() => void completeTask(task.id)} disabled={loading}>
                  <CheckCircle2 size={16} /> Elvégeztem
                </button>
              )}
              {task.status === "completed" && (
                <div className="ema-waiting">
                  <Clock3 size={15} /> Vezetői jóváhagyásra vár
                </div>
              )}
              {task.status === "approved" && (
                <div className="ema-approved">
                  <CheckCircle2 size={15} /> Jóváhagyva
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  function Blocked() {
    return <section className="ema-section"><div className="ema-empty">Ez a Kleo Team modul ennél a fióknál nincs engedélyezve.</div></section>;
  }

  function Home() {
    return (
      <>
        <section className="ema-cards">
          <Card icon={CalendarDays} label="Ledolgozott nap / hó" value={attendance.worked_days_month ?? "—"} />
          <Card icon={WalletCards} label="Maradék szabadság" value={`${leave.remaining_days ?? "—"} nap`} />
          <Card icon={Clock3} label="Túlóra / év" value={`${Math.round(Number(attendance.overtime_minutes_year || 0) / 60)} óra`} />
        </section>
        <nav className="ema-quick ema-quick-wide">
          {nav.map(([key, href]) => {
            const [label, Icon] = moduleMeta[key] || [key, Wrench];
            return <a key={key} href={href}><Icon />{label}</a>;
          })}
        </nav>
        <section className="ema-section">
          <div className="ema-section-title"><h2>Saját feladatok</h2><a href="/employee-app?view=tasks">Összes feladat</a></div>
          {allowed("tasks") ? <TaskList limit={4} /> : <div className="ema-empty">A feladat modul nincs engedélyezve.</div>}
        </section>
        <section className="ema-section">
          <div className="ema-section-title"><h2>Következő műszakok</h2><a href="/employee-app?view=schedule">Teljes beosztás</a></div>
          <ShiftList limit={5} />
        </section>
      </>
    );
  }

  function Schedule() {
    if (!allowed("schedule")) return <Blocked />;
    return <section className="ema-section"><div className="ema-section-title"><h2>Következő 31 nap</h2><span className="ema-task-count">{shifts.length} műszak</span></div><ShiftList /></section>;
  }

  function Attendance() {
    if (!allowed("attendance")) return <Blocked />;
    return (
      <>
        <section className="ema-cards">
          <Card icon={CalendarDays} label="Ledolgozott nap / hó" value={attendance.worked_days_month ?? "—"} />
          <Card icon={Clock3} label="Rendes idő / év" value={`${Math.round(Number(attendance.regular_minutes_year || 0) / 60)} óra`} />
          <Card icon={Clock3} label="Túlóra / év" value={`${Math.round(Number(attendance.overtime_minutes_year || 0) / 60)} óra`} />
        </section>
        <section className="ema-section">
          <div className="ema-section-title"><h2>Szabadságkeret</h2></div>
          <div className="ema-leave">
            <div><span>Éves keret</span><b>{leave.entitlement_days ?? 20} nap</b></div>
            <div><span>Kivett</span><b>{leave.taken_days ?? 0} nap</b></div>
            <div><span>Függőben</span><b>{leave.pending_days ?? 0} nap</b></div>
            <div className="strong"><span>Maradék</span><b>{leave.remaining_days ?? "—"} nap</b></div>
          </div>
        </section>
        <section className="ema-section">
          <h2>Szabadságkérelmek</h2>
          <div className="ema-list">
            {(data?.leave_requests || []).map((request: any) => (
              <article key={request.id}>
                <div><b>{request.leave_type_name}</b><small>{request.date_from} – {request.date_to}</small></div>
                <span className={`ema-badge ${request.status}`}>{request.status}</span>
              </article>
            ))}
            {!(data?.leave_requests || []).length && <div className="ema-empty">Nincs rögzített szabadságkérelem.</div>}
          </div>
        </section>
      </>
    );
  }

  function Tasks() {
    if (!allowed("tasks")) return <Blocked />;
    return (
      <section className="ema-section">
        <div className="ema-section-title"><h2>Feladatok és jóváhagyások</h2><span className="ema-task-count">{tasks.filter((task: any) => task.status !== "approved").length} aktív</span></div>
        <p className="ema-help">Az elvégzett feladat vezetői jóváhagyásra kerül. A saját státusz és határidő itt mindig követhető.</p>
        <TaskList />
      </section>
    );
  }

  function Training() {
    if (!allowed("training")) return <Blocked />;
    const rows = development?.training || [];
    return (
      <section className="ema-section">
        <div className="ema-section-title"><h2>Saját képzések</h2><span className="ema-task-count">{rows.filter((row: any) => row.status !== "completed").length} aktív</span></div>
        <div className="ema-dev-grid">
          {rows.map((row: any) => (
            <article key={row.id}>
              <div className="ema-dev-icon"><GraduationCap /></div>
              <div>
                <b>{row.title}</b>
                <small>{row.provider || "Belső képzés"} • {row.duration_hours || "—"} óra{row.mandatory ? " • kötelező" : ""}</small>
                <p>{row.description || "Nincs leírás."}</p>
                <div className="ema-row-meta">
                  <span>Határidő: {row.due_date || "—"}</span><span>Státusz: {row.status}</span>{row.score != null && <span>Eredmény: {row.score}</span>}
                </div>
                {row.source_url && <a href={row.source_url} target="_blank" rel="noreferrer">Tananyag megnyitása</a>}
              </div>
            </article>
          ))}
          {!rows.length && <div className="ema-empty">Nincs hozzárendelt képzés.</div>}
        </div>
      </section>
    );
  }

  function Evaluations() {
    if (!allowed("evaluations")) return <Blocked />;
    const rows = development?.evaluations || [];
    return (
      <section className="ema-section">
        <div className="ema-section-title"><h2>Saját értékelések</h2><span className="ema-task-count">{rows.length} db</span></div>
        <div className="ema-evals">
          {rows.map((row: any) => <EvaluationCard key={row.id} row={row} onSave={saveEvaluationComment} loading={loading} />)}
          {!rows.length && <div className="ema-empty">Még nincs rögzített értékelés.</div>}
        </div>
      </section>
    );
  }

  function Compensation() {
    if (!allowed("compensation")) return <Blocked />;
    const assignment = compensation?.assignment;
    const history = compensation?.payroll_history || [];
    return (
      <>
        <section className="ema-section">
          <div className="ema-section-title"><h2>Saját bércsomag</h2></div>
          {assignment ? (
            <div className="ema-pay-plan">
              <div><span>Csomag</span><b>{assignment.plan_name || assignment.plan_code || "Egyedi"}</b></div>
              <div><span>Havi alap</span><b>{money(assignment.monthly_base ?? assignment.plan_monthly_base)}</b></div>
              <div><span>Órabér</span><b>{money(assignment.hourly_rate ?? assignment.plan_hourly_rate)}</b></div>
              <div><span>Szolgáltatás jutalék</span><b>{Number(assignment.service_commission_percent ?? assignment.plan_service_commission_percent ?? 0)}%</b></div>
              <div><span>Termék jutalék</span><b>{Number(assignment.product_commission_percent ?? assignment.plan_product_commission_percent ?? 0)}%</b></div>
            </div>
          ) : <div className="ema-empty">Nincs aktív bércsomag hozzárendelve.</div>}
        </section>
        <section className="ema-section">
          <h2>Elszámolási előzmények</h2>
          <div className="ema-pay-history">
            {history.map((row: any, index: number) => (
              <article key={`${row.period_from}-${index}`}>
                <div><b>{row.period_from} – {row.period_to}</b><small>{row.run_status} • {row.worked_days || 0} munkanap</small></div>
                <div className="ema-pay-values">
                  <span>Alap: <b>{money(row.base_pay)}</b></span>
                  <span>Jutalék: <b>{money(Number(row.service_commission || 0) + Number(row.product_commission || 0) + Number(row.revenue_commission || 0))}</b></span>
                  <span>Bruttó: <b>{money(row.gross_pay)}</b></span>
                  <span>Nettó: <b>{money(row.net_pay)}</b></span>
                </div>
              </article>
            ))}
            {!history.length && <div className="ema-empty">Még nincs lezárt vagy jóváhagyott elszámolás.</div>}
          </div>
        </section>
      </>
    );
  }

  return (
    <main className="ema-page">
      <header>
        <div>
          <div className="ema-kicker">{String(team?.brand_name || "KLEO TEAM").toUpperCase()} • DOLGOZÓI PORTÁL</div>
          <h1>{view === "home" ? `Szia, ${String(employee.full_name || "Kolléga").split(" ")[0]}!` : moduleMeta[view]?.[0] || "Kleo Team"}</h1>
          <p>{view === "home" ? `${employee.position_name || "Munkatárs"} • ${employee.location_name || "Saját szalon"}` : team?.welcome_message || "Saját munkatársi felület"}</p>
        </div>
        <button onClick={() => void load()} disabled={loading} title="Frissítés"><RefreshCw size={17} className={loading ? "spin" : ""} /></button>
      </header>
      {view !== "home" && <div className="ema-back"><a href="/employee-app"><ChevronLeft size={16} /> Kleo Team kezdőlap</a></div>}
      {error && <div className="ema-error">{error}</div>}
      {notice && <div className="ema-ok">{notice}</div>}
      {view === "home" && <Home />}
      {view === "schedule" && <Schedule />}
      {view === "attendance" && <Attendance />}
      {view === "tasks" && <Tasks />}
      {view === "training" && <Training />}
      {view === "evaluations" && <Evaluations />}
      {view === "compensation" && <Compensation />}
      <footer><UserRound size={16} /><span>{employee.full_name || employee.email || "Kleo Team fiók"}</span><a href="/">VIR megnyitása</a></footer>
    </main>
  );
}

function Card({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: React.ReactNode }) {
  return <article><Icon size={19} /><small>{label}</small><b>{value}</b></article>;
}

function EvaluationCard({ row, onSave, loading }: { row: any; onSave: (id: string, comment: string) => Promise<void>; loading: boolean }) {
  const [comment, setComment] = useState(row.employee_comment || row.comment || "");
  return (
    <article>
      <div className="ema-eval-top">
        <div><b>{row.title || row.period_name || "Értékelés"}</b><small>{row.evaluation_date || row.period_from || ""}</small></div>
        {row.score != null && <strong>{row.score}</strong>}
      </div>
      {row.manager_comment && <p>{row.manager_comment}</p>}
      <label>
        Saját megjegyzés
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Saját észrevétel..." />
      </label>
      <button onClick={() => void onSave(row.id, comment)} disabled={loading}>Megjegyzés mentése</button>
    </article>
  );
}
