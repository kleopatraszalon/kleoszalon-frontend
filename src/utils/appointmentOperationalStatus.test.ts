import { appointmentOperationalStatus } from "./appointmentOperationalStatus";

const now = new Date("2026-08-14T10:00:00.000Z");

test("future confirmed appointment is waiting", () => {
  expect(appointmentOperationalStatus({ status: "confirmed", start_time: "2026-08-14T11:00:00.000Z" }, now)).toMatchObject({
    key: "waiting",
    label: "Várakozás",
    closed: false,
  });
});

test("past waiting appointment becomes late automatically", () => {
  expect(appointmentOperationalStatus({ status: "confirmed", start_time: "2026-08-14T09:30:00.000Z" }, now)).toMatchObject({
    key: "late",
    label: "Késésben",
  });
});

test("arrived and in-progress statuses have priority over lateness", () => {
  expect(appointmentOperationalStatus({ operational_status: "arrived", start_time: "2026-08-14T09:00:00.000Z" }, now).label).toBe("Megérkezett");
  expect(appointmentOperationalStatus({ operational_status: "in_progress", start_time: "2026-08-14T09:00:00.000Z" }, now).label).toBe("Folyamatban");
});

test("closed work order is rendered as terminal grey status", () => {
  expect(appointmentOperationalStatus({ operational_status: "work_order_closed", start_time: "2026-08-14T09:00:00.000Z" }, now)).toMatchObject({
    key: "closed",
    label: "Munkalap lezárva",
    className: "status-closed",
    closed: true,
  });
});
