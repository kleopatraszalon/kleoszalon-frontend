import fs from'node:fs';
import path from'node:path';

describe('Customer Intelligence / Next Best Action v19 contract',()=>{
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/CustomerIntelligencePage.tsx'),'utf8');
 const crm=fs.readFileSync(path.join(process.cwd(),'src/pages/ClientsCRMPage.tsx'),'utf8');
 const sidebar=fs.readFileSync(path.join(process.cwd(),'src/components/Sidebar.tsx'),'utf8');
 test('exposes Customer Intelligence as a real CRM menu and route',()=>{
  expect(sidebar).toContain('Customer Intelligence / Next Best Action');
  expect(sidebar).toContain('/modules/customers/intelligence');
  expect(crm).toContain('view==="intelligence"');
  expect(crm).toContain('CustomerIntelligencePage');
 });
 test('makes Migration Center visible under SaaS admin',()=>{
  expect(sidebar).toContain("name:'SaaS admin'");
  expect(sidebar).toContain('VIR Migrációs Központ v18');
  expect(sidebar).toContain('/admin/saas?workspace=migration-center');
 });
 test('shows explainable and consent-aware NBA controls',()=>{
  expect(page).toContain('Next Best Action');
  expect(page).toContain('/clients/intelligence/overview');
  expect(page).toContain('/clients/intelligence/actions');
  expect(page).toContain('Automatikus küldés');
  expect(page).toContain('marketing_allowed');
  expect(page).toContain('accepted');
  expect(page).toContain('completed');
  expect(page).toContain('dismissed');
 });
});
