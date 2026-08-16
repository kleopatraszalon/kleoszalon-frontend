import fs from 'node:fs';
import path from 'node:path';

describe('SaaS / Franchise admin wiring', () => {
  const app = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.join(__dirname, 'components/Sidebar.tsx'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, 'pages/SaasFranchiseAdminPage.tsx'), 'utf8');

  test('admin-only route is registered', () => {
    expect(app).toContain('const SaasFranchiseAdminPage = lazy');
    expect(app).toContain('path: "/admin/saas"');
    expect(app).toContain('R(ADMIN, <SaasFranchiseAdminPage />)');
  });

  test('admin sidebar exposes the SaaS franchise center but manager extras do not', () => {
    expect(sidebar).toContain("name:'SaaS / Franchise központ'");
    expect(sidebar).toContain("route:'/admin/saas'");
    expect(sidebar).toContain('extras=[WALLBOARD,SPEC_PARITY,SAAS_ADMIN]');
    expect(sidebar).toContain('if(isManager){const extras=[WALLBOARD,SPEC_PARITY]');
  });

  test('page consumes tenant, location and franchise APIs', () => {
    expect(page).toContain('/saas/context');
    expect(page).toContain('/saas/locations');
    expect(page).toContain('/saas/franchise-networks');
  });
});
