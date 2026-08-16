import fs from'fs';
import path from'path';

describe('Tenant onboarding wizard contract',()=>{
 const panel=fs.readFileSync(path.join(process.cwd(),'src/pages/TenantOnboardingPanel.tsx'),'utf8');
 const platform=fs.readFileSync(path.join(process.cwd(),'src/pages/PlatformTenantPanel.tsx'),'utf8');
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/SaasFranchiseAdminPage.tsx'),'utf8');
 test('is composed into the SaaS admin page and uses platform onboarding APIs',()=>{
  expect(page).toContain('<TenantOnboardingPanel/>');
  expect(page).toContain('<PlatformTenantPanel/>');
  expect(panel).toContain('/saas/platform/tenants');
  expect(panel).toContain('/onboarding');
  expect(panel).toContain('/complete');
 });
 test('covers every required activation step and derived readiness',()=>{
  for(const key of ['company','location','branding','modules','subscription'])expect(panel).toContain(`save('${key}'`);
  expect(panel).toContain('admin-invitation');
  expect(panel).toContain('state.checklist');
  expect(panel).toContain('state.progress');
  expect(panel).toContain('state.ready');
  expect(panel).toContain('Üzemkész');
 });
 test('supports plan, module, branding and first-admin configuration',()=>{
  expect(panel).toContain('PLANS');
  expect(panel).toContain('MODULES');
  expect(panel).toContain('Első admin e-mail');
  expect(panel).toContain('Egyedi domain');
  expect(panel).toContain('14 napos próba');
 });
 test('platform dashboard exposes provisioning progress, next step and pending admin invite',()=>{
  expect(platform).toContain('onboarding_progress');
  expect(platform).toContain('onboarding_ready');
  expect(platform).toContain('onboarding_next_step');
  expect(platform).toContain('admin_invitation_status');
  expect(platform).toContain('Admin meghívó függőben');
  expect(platform).toContain('aktiválásra vár');
  expect(platform).toContain('Új tenant + onboarding');
 });
});
