// src/components/CalendarWidget.tsx
import React from "react";

const CalendarWidget = () => {
  const today = new Date();
  const dateString = today.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>📅 Naptár</h3>
      <p style={{ fontSize: "18px", fontWeight: "500" }}>{dateString}</p>
    </div>
  );
};

export default CalendarWidget;
