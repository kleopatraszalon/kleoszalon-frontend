import fs from "fs";
import path from "path";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

test("Vite and Vitest are the sole frontend runtime toolchain", () => {
  const pkg = JSON.parse(read("package.json"));
  expect(pkg.scripts.start).toBe("vite");
  expect(pkg.scripts.build).toBe("vite build --outDir build");
  expect(pkg.scripts.test).toBe("vitest run");
  expect(pkg.scripts["test:watch"]).toBe("vitest");
  expect(pkg.scripts["start:cra"]).toBeUndefined();
  expect(pkg.scripts["build:cra"]).toBeUndefined();
  expect(pkg.scripts["test:cra"]).toBeUndefined();
  expect(pkg.devDependencies?.["react-scripts"]).toBeUndefined();
  expect(pkg.devDependencies?.["eslint-config-react-app"]).toBe("^7.0.1");
  expect(pkg.devDependencies?.tailwindcss).toBe("^3.4.19");
  expect(pkg.devDependencies?.autoprefixer).toBe("^10.4.24");
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
