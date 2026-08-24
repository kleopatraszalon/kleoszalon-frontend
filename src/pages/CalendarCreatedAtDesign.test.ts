import fs from "fs";
import path from "path";

const calendar = fs.readFileSync(path.join(__dirname, "AppointmentsCalendarCore.tsx"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "OperationalCalendarBoard.css"), "utf8");

test("calendar cards show the exact appointment creation timestamp at the bottom", () => {
  expect(calendar).toContain("created_at?: string | null");
  expect(calendar).toContain("year: \"numeric\", month: \"2-digit\", day: \"2-digit\", hour: \"2-digit\", minute: \"2-digit\"");
  expect(calendar).toContain('className="operational-event-created"');
  expect(styles).toContain(".operational-calendar-event .operational-event-created");
  expect(styles).toContain("margin-top: auto");
});
