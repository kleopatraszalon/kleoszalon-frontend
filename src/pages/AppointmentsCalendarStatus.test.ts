import fs from "fs";
import path from "path";

const core = fs.readFileSync(path.join(__dirname, "AppointmentsCalendarCore.tsx"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "OperationalCalendarBoard.css"), "utf8");
const reception = fs.readFileSync(path.join(__dirname, "ReceptionDashboardPage.tsx"), "utf8");

test("all calendar modes use the shared operational status renderer", () => {
  expect(core).toContain("appointmentOperationalStatus(item, statusNow)");
  expect(core).toContain('className="operational-status-badge"');
  expect(core).toContain('draggable={!operational.closed}');
  expect(core).toContain('mode === "days"');
  expect(core).toContain('mode === "staff"');
  expect(core).toContain('mode === "services"');
});

test("calendar cards are enlarged and terminal work orders are greyed out", () => {
  expect(core).toContain("const SLOT_HEIGHT = 30");
  expect(core).toContain("maxConcurrentLanes * 170");
  expect(css).toContain(".operational-calendar-event.status-late");
  expect(css).toContain(".operational-calendar-event.status-arrived");
  expect(css).toContain(".operational-calendar-event.status-in-progress");
  expect(css).toContain(".operational-calendar-event.status-closed");
  expect(css).toContain("filter: grayscale(.82) saturate(.18)");
});

test("receptionist dashboard keeps compact operations and full-width scrolling days", () => {
  expect(reception).toContain("<DashboardDailyOperations compact/>");
  expect(reception).toContain("showCalendar&&<section");
  expect(reception).toContain('AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}');
  expect(css).toContain("scroll-snap-type: x mandatory");
  expect(css).toContain("calc(100cqw - 76px)");
});
