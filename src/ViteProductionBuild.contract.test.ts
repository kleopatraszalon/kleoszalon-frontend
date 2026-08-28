import fs from "fs";
import path from "path";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

test("Vite is the default development and production builder while CRA remains an explicit fallback", () => {
  const pkg = JSON.parse(read("package.json"));
  expect(pkg.scripts.start).toBe("vite");
  expect(pkg.scripts.build).toBe("vite build --outDir build");
  expect(pkg.scripts["start:cra"]).toBe("react-scripts start");
  expect(pkg.scripts["build:cra"]).toBe("react-scripts build");
  expect(pkg.scripts.test).toBe("react-scripts test");
});

test("Vite production output preserves the release-control manifest contract", () => {
  const config = read("vite.config.ts");
  const normalizer = read("scripts/normalize-vite-manifest.js");
  const pkg = JSON.parse(read("package.json"));

  expect(config).toContain('manifest: "asset-manifest.json"');
  expect(pkg.scripts.postbuild).toContain("normalize-vite-manifest.js build");
  expect(normalizer).toContain("vite-manifest.json");
  expect(normalizer).toContain("Vite manifest does not contain a JavaScript bundle");
  expect(normalizer).toContain("JSON.stringify({ files }");
});
