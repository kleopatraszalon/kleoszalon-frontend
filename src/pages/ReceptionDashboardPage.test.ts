import fs from "fs";
import path from "path";

const reception = fs.readFileSync(path.join(__dirname, "ReceptionDashboardPage.tsx"), "utf8");
const roleDashboard = fs.readFileSync(path.join(__dirname, "RoleDashboardPage.tsx"), "utf8");
const appLayout = fs.readFileSync(path.join(__dirname, "..", "layouts", "AppLayout.tsx"), "utf8");

test("receptionist dashboard is calendar-first and defaults to the day-columns view", () => {
  expect(reception).toContain('AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}');
  expect(reception).not.toContain("DashboardDailyOperations");
  expect(reception).toContain("Recepciós irányítópult");
  expect(reception).toContain("Napi időpontnaptár");
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
