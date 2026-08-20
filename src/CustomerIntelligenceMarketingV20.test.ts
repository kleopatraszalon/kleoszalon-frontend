import fs from'node:fs';
import path from'node:path';

describe('Customer Intelligence -> Marketing Automation v20',()=>{
 const page=fs.readFileSync(path.join(process.cwd(),'src/pages/CustomerIntelligencePage.tsx'),'utf8');
 test('keeps the NBA marketing bridge and four controlled channels',()=>{
  expect(page).toContain('NBA → Marketing Automation');
  expect(page).toContain('Marketing Automation sor');
  for(const marker of ['E-mail','SMS','Push','Visszahívás'])expect(page).toContain(marker);
 });
 test('accepts the NBA before creating a marketing job',()=>{
  expect(page).toContain('/clients/intelligence/actions');
  expect(page).toContain('status:"accepted"');
  expect(page).toContain('/clients/intelligence/marketing/jobs');
 });
 test('exposes approval, send and completion controls through the shared job action',()=>{
  for(const marker of ['Jóváhagyás','Küldés most','Lezárás','Feladat létrehozása'])expect(page).toContain(marker);
  expect(page).toContain('jobAction("approve")');
  expect(page).toContain('jobAction("send")');
  expect(page).toContain('jobAction("complete")');
  expect(page).toContain('const jobAction=async(action:');
 });
 test('explains consent recheck and push fail closed behavior',()=>{
  expect(page).toContain('backend újra ellenőrzi a hozzájárulást');
  expect(page).toContain('Push provider hiányában');
  expect(page).toContain('waiting_provider');
 });
});
