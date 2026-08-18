import fs from'node:fs';
import path from'node:path';

describe('SaaS commercial model',()=>{
 const catalogue=fs.readFileSync(path.join(__dirname,'saasCommercialModel.ts'),'utf8');
 const panel=fs.readFileSync(path.join(__dirname,'pages/SaasCommercialModelPanel.tsx'),'utf8');
 const composition=fs.readFileSync(path.join(__dirname,'pages/SaasFranchiseAdminPage.tsx'),'utf8');

 test('approved package prices and annual terms are fixed in the UI contract',()=>{
  expect(catalogue).toContain("monthlyPrice:29900,annualPrice:299000");
  expect(catalogue).toContain("monthlyPrice:59900,annualPrice:599000");
  expect(catalogue).toContain("monthlyPrice:149900,annualPrice:1499000");
  expect(catalogue).toContain("monthlyPrice:299900,annualPrice:2999000");
  expect(catalogue).toContain('ANNUAL_BILLING_DISCOUNT_MONTHS=2');
 });

 test('PRO is the recommended revenue package and booking commission is zero',()=>{
  expect(catalogue).toContain("code:'pro',name:'PRO'");
  expect(catalogue).toContain('recommended:true');
  expect(catalogue).toContain('BOOKING_COMMISSION_PERCENT=0');
 });

 test('commercial panel exposes pricing, add-ons, revenue simulation and SaaS KPI targets',()=>{
  expect(panel).toContain('Árazás és monetizáció');
  expect(panel).toContain('Kiegészítő bevételek');
  expect(panel).toContain('Bevételi szimuláció');
  expect(panel).toContain('Trial → Paid');
  expect(panel).toContain('CAC payback');
 });

 test('SaaS admin composition mounts the commercial model first',()=>{
  expect(composition).toContain('import SaasCommercialModelPanel');
  expect(composition.indexOf('<SaasCommercialModelPanel/>')).toBeLessThan(composition.indexOf('<PlatformTenantPanel/>'));
 });
});
