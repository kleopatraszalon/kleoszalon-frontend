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
});
