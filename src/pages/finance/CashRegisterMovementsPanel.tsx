import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, RotateCcw } from "lucide-react";
import api from "../../api";
import "./CashRegisterMovementsPanel.css";

type Movement = {
  id: string | number;
  direction: "in" | "out";
  amount: number;
  reason_code: string;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
  voided_at?: string | null;
  void_reason?: string | null;
};

type ResponseShape = {
  cash_in: number;
  cash_out: number;
  net: number;
  rows: Movement[];
};

type Props = {
  onChanged?: () => void | Promise<void>;
};

const HUF = (value: unknown) =>
  `${Math.round(Number(value || 0)).toLocaleString("hu-HU")} Ft`;

const localDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const reasonLabels: Record<string, string> = {
  float: "Váltópénz betét",
  cash_withdrawal: "Készpénz kivét",
  bank_deposit: "Banki befizetés",
  petty_cash: "Kisösszegű kiadás",
  correction: "Korrekció",
  other: "Egyéb",
};

export default function CashRegisterMovementsPanel({ onChanged }: Props) {
  const locationId = localStorage.getItem("kleo_location_id") || "";
  const locationName = localStorage.getItem("kleo_location_name") || "";
  const businessDate = localDate();

  const [data, setData] = useState<ResponseShape>({ cash_in: 0, cash_out: 0, net: 0, rows: [] });
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState(0);
  const [reasonCode, setReasonCode] = useState("float");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeRows = useMemo(() => data.rows.filter((row) => !row.voided_at), [data.rows]);

  async function load() {
    if (!locationId) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/api/transactions/cashier/register-movements?date=${businessDate}&location_id=${encodeURIComponent(locationId)}`,
      );
      setData(response.data || { cash_in: 0, cash_out: 0, net: 0, rows: [] });
    } catch (e: any) {
      setError(e?.response?.data?.message || "A kasszamozgások nem tölthetők be.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [locationId]);

  async function save() {
    if (!locationId) return;
    if (!(Number(amount) > 0)) {
      setError("Adj meg pozitív összeget.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await api.post("/api/transactions/cashier/register-movements", {
        location_id: locationId,
        business_date: businessDate,
        direction,
        amount: Number(amount),
        reason_code: reasonCode,
        note: note.trim() || null,
      });
      setAmount(0);
      setNote("");
      setNotice(direction === "in" ? "Kasszabevét rögzítve." : "Kasszakivét rögzítve.");
      await load();
      await onChanged?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || "A kasszamozgás nem menthető.");
    } finally {
      setLoading(false);
    }
  }

  async function voidMovement(row: Movement) {
    if (!locationId || row.voided_at) return;
    const reason = window.prompt("A visszavonás indoka:", "Téves rögzítés");
    if (!reason?.trim()) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/api/transactions/cashier/register-movements/${row.id}/void`, {
        location_id: locationId,
        reason: reason.trim(),
      });
      setNotice("A kasszamozgás visszavonva.");
      await load();
      await onChanged?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || "A kasszamozgás nem vonható vissza.");
    } finally {
      setLoading(false);
    }
  }

  if (!locationId) {
    return (
      <section className="crm-card crm-empty-location">
        <h2>Kasszamozgások</h2>
        <p>Válassz telephelyet a kasszabevét és kasszakivét kezeléséhez.</p>
      </section>
    );
  }

  return (
    <section className="crm-card">
      <header className="crm-head">
        <div>
          <span className="crm-eyebrow">NAPI KASSZA</span>
          <h2>Kasszamozgások</h2>
          <p>
            {businessDate} · {locationName || "Kiválasztott telephely"} · a napi zárás ezeket a mozgásokat is figyelembe veszi.
          </p>
        </div>
        <button className="crm-refresh" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> Frissítés
        </button>
      </header>

      <div className="crm-kpis">
        <article>
          <span>Mai kasszabevét</span>
          <b>{HUF(data.cash_in)}</b>
        </article>
        <article>
          <span>Mai kasszakivét</span>
          <b>{HUF(data.cash_out)}</b>
        </article>
        <article>
          <span>Nettó kasszamozgás</span>
          <b className={Number(data.net) < 0 ? "neg" : "pos"}>{HUF(data.net)}</b>
        </article>
        <article>
          <span>Aktív tételek</span>
          <b>{activeRows.length}</b>
        </article>
      </div>

      {error && <div className="crm-alert error">{error}</div>}
      {notice && <div className="crm-alert ok">{notice}</div>}

      <div className="crm-form">
        <div className="crm-direction">
          <button
            type="button"
            className={direction === "in" ? "active in" : ""}
            onClick={() => setDirection("in")}
          >
            <ArrowDownCircle size={17} /> Bevét
          </button>
          <button
            type="button"
            className={direction === "out" ? "active out" : ""}
            onClick={() => setDirection("out")}
          >
            <ArrowUpCircle size={17} /> Kivét
          </button>
        </div>
        <label>
          Összeg
          <input
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label>
          Jogcím
          <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            {Object.entries(reasonLabels).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>
        <label className="crm-note">
          Megjegyzés
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Pl. váltópénz, banki befizetés, elszámolás…"
          />
        </label>
        <button className="crm-save" onClick={() => void save()} disabled={loading || !(amount > 0)}>
          {direction === "in" ? "Bevét rögzítése" : "Kivét rögzítése"}
        </button>
      </div>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Idő</th>
              <th>Irány</th>
              <th>Jogcím</th>
              <th>Megjegyzés</th>
              <th>Rögzítette</th>
              <th>Összeg</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={String(row.id)} className={row.voided_at ? "voided" : ""}>
                <td>{new Date(row.created_at).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{row.direction === "in" ? "Bevét" : "Kivét"}</td>
                <td>{reasonLabels[row.reason_code] || row.reason_code}</td>
                <td>{row.voided_at ? `Visszavonva: ${row.void_reason || "—"}` : row.note || "—"}</td>
                <td>{row.created_by || "—"}</td>
                <td className={row.direction === "out" ? "neg" : "pos"}>
                  {row.direction === "out" ? "−" : "+"}{HUF(row.amount)}
                </td>
                <td>
                  {!row.voided_at && (
                    <button className="crm-void" onClick={() => void voidMovement(row)} disabled={loading} title="Visszavonás">
                      <RotateCcw size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!data.rows.length && (
              <tr>
                <td colSpan={7} className="crm-empty">Ma még nincs kasszamozgás.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
