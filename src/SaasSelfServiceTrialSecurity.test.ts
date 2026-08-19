import fs from'node:fs';
import path from'node:path';

describe('SaaS self-service signup security',()=>{
 const page=fs.readFileSync(path.join(__dirname,'pages/SaasTrialSignup.tsx'),'utf8');
 const register=fs.readFileSync(path.join(__dirname,'pages/Register.tsx'),'utf8');
 test('signup does not collect or send an admin password before email verification',()=>{
  expect(page).not.toContain("name=\"password\"");
  expect(page).not.toContain('password:');
  expect(page).toContain('owner_email');
 });
 test('admin password remains in the existing one-time invitation activation flow',()=>{
  expect(register).toContain('tenant_invite');
  expect(register).toContain('admin-invitations');
  expect(register).toContain('type="password"');
 });
 test('bot trap and mandatory legal confirmations remain present',()=>{
  expect(page).toContain('saas-honeypot');
  expect(page).toContain('terms_accepted');
  expect(page).toContain('privacy_accepted');
 });
});
