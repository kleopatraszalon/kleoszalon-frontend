import fs from "fs";
import path from "path";

describe("Logisztika product taxonomy UI", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "src/pages/Logisztika.tsx"), "utf8");

  test("stock view exposes group and category metadata", () => {
    expect(page).toContain("product_group_name");
    expect(page).toContain("product_category_name");
    expect(page).toContain("product_type_name");
    expect(page).toContain("Összes termékcsoport");
    expect(page).toContain("Összes kategória");
  });

  test("movement product selector is grouped by taxonomy", () => {
    expect(page).toContain("productOptionGroups");
    expect(page).toContain("<optgroup");
    expect(page).toContain("taxonomyLabel");
    expect(page).toContain("Csoport / kategória");
  });

  test("search includes taxonomy text", () => {
    expect(page).toContain('${x.product_type_name || ""} ${x.product_group_name || ""} ${x.product_category_name || ""}');
  });
});
