import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVirServiceDetail, VirServiceDetailResponse } from "../api/virDrilldown";

function money(v?: number | null) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(v || 0));
}
function num(v?: number | null) {
  return new Intl.NumberFormat("hu-HU").format(Number(v || 0));
}

export default function VirServiceDetailPage() {
  const { serviceId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<VirServiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setError("");
    getVirServiceDetail(serviceId).then(setData).catch((e: any) => setError(e?.message || "service_detail_failed")).finally(() => setLoading(false));
  }, [serviceId]);

  const totals = useMemo(() => {
    const rows = data?.staff || [];
    return {
      revenue: rows.reduce((s, r) => s + Number(r.revenue_total || 0), 0),
      bookings: rows.reduce((s, r) => s + Number(r.bookings_count || 0), 0),
    };
  }, [data]);

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Szolgáltatás drill-down</h1>
          <div style={{ opacity: 0.7, marginTop: 6 }}>{data?.service?.service_name || serviceId}</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ height: 36, padding: "0 16px", cursor: "pointer" }}>Vissza</button>
      </div>

      {loading ? <div>Betöltés…</div> : null}
      {error ? <div style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div> : null}

      {data?.service ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={cardStyle}><div style={labelStyle}>Szolgáltatás</div><div style={valueStyle}>{data.service.service_name}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Foglalás</div><div style={valueStyle}>{num(data.service.bookings_count)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Árbevétel</div><div style={valueStyle}>{money(data.service.revenue_total)}</div></div>
            <div style={cardStyle}><div style={labelStyle}>Átlagár</div><div style={valueStyle}>{money(data.service.avg_price)}</div></div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitle}>Dolgozó bontás</div>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Dolgozó</th><th style={thStyle}>Foglalás</th><th style={thStyle}>Árbevétel</th></tr></thead>
              <tbody>
                {data.staff.map((row) => (
                  <tr key={row.employee_id}>
                    <td style={tdStyle}>{row.staff_name}</td>
                    <td style={tdStyle}>{num(row.bookings_count)}</td>
                    <td style={tdStyle}>{money(row.revenue_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, fontWeight: 700 }}>Összesen: {num(totals.bookings)} foglalás • {money(totals.revenue)}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" };
const labelStyle: React.CSSProperties = { fontSize: 13, opacity: 0.7, marginBottom: 8 };
const valueStyle: React.CSSProperties = { fontSize: 26, fontWeight: 800 };
const sectionStyle: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginBottom: 20 };
const sectionTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginBottom: 14 };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #ececec", opacity: 0.7 };
const tdStyle: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #f3f4f6" };
