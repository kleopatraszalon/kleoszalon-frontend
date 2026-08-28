import fs from "fs";
import path from "path";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

test("font size control stays directly beside the topbar language selector", () => {
  const topbar = read("src/components/AppTopbar.tsx");
  const switcher = read("src/components/LanguageSwitcher.tsx");
  const labelEnd = switcher.lastIndexOf("</label>");
  const controlRender = switcher.lastIndexOf("<FontScaleControl/>");

  expect(topbar).toMatch(/<LanguageSwitcher\s+compact\s*\/>/);
  expect(controlRender).toBeGreaterThan(labelEnd);
  expect(switcher.slice(labelEnd, controlRender)).not.toContain("</div>");
});

test("saved scale is initialized before the application is rendered", () => {
  const indexSource = read("src/index.tsx");
  const initializeAt = indexSource.indexOf("initializeFontScale();");
  const renderAt = indexSource.indexOf("createRoot(container).render(");

  expect(initializeAt).toBeGreaterThanOrEqual(0);
  expect(renderAt).toBeGreaterThan(initializeAt);
});
