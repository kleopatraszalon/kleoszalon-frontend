import { describe, expect, it } from "vitest";
import { buildAppointmentISO } from "./AppointmentNewModal";

describe("AppointmentNewModal appointment ISO range", () => {
  it("keeps a normal same-day range ordered", () => {
    const range = buildAppointmentISO("2026-09-01", "10:00", "10:30");
    expect(new Date(range.end).getTime() - new Date(range.start).getTime()).toBe(30 * 60 * 1000);
  });

  it("rolls a 23:30 to 00:00 booking into the next day", () => {
    const range = buildAppointmentISO("2026-09-01", "23:30", "00:00");
    expect(new Date(range.end).getTime() - new Date(range.start).getTime()).toBe(30 * 60 * 1000);
    expect(new Date(range.end).getTime()).toBeGreaterThan(new Date(range.start).getTime());
  });

  it("rolls a 23:30 to 00:30 booking into the next day", () => {
    const range = buildAppointmentISO("2026-09-01", "23:30", "00:30");
    expect(new Date(range.end).getTime() - new Date(range.start).getTime()).toBe(60 * 60 * 1000);
  });
});
