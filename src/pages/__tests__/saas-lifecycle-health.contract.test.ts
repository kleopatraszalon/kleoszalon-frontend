import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(path.resolve(__dirname,'../PlatformTenantPanel.tsx'),'utf8');

describe('SaaS lifecycle health UI',()=>{
 it('shows tenant health, trial and intervention KPIs',()=>{
  expect(source).toContain('Tenant health figyelmeztetések');
  expect(source).toContain('Beavatkozást igényel');
  expect(source).toContain('trial_days_left');
 });
 it('supports platform plan changes through protected subscription API',()=>{
  expect(source).toContain('/subscription`');
  expect(source).toContain('apply_plan_modules:true');
  expect(source).toContain('changePlan');
 });
 it('keeps lifecycle controls for suspend and cancel',()=>{
  expect(source).toContain('Felfüggesztett');
  expect(source).toContain('Megszüntetett');
  expect(source).toContain('changeStatus');
 });
});
