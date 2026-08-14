import fs from "fs";
import path from "path";

const reception = fs.readFileSync(path.join(__dirname, "ReceptionDashboardPage.tsx"), "utf8");
const roleDashboard = fs.readFileSync(path.join(__dirname, "RoleDashboardPage.tsx"), "utf8");
const appLayout = fs.readFileSync(path.join(__dirname, "..", "layouts", "AppLayout.tsx"), "utf8");
const calendarCss = fs.readFileSync(path.join(__dirname, "OperationalCalendarBoard.css"), "utf8");

test("receptionist dashboard is calendar-first and defaults to the day-columns view", () => {
  expect(reception).toContain('AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}');
  expect(reception).not.toContain("DashboardDailyOperations");
  expect(reception).toContain("Recepciós irányítópult");
  expect(reception).toContain("Napi időpontnaptár");
});

test("receptionist dashboard includes the personal checklist", () => {
  expect(reception).toContain('DashboardChecklistCard from "../components/DashboardChecklistCard"');
  expect(reception).toContain("<DashboardChecklistCard />");
});

test("embedded receptionist day view uses one full visible width per day and horizontal snapping", () => {
  expect(calendarCss).toContain("container-type: inline-size");
  expect(calendarCss).toContain("scroll-snap-type: x mandatory");
  expect(calendarCss).toContain("repeat(5, minmax(calc(100cqw - 76px), calc(100cqw - 76px)))");
  expect(calendarCss).toContain(".calendar-embedded .operational-mode-switcher");
  expect(calendarCss).toContain("display: none");
});

test("receptionist does not inherit the generic work-order dashboard wrapper", () => {
  expect(roleDashboard).toContain("if(receptionist)return <ReceptionDashboardPage/>");
  expect(roleDashboard).not.toContain("<WithWorkOrders><ReceptionDashboardPage");
});

test("all receptionist role aliases use the staff shell without manager dashboard extras", () => {
  for (const alias of ["receptionist", "reception", "recepciós", "recepcios"]) {
    expect(appLayout).toContain(`\"${alias}\"`);
  }
  expect(appLayout).toContain("const isReceptionist=");
  expect(appLayout).toContain("const isStaff=isReceptionist||");
});
