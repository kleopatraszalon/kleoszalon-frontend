import fs from'node:fs';
import path from'node:path';

describe('SaaS self-service trial',()=>{
 const page=fs.readFileSync(path.join(__dirname,'pages/SaasTrialSignup.tsx'),'utf8');
 const register=fs.readFileSync(path.join(__dirname,'pages/Register.tsx'),'utf8');
 test('public register entry can switch into SaaS trial mode',()=>{
  expect(register).toContain("params.get('saas_trial')==='1'");
  expect(register).toContain('<SaasTrialSignup/>');
 });
 test('trial signup loads only public self-service plans and uses idempotency',()=>{
  expect(page).toContain('/saas/self-service/plans');
  expect(page).toContain('/saas/self-service/signup');
  expect(page).toContain("'Idempotency-Key'");
 });
 test('form includes company, first location and mandatory legal consents',()=>{
  expect(page).toContain('company_name');
  expect(page).toContain('location_name');
  expect(page).toContain('terms_accepted');
  expect(page).toContain('privacy_accepted');
 });
 test('UI clearly states activation-gated 14 day trial and zero immediate payment',()=>{
  expect(page).toContain('14 napos próbaidővel');
  expect(page).toContain('csak az e-mailes tulajdonosi aktiválás után indul');
  expect(page).toContain('0 Ft');
 });
});
