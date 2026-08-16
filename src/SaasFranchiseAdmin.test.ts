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

  test('page consumes tenant, location, franchise and subscription APIs', () => {
    expect(page).toContain('/saas/context');
    expect(page).toContain('/saas/locations');
    expect(page).toContain('/saas/franchise-networks');
    expect(page).toContain('/saas/subscription');
    expect(page).toContain('/saas/subscription/change-plan');
    expect(page).toContain('/saas/subscription/cancel');
    expect(page).toContain('/saas/subscription/reactivate');
  });

  test('subscription controls preserve provider and tenant-role safety', () => {
    expect(page).toContain('external_subscription_id');
    expect(page).toContain("['owner','admin'].includes");
    expect(page).toContain('at_period_end:true');
    expect(page).not.toContain('at_period_end:false');
  });

  test('franchise finance panel reports rates without inventing booked revenue', () => {
    expect(page).toContain('Franchise pénzügyi összesítő');
    expect(page).toContain('Súlyozott royalty');
    expect(page).toContain('nem könyvel tényleges royalty-bevételt');
  });
});
