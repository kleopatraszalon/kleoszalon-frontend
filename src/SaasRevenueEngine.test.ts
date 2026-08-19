import fs from'node:fs';
import path from'node:path';

describe('SaaS Revenue Engine v16',()=>{
 const panel=fs.readFileSync(path.join(__dirname,'pages/SaasRevenueEnginePanel.tsx'),'utf8');
 const composition=fs.readFileSync(path.join(__dirname,'pages/SaasFranchiseAdminPage.tsx'),'utf8');

 test('Revenue Engine exposes checkout, billing portal, coupons and dunning state',()=>{
  expect(panel).toContain('/saas/revenue/checkout');
  expect(panel).toContain('/saas/revenue/portal');
  expect(panel).toContain('/saas/revenue/coupons/validate');
  expect(panel).toContain('Grace period vége');
  expect(panel).toContain('Következő retry');
  expect(panel).toContain('0% foglalási jutalék');
 });

 test('payment actions are gated by provider and tax readiness',()=>{
  expect(panel).toContain("!provider?.configured||!provider?.tax_configured");
  expect(panel).toContain('NINCS KONFIGURÁLVA');
  expect(panel).toContain('Adó konfiguráció');
 });

 test('SaaS admin composition mounts the Revenue Engine',()=>{
  expect(composition).toContain('import SaasRevenueEnginePanel');
  expect(composition).toContain('<SaasRevenueEnginePanel/>');
 });
});
