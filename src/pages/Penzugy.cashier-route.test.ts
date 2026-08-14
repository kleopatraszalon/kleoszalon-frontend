import fs from "fs";
import path from "path";

describe("Finance v5 cashier route adapter", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/pages/Penzugy.tsx"), "utf8");

  test("keeps the dedicated cashier route on the operational cashier screen", () => {
    expect(source).toContain('pathname === "/finance/cashier"');
    expect(source).toContain('pathname.startsWith("/finance/cashier/")');
    expect(source).toContain("return legacyFlow ? <PenzugyLegacy /> : <FinanceWorkspacePage />");
  });

  test("keeps checkout and invoice routes on the legacy operational flow", () => {
    expect(source).toContain('pathname === "/finance/checkout"');
    expect(source).toContain('pathname.startsWith("/finance/invoices/")');
  });
});
