import fs from'node:fs';
import path from'node:path';

describe('VIR Migration Center v18 contract',()=>{
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
 test('has a dedicated admin entry point without replacing the legacy app',()=>{
  expect(app).toContain('/admin/migration-center');
  expect(app).toContain('./AppLegacy');
  expect(saas).toContain('/admin/migration-center');
  expect(saas).toContain('VIR Migrációs Központ v18');
 });
});
