import React, { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarRange, Gauge, Target, Trophy } from "lucide-react";
import "./DashboardPeriodInsights.css";

type TrendRow = {
  date?: string;
  revenue?: number | string;
  service_revenue?: number | string;
  product_revenue?: number | string;
  completed?: number | string;
};

type Props = {
  chartData?: TrendRow[];
};

const money = (value: number) => `${Math.round(value).toLocaleString("hu-HU")} Ft`;
const number = (value: number, digits = 0) => value.toLocaleString("hu-HU", { maximumFractionDigits: digits });
const sum = (rows: TrendRow[], key: keyof TrendRow) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

export default function DashboardPeriodInsights({ chartData = [] }: Props) {
  const insights = useMemo(() => {
    const rows = chartData
      .filter((row) => row.date)
      .map((row) => ({ ...row, revenue: Number(row.revenue || 0), completed: Number(row.completed || 0) }));

    const current = rows.slice(-7);
    const previous = rows.slice(-14, -7);
    const currentRevenue = sum(current, "revenue");
    const previousRevenue = sum(previous, "revenue");
    const change = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const activeDays = current.filter((row) => Number(row.revenue || 0) > 0).length || current.length || 1;
    const dailyAverage = currentRevenue / activeDays;
    const projected30 = dailyAverage * 30;
    const completed = sum(current, "completed");
    const revenuePerService = completed > 0 ? currentRevenue / completed : 0;
    const bestDay = rows.reduce<TrendRow | null>((best, row) => !best || Number(row.revenue) > Number(best.revenue) ? row : best, null);

    return { currentRevenue, previousRevenue, change, dailyAverage, projected30, completed, revenuePerService, bestDay };
  }, [chartData]);

  const growing = insights.change >= 0;

  return (
    <section className="period-insights" aria-label="Időszaki vezetői mutatók">
      <article className="period-insight-card period-insight-card--comparison">
        <div className="period-insight-icon"><CalendarRange aria-hidden="true" /></div>
        <div>
          <span>UTOLSÓ 7 NAP</span>
          <strong>{money(insights.currentRevenue)}</strong>
          <small>előző 7 nap: {money(insights.previousRevenue)}</small>
        </div>
        <div className={`period-change ${growing ? "is-positive" : "is-negative"}`}>
          {growing ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
          {number(Math.abs(insights.change), 1)}%
        </div>
      </article>

      <article className="period-insight-card">
        <div className="period-insight-icon"><Gauge aria-hidden="true" /></div>
        <div><span>NAPI ÁTLAG</span><strong>{money(insights.dailyAverage)}</strong><small>aktív napokra vetítve</small></div>
      </article>

      <article className="period-insight-card">
        <div className="period-insight-icon"><Target aria-hidden="true" /></div>
        <div><span>30 NAPOS ELŐREJELZÉS</span><strong>{money(insights.projected30)}</strong><small>az utolsó 7 nap ütemével</small></div>
      </article>

      <article className="period-insight-card">
        <div className="period-insight-icon"><Trophy aria-hidden="true" /></div>
        <div><span>LEGJOBB NAP</span><strong>{money(Number(insights.bestDay?.revenue || 0))}</strong><small>{insights.bestDay?.date || "nincs adat"}</small></div>
      </article>

      <article className="period-insight-card">
        <div className="period-insight-icon"><Target aria-hidden="true" /></div>
        <div><span>BEVÉTEL / TELJESÍTÉS</span><strong>{money(insights.revenuePerService)}</strong><small>{number(insights.completed)} teljesített szolgáltatás</small></div>
      </article>
    </section>
  );
}
