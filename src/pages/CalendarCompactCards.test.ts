import fs from "fs";
import path from "path";

const calendar = fs.readFileSync(path.join(__dirname, "AppointmentsCalendarCore.tsx"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "OperationalCalendarBoard.css"), "utf8");

test("calendar appointments stay compact while retaining readable metadata", () => {
  expect(calendar).toContain("Math.min(72, Math.max(48, naturalEventHeight))");
  expect(styles).toContain("max-width: min(520px, calc(100% - 8px))");
  expect(styles).toContain(".operational-calendar-event .operational-event-created");
  expect(styles).toContain("-webkit-line-clamp: 1");
});
