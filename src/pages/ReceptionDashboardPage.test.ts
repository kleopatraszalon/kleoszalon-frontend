import fs from "fs";
import path from "path";

const reception = fs.readFileSync(path.join(__dirname, "ReceptionDashboardPage.tsx"), "utf8");
const roleDashboard = fs.readFileSync(path.join(__dirname, "RoleDashboardPage.tsx"), "utf8");
const appLayout = fs.readFileSync(path.join(__dirname, "..", "layouts", "AppLayout.tsx"), "utf8");
const calendarCss = fs.readFileSync(path.join(__dirname, "OperationalCalendarBoard.css"), "utf8");

test("receptionist dashboard is calendar-first when calendar visibility is enabled", () => {
  expect(reception).toContain('AppointmentsCalendarCore embedded initialMode="days" visibleDayCount={5}');
  expect(reception).toContain("showCalendar&&<section");
  expect(reception).toContain("DashboardDailyOperations");
  expect(reception).toContain("Recepciós munkatér");
  expect(reception).toContain("Mai operáció");
  expect(reception).toContain('className="reception-home__calendar"');
});

test("receptionist dashboard keeps the compact operational checklist on the homepage", () => {
  expect(reception).toContain('DashboardChecklistCard from"../components/DashboardChecklistCard"');
  expect(reception).toContain('<section className="reception-home__checklist"><DashboardChecklistCard/></section>');
  expect(reception).not.toContain("<ReceptionDeviceControlPanel/>");
  expect(reception).toContain("<DashboardDailyOperations compact/>");
});

test("receptionist homepage exposes product sales by default", () => {
  expect(reception).toContain("key:'product_sale'");
  expect(reception).toContain("name:'Termékeladás'");
  expect(reception).toContain("route:'/finance/product-sale'");
});

test("embedded receptionist day view uses one full visible width per day and horizontal snapping", () => {
  expect(calendarCss).toContain("container-type: inline-size");
  expect(calendarCss).toContain("scroll-snap-type: x mandatory");
  expect(calendarCss).toContain("repeat(5, minmax(calc(100cqw - 76px), calc(100cqw - 76px)))");
  expect(calendarCss).toContain(".calendar-embedded .operational-mode-switcher");
  expect(calendarCss).toContain("display: none");
});

test("receptionist does not inherit the generic work-order dashboard wrapper", () => {
  expect(roleDashboard).toContain("if(receptionist||locationOperator)return <ReceptionDashboardPage/>");
  expect(roleDashboard).not.toContain("<WithWorkOrders><ReceptionDashboardPage");
});

test("all receptionist role aliases use the staff shell without manager dashboard extras", () => {
  for (const alias of ["receptionist", "reception", "recepciós", "recepcios"]) {
    expect(appLayout).toContain(`"${alias}"`);
  }
  expect(appLayout).toContain("const isReceptionist=");
  expect(appLayout).toContain("const isStaff=isReceptionist||");
});
