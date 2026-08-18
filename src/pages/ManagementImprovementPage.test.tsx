import fs from "fs";
import path from "path";

describe("Management improvement project workspace", () => {
  const page = fs.readFileSync(path.join(__dirname, "ManagementImprovementPage.tsx"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "App.tsx"), "utf8");

  test("is routed as a management-only operations module", () => {
    expect(app).toContain('const ManagementImprovementPage = lazy(() => import("./pages/ManagementImprovementPage"))');
    expect(app).toContain('path: "/operations/improvement"');
    expect(app).toContain('R(MANAGEMENT, <ManagementImprovementPage />)');
  });

  test("uses the database-backed improvement API for projects CAPA KPI approval and audit", () => {
    for (const marker of [
      '/transactions/operations-quality/improvement',
      '/projects/${detail.project.id}/actions',
      '/projects/${detail.project.id}/kpis',
      'request-approval',
      'workflow("approve")',
      'workflow("reject")',
      'workflow("close")',
      'detail.audit.map',
      'analysis_data',
      'owner_employee_id',
      'due_date',
      'before_value',
      'after_value',
    ]) expect(page).toContain(marker);
  });

  test("locks project evidence while approval is pending or approved", () => {
    expect(page).toContain('detail?.project.approval_state === "pending" || detail?.project.approval_state === "approved"');
    expect(page).toContain('Bizonyíték zárolva');
    expect(page).toContain('disabled={evidenceLocked}');
  });
});
