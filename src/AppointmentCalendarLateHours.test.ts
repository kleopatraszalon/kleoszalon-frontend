import { describe, expect, it } from "vitest";
import { appointmentDisplayMinutes } from "./pages/AppointmentsCalendarCore";

describe("appointment calendar late-hour layout", () => {
  it("keeps a late same-day appointment visible after 21:00", () => {
    const start = new Date(2026, 8, 1, 23, 0).toISOString();
    const end = new Date(2026, 8, 1, 23, 30).toISOString();
    expect(appointmentDisplayMinutes(start, end)).toEqual({ startMinutes: 23 * 60, endMinutes: 23 * 60 + 30 });
  });

  it("maps 23:30 to 00:00 onto the end of the selected calendar day", () => {
    const start = new Date(2026, 8, 1, 23, 30).toISOString();
    const end = new Date(2026, 8, 2, 0, 0).toISOString();
    expect(appointmentDisplayMinutes(start, end)).toEqual({ startMinutes: 23 * 60 + 30, endMinutes: 24 * 60 });
  });

  it("keeps the visible part of a booking that continues after midnight ordered", () => {
    const start = new Date(2026, 8, 1, 23, 30).toISOString();
    const end = new Date(2026, 8, 2, 0, 30).toISOString();
    const range = appointmentDisplayMinutes(start, end);
    expect(range.endMinutes).toBeGreaterThan(range.startMinutes);
    expect(range.endMinutes - range.startMinutes).toBe(60);
  });
});
