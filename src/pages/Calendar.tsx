// src/pages/Calendar.tsx
import React from "react";
import Sidebar from "../components/Sidebar";
import { useCurrentUser } from "../hooks/useCurrentUser";

const CalendarPage: React.FC = () => {
  const { user } = useCurrentUser();

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />
      <main className="calendar-container">
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          Naptár
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#4b5563" }}>
          A részletes naptár nézet fejlesztés alatt áll. A bejelentkezések a
          „Napi bejelentkezések” oldalon érhetők el.
        </p>
      </main>
    </div>
  );
};

export default CalendarPage;
