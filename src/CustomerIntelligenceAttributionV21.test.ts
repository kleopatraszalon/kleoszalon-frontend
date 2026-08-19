import fs from'node:fs';
import path from'node:path';

describe('Customer Intelligence revenue attribution v21',()=>{
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/CustomerIntelligencePage.tsx'),'utf8');
 test('shows the closed loop funnel',()=>{
  expect(page).toContain('NBA → Marketing → Foglalás → Bevétel');
  for(const marker of ['Kiküldött NBA','Foglalási landing','Attribútált foglalás','Konverzió','Fizetett bevétel','Bevétel / kiküldés'])expect(page).toContain(marker);
 });
 test('loads tenant-scoped attribution analytics',()=>{
  expect(page).toContain('/clients/intelligence/attribution/summary?days=30');
  expect(page).toContain('action_rows');
  expect(page).toContain('paid_revenue');
  expect(page).toContain('conversion_rate_percent');
 });
 test('keeps v20 marketing automation controls intact',()=>{
  for(const marker of ['Marketing Automation sor','Jóváhagyás','Küldés most','Push provider hiányában'])expect(page).toContain(marker);
 });
});
