import fs from'fs';
import path from'path';

describe('Tenant onboarding wizard contract',()=>{
 const panel=fs.readFileSync(path.join(process.cwd(),'src/pages/TenantOnboardingPanel.tsx'),'utf8');
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/SaasFranchiseAdminPage.tsx'),'utf8');
 const register=fs.readFileSync(path.join(process.cwd(),'src/pages/Register.tsx'),'utf8');
 test('is composed into the SaaS admin page and uses platform onboarding APIs',()=>{
  expect(page).toContain('<TenantOnboardingPanel/>');
  expect(panel).toContain('/saas/platform/tenants');
  expect(panel).toContain('/onboarding');
  expect(panel).toContain('/complete');
 });
 test('covers every required activation step and derived readiness',()=>{
  for(const key of ['company','location','branding','modules','subscription'])expect(panel).toContain(`save('${key}'`);
  expect(panel).toContain('admin-invitation');
  expect(panel).toContain('inviteAdmin');
  expect(panel).toContain('state.checklist');
  expect(panel).toContain('state.progress');
  expect(panel).toContain('state.ready');
  expect(panel).toContain('Üzemkész');
 });
 test('admin invitation remains pending until recipient activation',()=>{
  expect(panel).toContain('Meghívó újraküldése');
  expect(panel).toContain("invitation?.status==='pending'");
  expect(panel).toContain('Admin aktiválva');
  expect(register).toContain("params.get('tenant_invite')");
  expect(register).toContain('/saas/admin-invitations/');
  expect(register).toContain('/accept');
  expect(register).toContain('Admin fiók aktiválása');
 });
 test('supports plan, module and branding configuration',()=>{
  expect(panel).toContain('PLANS');
  expect(panel).toContain('MODULES');
  expect(panel).toContain('Első admin e-mail');
  expect(panel).toContain('Egyedi domain');
  expect(panel).toContain('14 napos próba');
 });
});
