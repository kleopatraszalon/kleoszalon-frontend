import fs from "fs";
import path from "path";

describe("Management improvement project workspace", () => {
  const page = fs.readFileSync(path.join(__dirname, "ManagementImprovementPage.tsx"), "utf8");
  const adminRoutes = fs.readFileSync(path.join(__dirname, "..", "routing", "adminRoutes.tsx"), "utf8");
  const routePages = fs.readFileSync(path.join(__dirname, "..", "routing", "routePages.ts"), "utf8");
  const projectTemplate = "/projects/" + String.fromCharCode(36) + "{detail.project.id}";

  test("is routed as a management-only operations module", () => {
    expect(routePages).toContain('export const ManagementImprovementPage = lazy(() => import("../pages/ManagementImprovementPage"))');
    expect(adminRoutes).toContain('path: "/operations/improvement"');
    expect(adminRoutes).toContain('R(MANAGEMENT, <ManagementImprovementPage />)');
  });

  test("uses the database-backed improvement API for projects CAPA KPI approval and audit", () => {
    for (const marker of [
      "/transactions/operations-quality/improvement",
      projectTemplate + "/actions",
      projectTemplate + "/kpis",
      "request-approval",
      'workflow("approve")',
      'workflow("reject")',
      'workflow("close")',
      "detail.audit.map",
      "analysis_data",
      "owner_employee_id",
      "due_date",
      "before_value",
      "after_value",
    ]) expect(page).toContain(marker);
  });

  test("locks project evidence while approval is pending or approved", () => {
    expect(page).toContain('detail?.project.approval_state === "pending" || detail?.project.approval_state === "approved"');
    expect(page).toContain("Bizonyíték zárolva");
    expect(page).toContain("disabled={evidenceLocked}");
  });

  test("maintains a structured and audit-backed evidence register inside immutable analysis data", () => {
    for (const marker of [
      "type EvidenceItem",
      "projectEvidence",
      "safeEvidenceUrl",
      "analysis_data: { ...(detail.project.analysis_data || {}), evidence: next }",
      "Evidencia / bizonyítékok",
      "Dokumentumazonosító / hivatkozási szám",
      'rel="noreferrer noopener"',
      "Bizonyíték hozzáadva és auditálva.",
    ]) expect(page).toContain(marker);
    expect(page).toContain('raw.startsWith("/uploads/")');
    expect(page).toContain('["http:", "https:"]');
  });

  test("captures lessons learned and standardization in the locked project evidence payload", () => {
    expect(page).toContain("lessons_learned");
    expect(page).toContain("Tanulságok / standardizálás");
    expect(page).toContain("Mit kell szabványosítani, oktatni vagy más telephelyre kiterjeszteni?");
  });
});
