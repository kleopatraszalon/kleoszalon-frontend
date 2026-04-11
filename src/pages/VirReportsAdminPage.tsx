import React, { useEffect, useState } from "react";
import {
  createVirReportSubscription,
  deleteVirReportSubscription,
  getVirReportSubscriptions,
  sendVirReportNow,
  updateVirReportSubscription,
  VirReportSubscription,
} from "../api/virReports";

const emptyForm = {
  email: "",
  frequency: "daily" as "daily" | "weekly",
  is_enabled: true,
  location_id: "",
  weekday: 1,
  send_hour: 7,
  send_minute: 0,
  timezone: "Europe/Budapest",
  recipient_name: "",
};

export default function VirReportsAdminPage() {
  const [rows, setRows] = useState<VirReportSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    setError("");
    try { setRows(await getVirReportSubscriptions()); }
    catch (e: any) { setError(e?.message || "vir_reports_load_failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function onCreate() {
    try {
      await createVirReportSubscription({
        ...form,
        location_id: form.location_id || null,
        recipient_name: form.recipient_name || null,
      });
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e?.message || "vir_reports_create_failed");
    }
  }

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100vh" }}>
      <h1 style={{ marginTop: 0 }}>VIR automatikus email riportok</h1>
      {error ? <div style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div> : null}
      {loading ? <div>Betöltés…</div> : null}

      <div style={{ background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Új előfizetés</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12 }}>
          <input placeholder="Email cím" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Címzett neve" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as "daily" | "weekly" })}>
            <option value="daily">Napi</option>
            <option value="weekly">Heti</option>
          </select>
          <input placeholder="Location ID (opcionális)" value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })} />
          <input type="number" placeholder="Hét napja (0-6)" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })} />
          <input type="number" placeholder="Óra" value={form.send_hour} onChange={(e) => setForm({ ...form, send_hour: Number(e.target.value) })} />
          <input type="number" placeholder="Perc" value={form.send_minute} onChange={(e) => setForm({ ...form, send_minute: Number(e.target.value) })} />
          <input placeholder="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button onClick={onCreate}>Mentés</button>
          <button onClick={() => sendVirReportNow({ email: form.email, frequency: form.frequency, location_id: form.location_id || null, recipient_name: form.recipient_name || null })}>
            Küldés most
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Aktív előfizetések</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Email</th>
              <th style={th}>Frekvencia</th>
              <th style={th}>Helyszín</th>
              <th style={th}>Idő</th>
              <th style={th}>Állapot</th>
              <th style={th}>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.email}</td>
                <td style={td}>{row.frequency}</td>
                <td style={td}>{row.location_id || "Minden helyszín"}</td>
                <td style={td}>{String(row.send_hour).padStart(2, "0")}:{String(row.send_minute).padStart(2, "0")}</td>
                <td style={td}>{row.is_enabled ? "Aktív" : "Tiltott"}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateVirReportSubscription(row.id, { ...row, is_enabled: !row.is_enabled }).then(load)}>
                      {row.is_enabled ? "Tiltás" : "Engedélyezés"}
                    </button>
                    <button onClick={() => deleteVirReportSubscription(row.id).then(load)}>Törlés</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #ececec" };
const td: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" };
