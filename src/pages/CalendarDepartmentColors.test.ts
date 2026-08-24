import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(__dirname, "AppointmentsCalendarCore.tsx"), "utf8");

test("calendar uses a distinct stable color for every salon department", () => {
  for (const department of ["Fodrászat", "Barber", "Kozmetika", "Szempilla és szemöldök", "Smink", "Kézápolás", "Lábápolás", "Masszázs", "Testkezelés", "Szolárium", "Egyéb"]) {
    expect(source).toContain(`"${department}": { background:`);
  }
  expect(source).toContain("return new Map(DEPARTMENTS.map((key) => [key, DEPARTMENT_STYLES[key]]))");
  expect(source).not.toContain("index % SERVICE_PALETTE.length");
});
