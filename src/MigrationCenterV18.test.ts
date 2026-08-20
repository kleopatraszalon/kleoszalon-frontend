import fs from'node:fs';
import path from'node:path';

describe('VIR Migration Center v19 contract',()=>{
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/MigrationCenterPage.tsx'),'utf8');
 const app=fs.readFileSync(path.join(process.cwd(),'src/App.tsx'),'utf8');
 const saas=fs.readFileSync(path.join(process.cwd(),'src/pages/SaasFranchiseAdminPage.tsx'),'utf8');
 test('keeps Altegio visible even with legacy native import duplication',()=>{
  expect(page).toContain('Altegio');
  expect(page).toContain('NATÍV IMPORT IS MEGMARAD');
  expect(page).toContain('legacy_tools');
  expect(page).toContain('Natív Altegio');
 });
 test('supports the controlled migration workflow',()=>{
  for(const value of ['Booksy','Fresha','Excel','CSV','Kézi felülvizsgálat','Duplikált kihagyása','Egyesítés','Rollback','Evidence'])expect(page).toContain(value);
  expect(page).toContain('/vir/migration-center/runs');
  expect(page).toContain('Staging + előnézet');
 });
 test('renders the complete schema-driven VIR entity catalog returned by the backend',()=>{
  expect(page).toContain('p.data?.entities');
  expect(page).toContain('Migrálandó VIR adattábla');
  expect(page).toContain('entity-catalog');
  expect(page).toContain('apply_supported');
  expect(page).toContain('blocked_reason');
  expect(page).toContain('VIR MIGRÁCIÓS KÖZPONT v19');
  expect(page).not.toContain('detail.run.entity_type==="appointments"');
 });
 test('uses the existing protected SaaS admin route as a dedicated workspace',()=>{
  expect(app).toContain('path: "/admin/saas"');
  expect(saas).toContain('workspace=migration-center');
  expect(saas).toContain('MigrationCenterPage');
  expect(saas).toContain('VIR Migrációs Központ v19');
 });
});
