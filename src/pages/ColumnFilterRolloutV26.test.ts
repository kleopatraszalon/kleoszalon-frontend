import fs from "fs";
import path from "path";

describe("KLEO column-filter rollout v26", () => {
  const audit = fs.readFileSync(path.join(__dirname, "AuditLogPage.tsx"), "utf8");
  const archive = fs.readFileSync(path.join(__dirname, "ArchiveCenterPage.tsx"), "utf8");

  test("audit table uses shared AND filter engine with header controls", () => {
    expect(audit).toContain('applyColumnFilters(rows, localFilters, locale)');
    expect(audit).toContain('aria-label="audit-module-filter"');
    expect(audit).toContain('aria-label="audit-action-filter"');
    expect(audit).toContain('aria-label="audit-severity-filter"');
    expect(audit).toContain('aria-label="audit-object-filter"');
    expect(audit).toContain('count={filteredRows.length}');
  });

  test("archive table uses shared AND filter engine with per-column controls", () => {
    expect(archive).toContain('applyColumnFilters(rows, filters, locale)');
    expect(archive).toContain('aria-label="archive-entity-filter"');
    expect(archive).toContain('aria-label="archive-name-filter"');
    expect(archive).toContain('aria-label="archive-date-filter"');
    expect(archive).toContain('aria-label="archive-user-filter"');
    expect(archive).toContain('aria-label="archive-reason-filter"');
    expect(archive).toContain('filteredRows.length');
  });
});
