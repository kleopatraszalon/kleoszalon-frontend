import fs from 'node:fs';
import {describe,it,expect} from 'vitest';
describe('VIR P4 workforce optimizer',()=>{
 it('wires a management protected P4 workspace',()=>{
  const routes=fs.readFileSync('src/routing/adminRoutes.tsx','utf8');
  const pages=fs.readFileSync('src/routing/routePages.ts','utf8');
  expect(routes).toContain('/admin/vir/p4');expect(routes).toContain('R(MANAGEMENT, <VirP4Page />)');expect(pages).toContain('VirP4Page');
 });
 it('uses the P4 API and keeps scheduling advisory',()=>{
  const api=fs.readFileSync('src/api/virP4.ts','utf8');const page=fs.readFileSync('src/pages/VirP4Page.tsx','utf8');
  expect(api).toContain('/vir/p4/workforce-optimizer');expect(page).toContain('21. Workforce Optimizer');expect(page).toContain('Automatikus beosztás nélkül');expect(page).toContain('skill_coverage');
 });
});
