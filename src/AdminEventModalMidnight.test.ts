import { describe, expect, it } from "vitest";
import { buildAppointmentTimeRange } from "./AdminEventModal";

describe("AdminEventModal appointment time range", () => {
  it("keeps a normal same-day appointment on the selected date", () => {
    expect(buildAppointmentTimeRange("2026-09-01", "10:00", "10:30")).toEqual({
      start_time: "2026-09-01 10:00",
      end_time: "2026-09-01 10:30",
    });
  });

  it("moves an end time after midnight to the next calendar day", () => {
    expect(buildAppointmentTimeRange("2026-09-01", "23:30", "00:00")).toEqual({
      start_time: "2026-09-01 23:30",
      end_time: "2026-09-02 00:00",
    });
  });

  it("moves a later-after-midnight end to the next day as well", () => {
    expect(buildAppointmentTimeRange("2026-09-01", "23:30", "00:30")).toEqual({
      start_time: "2026-09-01 23:30",
      end_time: "2026-09-02 00:30",
    });
  });
});
