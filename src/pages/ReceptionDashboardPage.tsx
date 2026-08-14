import React from "react";
import { CalendarDays, ClipboardPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardChecklistCard from "../components/DashboardChecklistCard";
import AppointmentsCalendarCore from "./AppointmentsCalendarCore";

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();

  return (
    <main style={{ padding: "22px 0 28px", maxWidth: 1900, margin: 0 }}>
      <section
        style={{
          margin: "0 24px 14px",
          padding: "18px 20px",
          border: "1px solid #eadfe4",
          borderRadius: 18,
          background: "linear-gradient(135deg,#fff 0%,#fff8fb 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              marginBottom: 5,
              color: "#9c2d65",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".09em",
              textTransform: "uppercase",
            }}
          >
            Recepciós irányítópult
          </span>
          <h1 style={{ margin: 0, color: "#2d2227", fontSize: 26 }}>Napi időpontnaptár</h1>
          <p style={{ margin: "6px 0 0", color: "#76676e", fontSize: 13 }}>
            A mai nap nyílik meg elsőként. Minden nap egy teljes naptárszélességet kap, a további napok oldalirányban görgethetők.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/appointments/calendar?mode=days")}
            style={quickButtonStyle}
          >
            <CalendarDays size={17} /> Teljes naptár
          </button>
          <button
            type="button"
            onClick={() => navigate("/workorders/new")}
            style={{ ...quickButtonStyle, borderColor: "#e9b6ce", color: "#9c2d65" }}
          >
            <ClipboardPlus size={17} /> Walk-in munkalap
          </button>
        </div>
      </section>

      <DashboardChecklistCard />

      <AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5} />
    </main>
  );
}

const quickButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 12px",
  border: "1px solid #e5dce0",
  borderRadius: 11,
  background: "#fff",
  color: "#4f4148",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 750,
};
