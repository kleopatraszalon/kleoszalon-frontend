import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, FileWarning, MessageCircle, PackageX, RefreshCw, ShieldAlert, Sparkles, Truck, WalletCards, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import OperationalAlertSummary from "../components/OperationalAlertSummary";
import "./NotificationsPage.css";

type NotificationItem = {
  key: string;
  type: "chat" | "stock" | "no_show" | "task" | "ai" | "finance" | "workorder" | "loyalty" | "supplier_expiry" | "employee_document" | "complaint_sla";
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  route?: string;
  created_at: string;
  read: boolean;
};

const iconFor = (type: NotificationItem["type"]) => {
  if (type === "chat") return <MessageCircle/>;
  if (type === "stock") return <PackageX/>;
  if (type === "ai") return <Sparkles/>;
  if (type === "finance" || type === "workorder") return <WalletCards/>;
  if (type === "supplier_expiry") return <Truck/>;
  if (type === "employee_document") return <FileWarning/>;
  if (type === "complaint_sla") return <ShieldAlert/>;
  return <AlertTriangle/>;
};
const labelFor = (type: NotificationItem["type"]) => ({
  chat:"chat",stock:"készlet",no_show:"no-show",task:"teendő",ai:"AI",finance:"pénzügy",workorder:"munkalap",loyalty:"hűségprogram",
  supplier_expiry:"beszállítói lejárat",employee_document:"dolgozói dokumentum",complaint_sla:"panasz SLA",
}[type] || type.replace("_", " "));

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await api.get("/transactions/notifications");
      setItems(r.data?.items || []);
    } catch (e:any) {
      setError(e?.response?.data?.message || e?.message || "Az értesítések betöltése sikertelen.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => items.filter(item => filter === "all" ? true : filter === "unread" ? !item.read : item.severity === "critical"), [items, filter]);
  const unread = items.filter(x => !x.read).length;
  const critical = items.filter(x => x.severity === "critical").length;

  const markRead = async (item: NotificationItem) => {
    if (!item.read) {
      await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/read`);
      setItems(current => current.map(x => x.key === item.key ? { ...x, read:true } : x));
    }
    if (item.route) navigate(item.route);
  };

  const dismiss = async (item: NotificationItem) => {
    await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/dismiss`);
    setItems(current => current.filter(x => x.key !== item.key));
  };

  const markAll = async () => {
    for (const item of items.filter(x => !x.read)) {
      await api.post(`/transactions/notifications/${encodeURIComponent(item.key)}/read`);
    }
    setItems(current => current.map(x => ({ ...x, read:true })));
  };

  return <main className="notify-page">
    <section className="notify-hero">
      <div><span>VEZETŐI ÉS OPERATÍV FIGYELMEZTETÉSEK</span><h1>Értesítési központ</h1><p>Chat, készlet, no-show, teendők, pénzügy, beszállítói lejáratok, dolgozói dokumentumok és panasz-SLA egy helyen.</p></div>
      <div className="notify-actions"><button onClick={load}><RefreshCw className={loading ? "spin" : ""}/>Frissítés</button><button onClick={markAll} disabled={!unread}><CheckCheck/>Mind olvasott</button></div>
    </section>

    <section className="notify-stats">
      <article><Bell/><div><small>Összes aktív</small><strong>{items.length}</strong></div></article>
      <article><MessageCircle/><div><small>Olvasatlan</small><strong>{unread}</strong></div></article>
      <article><AlertTriangle/><div><small>Kritikus</small><strong>{critical}</strong></div></article>
    </section>

    <OperationalAlertSummary/>

    <div className="notify-tabs">
      <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Összes</button>
      <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Olvasatlan</button>
      <button className={filter === "critical" ? "active" : ""} onClick={() => setFilter("critical")}>Kritikus</button>
    </div>

    {error && <div className="notify-error"><AlertTriangle/>{error}</div>}
    {loading && !items.length ? <div className="notify-loading"><RefreshCw className="spin"/>Értesítések összeállítása…</div> : null}

    <section className="notify-list">
      {visible.map(item => <article key={item.key} className={`notify-card sev-${item.severity} ${item.read ? "is-read" : ""}`}>
        <button className="notify-main" onClick={() => void markRead(item)}>
          <span className="notify-icon">{iconFor(item.type)}</span>
          <span className="notify-copy"><small>{labelFor(item.type)}</small><b>{item.title}</b><p>{item.detail}</p><em>{new Intl.DateTimeFormat("hu-HU", { dateStyle:"medium", timeStyle:"short" }).format(new Date(item.created_at))}</em></span>
          {!item.read && <i className="notify-dot"/>}
        </button>
        <button className="notify-dismiss" onClick={() => void dismiss(item)} title="Elrejtés"><X/></button>
      </article>)}
      {!loading && visible.length === 0 && <div className="notify-empty"><CheckCheck/><h3>Nincs megjelenítendő értesítés</h3><p>A kiválasztott szűrőben jelenleg nincs teendő.</p></div>}
    </section>
  </main>;
}
