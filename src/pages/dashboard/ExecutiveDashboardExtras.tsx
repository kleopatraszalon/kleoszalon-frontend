import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardPlus,
  PackagePlus,
  ReceiptText,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import "./ExecutiveDashboardExtras.css";

type DashboardStats = Record<string, number | string | null | undefined>;

type DashboardAlert = {
  level?: string;
  title?: string;
  detail?: string;
};

type Props = {
  stats: DashboardStats;
  alerts?: DashboardAlert[];
};

const money = (value: unknown) =>
  `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;

const number = (value: unknown) =>
  Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 });

export default function ExecutiveDashboardExtras({ stats, alerts = [] }: Props) {
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const appointments = Number(stats.activeAppointments || 0);
    const newClients = Number(stats.newClients || 0);
    const noShows = Number(stats.noShowCount || 0);
    const revenue = Number(stats.totalRevenue || 0);
    const capacity = Number(stats.averageCapacity || 0);

    const riskText = alerts.length
      ? `${alerts.length} vezetői figyelmeztetés vár ellenőrzésre.`
      : "Jelenleg nincs kiemelt vezetői kockázat.";

    return {
      headline:
        capacity >= 80
          ? "A működés magas kihasználtság mellett stabil."
          : capacity >= 55
            ? "A kapacitás megfelelő, de még van értékesíthető idő."
            : "A kapacitáskihasználtság alacsony, marketing- vagy beosztási beavatkozás indokolt.",
      body: `${number(appointments)} aktív időpont, ${number(newClients)} új vendég és ${number(noShows)} meg nem jelenés mellett ${money(revenue)} bevétel keletkezett a kiválasztott időszakban. ${riskText}`,
    };
  }, [alerts.length, stats]);

  const actions = [
    { label: "Új időpont", path: "/appointments/new", icon: CalendarPlus },
    { label: "Új munkalap", path: "/workorders/new", icon: ClipboardPlus },
    { label: "Új vendég", path: "/modules/customers/new", icon: UserPlus },
    { label: "Új dolgozó", path: "/hr/employees/new", icon: Users },
    { label: "Új beszerzés", path: "/inventory/purchase", icon: PackagePlus },
    { label: "Új számla", path: "/finance/invoices/out", icon: ReceiptText },
  ];

  return (
    <section className="executive-extras">
      <article className="executive-summary-card">
        <div className="executive-summary-card__icon">
          <Sparkles aria-hidden="true" />
        </div>
        <div className="executive-summary-card__content">
          <span>VEZETŐI ÖSSZEFOGLALÓ</span>
          <h2>{summary.headline}</h2>
          <p>{summary.body}</p>
        </div>
        {alerts.length > 0 && (
          <div className="executive-summary-card__risk">
            <AlertTriangle aria-hidden="true" />
            <strong>{alerts.length}</strong>
            <small>figyelmeztetés</small>
          </div>
        )}
      </article>

      <article className="executive-actions-card">
        <header>
          <div>
            <span>GYORSMŰVELETEK</span>
            <h2>Gyakori feladatok</h2>
          </div>
        </header>
        <div className="executive-actions-grid">
          {actions.map(({ label, path, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate(path)}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
