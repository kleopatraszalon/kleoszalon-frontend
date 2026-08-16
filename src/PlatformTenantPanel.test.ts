import fs from'fs';
import path from'path';

describe('Platform tenant admin UI contract',()=>{
 const panel=fs.readFileSync(path.join(process.cwd(),'src/pages/PlatformTenantPanel.tsx'),'utf8');
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/SaasFranchiseAdminPage.tsx'),'utf8');
 test('uses platform tenant APIs and hides itself on forbidden access',()=>{
  expect(panel).toContain('/saas/platform/tenants');
  expect(panel).toContain('status===403');
  expect(page).toContain('<PlatformTenantPanel/>');
 });
 test('supports tenant creation and lifecycle status control',()=>{
  expect(panel).toContain('Új tenant létrehozása');
  expect(panel).toContain('plan_code');
  expect(panel).toContain('/status');
  expect(panel).toContain("r.slug==='kleopatra'");
 });
 test('supports one-click admin, location and plan-module provisioning',()=>{
  expect(panel).toContain('Egykattintásos provisioning');
  expect(panel).toContain('auto_invite_admin');
  expect(panel).toContain('admin_email');
  expect(panel).toContain('provision_location');
  expect(panel).toContain('location_name');
  expect(panel).toContain('location_city');
  expect(panel).toContain('apply_plan_modules');
  expect(panel).toContain('Csomag moduljainak automatikus beállítása');
  expect(panel).toContain('Első admin automatikus meghívása');
  expect(panel).toContain('Alap telephely létrehozása');
 });
 test('shows provisioning feedback and derived onboarding state',()=>{
  expect(panel).toContain('admin_invitation');
  expect(panel).toContain('default_location');
  expect(panel).toContain('plan_modules');
  expect(panel).toContain('onboarding_progress');
  expect(panel).toContain('onboarding_next_step');
 });
});
